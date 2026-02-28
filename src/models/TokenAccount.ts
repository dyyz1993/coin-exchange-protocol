/**
 * 代币账户模型
 * 管理用户的代币余额和交易记录
 */

import type { TokenAccount, Transaction } from '../types';
import { validateUserId, validateAccountId, validateAmount } from '../utils/validators';

export class TokenAccountModel {
  private accounts: Map<string, TokenAccount> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private accountCounter = 1;
  private transactionCounter = 1;

  /**
   * 创建账户
   */
  createAccount(userId: string): TokenAccount {
    // 验证输入参数
    validateUserId(userId);
    
    const account: TokenAccount = {
      id: `acc_${this.accountCounter++}`,
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.accounts.set(account.id, account);
    return account;
  }

  /**
   * 根据用户ID获取账户
   */
  getAccountByUserId(userId: string): TokenAccount | undefined {
    for (const account of this.accounts.values()) {
      if (account.userId === userId) {
        return account;
      }
    }
    return undefined;
  }

  /**
   * 根据账户ID获取账户
   */
  getAccountById(accountId: string): TokenAccount | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * 获取或创建账户
   */
  getOrCreateAccount(userId: string): TokenAccount {
    let account = this.getAccountByUserId(userId);
    if (!account) {
      account = this.createAccount(userId);
    }
    return account;
  }

  /**
   * 增加余额
   */
  addBalance(
    accountId: string,
    amount: number,
    type: Transaction['type'],
    description: string,
    referenceId?: string
  ): { account: TokenAccount; transaction: Transaction } | null {
    // 验证输入参数
    validateAccountId(accountId);
    validateAmount(amount, '增加金额');
    
    const account = this.accounts.get(accountId);
    if (!account) return null;

    // 创建交易记录
    const transaction: Transaction = {
      id: `tx_${this.transactionCounter++}`,
      accountId,
      type,
      amount,
      description,
      referenceId,
      createdAt: new Date(),
    };

    // 更新账户余额
    account.balance += amount;
    account.totalEarned += amount;
    account.updatedAt = new Date();

    this.transactions.set(transaction.id, transaction);

    return { account, transaction };
  }

  /**
   * 扣除余额
   */
  deductBalance(
    accountId: string,
    amount: number,
    description: string
  ): { account: TokenAccount; transaction: Transaction } | null {
    // 验证输入参数
    validateAccountId(accountId);
    validateAmount(amount, '扣除金额');
    
    const account = this.accounts.get(accountId);
    if (!account || account.balance < amount) return null;

    // 创建交易记录
    const transaction: Transaction = {
      id: `tx_${this.transactionCounter++}`,
      accountId,
      type: 'spend',
      amount: -amount,
      description,
      createdAt: new Date(),
    };

    // 更新账户余额
    account.balance -= amount;
    account.totalSpent += amount;
    account.updatedAt = new Date();

    this.transactions.set(transaction.id, transaction);

    return { account, transaction };
  }

  /**
   * 查询交易记录
   */
  getTransactions(accountId: string, limit = 20, offset = 0): Transaction[] {
    const accountTransactions: Transaction[] = [];
    
    for (const transaction of this.transactions.values()) {
      if (transaction.accountId === accountId) {
        accountTransactions.push(transaction);
      }
    }

    // 按时间倒序排列
    accountTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return accountTransactions.slice(offset, offset + limit);
  }

  /**
   * 获取所有账户
   */
  getAllAccounts(): TokenAccount[] {
    return Array.from(this.accounts.values());
  }
}

// 单例实例
export const tokenAccountModel = new TokenAccountModel();