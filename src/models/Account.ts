/**
 * 账户模型 - 管理代币账户和交易记录
 * 
 * 修复并发竞态条件问题：
 * 1. 添加版本号实现乐观锁（Optimistic Locking）
 * 2. 使用 async-mutex 确保同一账户操作串行化
 * 3. 转账操作使用有序锁避免死锁
 */

import { Account, Transaction, TransactionStatus, TransactionType } from '../types';
import { Mutex, MutexInterface } from 'async-mutex';

export class AccountModel {
  private accounts: Map<string, Account> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private userAccounts: Map<string, string> = new Map(); // userId -> accountId
  
  // 并发控制：使用 async-mutex 替代 busy wait
  private accountMutexes: Map<string, Mutex> = new Map(); // userId -> Mutex

  /**
   * 获取或创建账户的 Mutex
   */
  private getMutex(userId: string): Mutex {
    if (!this.accountMutexes.has(userId)) {
      this.accountMutexes.set(userId, new Mutex());
    }
    return this.accountMutexes.get(userId)!;
  }

  /**
   * 使用锁执行异步操作
   */
  private async withLock<T>(userId: string, operation: () => T | Promise<T>): Promise<T> {
    const mutex = this.getMutex(userId);
    const release = await mutex.acquire();
    try {
      return await operation();
    } finally {
      release();
    }
  }

  /**
   * 验证版本号并更新（CAS 操作）
   */
  private validateAndUpdateBalance(
    account: Account,
    expectedVersion: number,
    updateFn: () => void
  ): void {
    if (account.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected for account ${account.userId}. ` +
        `Expected version ${expectedVersion}, but got ${account.version}`
      );
    }
    updateFn();
    account.version = (account.version || 0) + 1;
    account.updatedAt = new Date();
  }

  /**
   * 创建账户
   */
  async createAccount(userId: string, initialBalance: number = 0): Promise<Account> {
    return this.withLock(userId, () => {
      // 检查是否已存在
      if (this.userAccounts.has(userId)) {
        const existingAccountId = this.userAccounts.get(userId)!;
        return this.accounts.get(existingAccountId)!;
      }

      const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const account: Account = {
        id: accountId,
        userId,
        balance: initialBalance,
        frozenBalance: 0,
        totalEarned: initialBalance > 0 ? initialBalance : 0, // 如果有初始余额，计入 totalEarned
        totalSpent: 0,
        version: 0, // 初始版本号
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.accounts.set(accountId, account);
      this.userAccounts.set(userId, accountId);
      
      return account;
    });
  }

  /**
   * 根据用户ID获取账户
   */
  getAccountByUserId(userId: string): Account | undefined {
    const accountId = this.userAccounts.get(userId);
    if (!accountId) return undefined;
    return this.accounts.get(accountId);
  }

  /**
   * 根据账户ID获取账户
   */
  getAccountById(accountId: string): Account | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * 获取或创建账户
   */
  async getOrCreateAccount(userId: string): Promise<Account> {
    let account = this.getAccountByUserId(userId);
    if (!account) {
      account = await this.createAccount(userId);
    }
    return account;
  }

  /**
   * 增加余额（带锁和版本控制）
   */
  async addBalance(userId: string, amount: number, description: string, type: TransactionType): Promise<Transaction> {
    return this.withLock(userId, async () => {
      const account = await this.getOrCreateAccount(userId);
      const currentVersion = account.version || 0;

      this.validateAndUpdateBalance(account, currentVersion, () => {
        account.balance += amount;
        if (type !== TransactionType.PENALTY) {
          account.totalEarned = (account.totalEarned || 0) + amount;
        }
      });

      const transaction = this.createTransaction({
        fromUserId: 'system',
        toUserId: userId,
        amount,
        type,
        status: TransactionStatus.SUCCESS,
        description,
        balanceAfter: account.balance
      });

      return transaction;
    });
  }

  /**
   * 扣减余额（带锁和版本控制）
   */
  async deductBalance(userId: string, amount: number, description: string, type: TransactionType): Promise<Transaction> {
    return this.withLock(userId, async () => {
      const account = this.getAccountByUserId(userId);
      if (!account) {
        throw new Error('Account not found');
      }

      const currentVersion = account.version || 0;

      // 原子操作：检查 + 扣减
      this.validateAndUpdateBalance(account, currentVersion, () => {
        if (account.balance < amount) {
          throw new Error('Insufficient balance');
        }
        account.balance -= amount;
        account.totalSpent = (account.totalSpent || 0) + amount;
      });

      const transaction = this.createTransaction({
        fromUserId: userId,
        toUserId: 'system',
        amount,
        type,
        status: TransactionStatus.SUCCESS,
        description,
        balanceAfter: account.balance
      });

      return transaction;
    });
  }

  /**
   * 冻结余额（带锁和版本控制）
   */
  async freezeBalance(userId: string, amount: number): Promise<Transaction> {
    return this.withLock(userId, async () => {
      const account = this.getAccountByUserId(userId);
      if (!account) {
        throw new Error('Account not found');
      }

      const currentVersion = account.version || 0;

      // 原子操作：检查 + 冻结
      this.validateAndUpdateBalance(account, currentVersion, () => {
        if (account.balance < amount) {
          throw new Error('Insufficient balance');
        }
        account.balance -= amount;
        account.frozenBalance += amount;
      });

      const transaction = this.createTransaction({
        fromUserId: userId,
        toUserId: userId,
        amount,
        type: TransactionType.FROZEN,
        status: TransactionStatus.SUCCESS,
        description: 'Freeze balance',
        balanceAfter: account.balance
      });

      return transaction;
    });
  }

  /**
   * 解冻余额（带锁和版本控制）
   */
  async unfreezeBalance(userId: string, amount: number): Promise<Transaction> {
    return this.withLock(userId, async () => {
      const account = this.getAccountByUserId(userId);
      if (!account) {
        throw new Error('Account not found');
      }

      const currentVersion = account.version || 0;

      // 原子操作：检查 + 解冻
      this.validateAndUpdateBalance(account, currentVersion, () => {
        if (account.frozenBalance < amount) {
          throw new Error('Insufficient frozen balance');
        }
        account.frozenBalance -= amount;
        account.balance += amount;
      });

      const transaction = this.createTransaction({
        fromUserId: userId,
        toUserId: userId,
        amount,
        type: TransactionType.UNFROZEN,
        status: TransactionStatus.SUCCESS,
        description: 'Unfreeze balance',
        balanceAfter: account.balance
      });

      return transaction;
    });
  }

  /**
   * 转账（带双重锁和版本控制）
   */
  async transfer(fromUserId: string, toUserId: string, amount: number, description: string): Promise<Transaction> {
    // 按用户ID排序加锁，避免死锁
    const [firstUserId, secondUserId] = [fromUserId, toUserId].sort();
    
    return this.withLock(firstUserId, async () => {
      return this.withLock(secondUserId, async () => {
        const fromAccount = this.getAccountByUserId(fromUserId);
        if (!fromAccount) {
          throw new Error('Source account not found');
        }

        const fromVersion = fromAccount.version || 0;

        // 原子操作：检查源账户余额
        this.validateAndUpdateBalance(fromAccount, fromVersion, () => {
          if (fromAccount.balance < amount) {
            throw new Error('Insufficient balance');
          }
          fromAccount.balance -= amount;
          fromAccount.totalSpent = (fromAccount.totalSpent || 0) + amount;
        });

        const toAccount = await this.getOrCreateAccount(toUserId);
        const toVersion = toAccount.version || 0;

        // 原子操作：更新目标账户
        this.validateAndUpdateBalance(toAccount, toVersion, () => {
          toAccount.balance += amount;
          toAccount.totalEarned = (toAccount.totalEarned || 0) + amount;
        });

        const transaction = this.createTransaction({
          fromUserId,
          toUserId,
          amount,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.SUCCESS,
          description,
          balanceAfter: fromAccount.balance
        });

        return transaction;
      });
    });
  }

  /**
   * 创建交易记录
   */
  private createTransaction(params: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    description: string;
    balanceAfter?: number;
  }): Transaction {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: Transaction = {
      id: transactionId,
      fromUserId: params.fromUserId,
      toUserId: params.toUserId,
      amount: params.amount,
      type: params.type,
      status: params.status,
      description: params.description,
      balanceAfter: params.balanceAfter,
      createdAt: new Date()
    };

    this.transactions.set(transactionId, transaction);
    
    return transaction;
  }

  /**
   * 获取交易记录
   */
  getTransaction(transactionId: string): Transaction | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * 获取用户交易历史
   */
  getUserTransactions(userId: string): Transaction[] {
    const transactions: Transaction[] = [];
    for (const tx of this.transactions.values()) {
      if (tx.fromUserId === userId || tx.toUserId === userId) {
        transactions.push(tx);
      }
    }
    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// 导出单例
export const accountModel = new AccountModel();
