/**
 * 账户模型 - 管理代币账户和交易记录
 */

import { Account, Transaction, TransactionStatus, TransactionType } from '../types';
import { validateUserId, validateAmount, validateNonNegativeAmount, validateTransferParams } from '../utils/validators';

export class AccountModel {
  private accounts: Map<string, Account> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private userAccounts: Map<string, string> = new Map(); // userId -> accountId

  /**
   * 创建账户
   */
  createAccount(userId: string): Account {
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const account: Account = {
      id: accountId,
      userId,
      balance: 0,
      frozenBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.accounts.set(accountId, account);
    this.userAccounts.set(userId, accountId);
    
    return account;
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
  getOrCreateAccount(userId: string): Account {
    let account = this.getAccountByUserId(userId);
    if (!account) {
      account = this.createAccount(userId);
    }
    return account;
  }

  /**
   * 增加余额
   */
  addBalance(userId: string, amount: number, description: string, type: TransactionType): Transaction {
    // 验证输入参数
    validateUserId(userId);
    validateAmount(amount, '增加金额');
    
    const account = this.getOrCreateAccount(userId);
    account.balance += amount;
    account.updatedAt = new Date();

    const transaction = this.createTransaction({
      fromUserId: 'system',
      toUserId: userId,
      amount,
      type,
      status: TransactionStatus.SUCCESS,
      description
    });

    return transaction;
  }

  /**
   * 扣减余额
   */
  deductBalance(userId: string, amount: number, description: string, type: TransactionType): Transaction {
    // 验证输入参数
    validateUserId(userId);
    validateAmount(amount, '扣减金额');
    
    const account = this.getAccountByUserId(userId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.balance < amount) {
      throw new Error('Insufficient balance');
    }

    account.balance -= amount;
    account.updatedAt = new Date();

    const transaction = this.createTransaction({
      fromUserId: userId,
      toUserId: 'system',
      amount,
      type,
      status: TransactionStatus.SUCCESS,
      description
    });

    return transaction;
  }

  /**
   * 冻结余额
   */
  freezeBalance(userId: string, amount: number): Transaction {
    // 验证输入参数
    validateUserId(userId);
    validateAmount(amount, '冻结金额');
    
    const account = this.getAccountByUserId(userId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.balance < amount) {
      throw new Error('Insufficient balance');
    }

    account.balance -= amount;
    account.frozenBalance += amount;
    account.updatedAt = new Date();

    const transaction = this.createTransaction({
      fromUserId: userId,
      toUserId: userId,
      amount,
      type: TransactionType.FROZEN,
      status: TransactionStatus.SUCCESS,
      description: 'Freeze balance'
    });

    return transaction;
  }

  /**
   * 解冻余额
   */
  unfreezeBalance(userId: string, amount: number): Transaction {
    // 验证输入参数
    validateUserId(userId);
    validateAmount(amount, '解冻金额');
    
    const account = this.getAccountByUserId(userId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.frozenBalance < amount) {
      throw new Error('Insufficient frozen balance');
    }

    account.frozenBalance -= amount;
    account.balance += amount;
    account.updatedAt = new Date();

    const transaction = this.createTransaction({
      fromUserId: userId,
      toUserId: userId,
      amount,
      type: TransactionType.UNFROZEN,
      status: TransactionStatus.SUCCESS,
      description: 'Unfreeze balance'
    });

    return transaction;
  }

  /**
   * 转账
   */
  transfer(fromUserId: string, toUserId: string, amount: number, description: string): Transaction {
    // 验证输入参数
    validateTransferParams({ fromUserId, toUserId, amount, description });
    
    const fromAccount = this.getAccountByUserId(fromUserId);
    if (!fromAccount) {
      throw new Error('Source account not found');
    }

    if (fromAccount.balance < amount) {
      throw new Error('Insufficient balance');
    }

    const toAccount = this.getOrCreateAccount(toUserId);
    
    fromAccount.balance -= amount;
    fromAccount.updatedAt = new Date();
    
    toAccount.balance += amount;
    toAccount.updatedAt = new Date();

    const transaction = this.createTransaction({
      fromUserId,
      toUserId,
      amount,
      type: TransactionType.TRANSFER,
      status: TransactionStatus.SUCCESS,
      description
    });

    return transaction;
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