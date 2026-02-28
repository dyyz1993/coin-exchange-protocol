/**
 * 账户服务 - 管理用户账户和代币余额
 */

import { AccountModel } from '../models/Account';
import { TokenAccountModel } from '../models/TokenAccount';
import { TransactionType } from '../types/token';

export class AccountService {
  /**
   * 创建新用户账户
   */
  async createAccount(userId: string, initialData?: {
    email?: string;
    phone?: string;
    nickname?: string;
  }): Promise<{
    accountId: string;
    tokenAccountId: string;
    createdAt: Date;
  }> {
    // 创建用户账户
    const account = AccountModel.createAccount({
      userId,
      ...initialData
    });

    // 创建对应的代币账户
    const tokenAccount = TokenAccountModel.createTokenAccount(userId);

    return {
      accountId: account.id,
      tokenAccountId: tokenAccount.id,
      createdAt: account.createdAt
    };
  }

  /**
   * 获取用户账户信息
   */
  getAccountInfo(userId: string): {
    account: any;
    tokenBalance: number;
    frozenBalance: number;
    availableBalance: number;
  } | null {
    const account = AccountModel.getAccountByUserId(userId);
    if (!account) {
      return null;
    }

    const tokenAccount = TokenAccountModel.getTokenAccountByUserId(userId);
    if (!tokenAccount) {
      return null;
    }

    return {
      account,
      tokenBalance: tokenAccount.balance,
      frozenBalance: tokenAccount.frozenBalance,
      availableBalance: tokenAccount.availableBalance
    };
  }

  /**
   * 获取用户代币余额
   */
  getTokenBalance(userId: string): {
    balance: number;
    frozenBalance: number;
    availableBalance: number;
  } | null {
    const tokenAccount = TokenAccountModel.getTokenAccountByUserId(userId);
    if (!tokenAccount) {
      return null;
    }

    return {
      balance: tokenAccount.balance,
      frozenBalance: tokenAccount.frozenBalance,
      availableBalance: tokenAccount.availableBalance
    };
  }

  /**
   * 增加用户代币（奖励、空投等）
   */
  async addTokens(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    relatedId?: string
  ): Promise<{
    success: boolean;
    newBalance: number;
    transactionId: string;
  }> {
    const result = TokenAccountModel.addBalance(userId, amount, {
      type,
      description,
      relatedId
    });

    return {
      success: true,
      newBalance: result.newBalance,
      transactionId: result.transactionId
    };
  }

  /**
   * 扣除用户代币（消费、惩罚等）
   */
  async deductTokens(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    relatedId?: string
  ): Promise<{
    success: boolean;
    newBalance: number;
    transactionId: string;
  }> {
    const result = TokenAccountModel.deductBalance(userId, amount, {
      type,
      description,
      relatedId
    });

    return {
      success: true,
      newBalance: result.newBalance,
      transactionId: result.transactionId
    };
  }

  /**
   * 冻结用户代币
   */
  async freezeTokens(
    userId: string,
    amount: number,
    reason: string,
    relatedId?: string
  ): Promise<{
    success: boolean;
    frozenAmount: number;
    availableBalance: number;
  }> {
    const result = TokenAccountModel.freezeBalance(userId, amount);

    return {
      success: true,
      frozenAmount: result.frozenAmount,
      availableBalance: result.availableBalance
    };
  }

  /**
   * 解冻用户代币
   */
  async unfreezeTokens(
    userId: string,
    amount: number,
    reason: string
  ): Promise<{
    success: boolean;
    unfrozenAmount: number;
    availableBalance: number;
  }> {
    const result = TokenAccountModel.unfreezeBalance(userId, amount);

    return {
      success: true,
      unfrozenAmount: result.unfrozenAmount,
      availableBalance: result.availableBalance
    };
  }

  /**
   * 转账（用户之间）
   */
  async transfer(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string
  ): Promise<{
    success: boolean;
    fromNewBalance: number;
    toNewBalance: number;
    transactionId: string;
  }> {
    // 检查发送方余额
    const fromBalance = this.getTokenBalance(fromUserId);
    if (!fromBalance || fromBalance.availableBalance < amount) {
      throw new Error('余额不足');
    }

    // 扣除发送方
    const deductResult = await this.deductTokens(
      fromUserId,
      amount,
      TransactionType.TRANSFER_OUT,
      `转账给 ${toUserId}: ${description}`,
      toUserId
    );

    // 增加接收方
    const addResult = await this.addTokens(
      toUserId,
      amount,
      TransactionType.TRANSFER_IN,
      `来自 ${fromUserId} 的转账: ${description}`,
      fromUserId
    );

    return {
      success: true,
      fromNewBalance: deductResult.newBalance,
      toNewBalance: addResult.newBalance,
      transactionId: deductResult.transactionId
    };
  }

  /**
   * 获取交易记录
   */
  getTransactionHistory(
    userId: string,
    options?: {
      type?: TransactionType;
      limit?: number;
      offset?: number;
    }
  ): any[] {
    return TokenAccountModel.getTransactionHistory(userId, options);
  }

  /**
   * 检查用户是否有足够余额
   */
  hasEnoughBalance(userId: string, amount: number): boolean {
    const balance = this.getTokenBalance(userId);
    if (!balance) {
      return false;
    }
    return balance.availableBalance >= amount;
  }

  /**
   * 获取账户统计信息
   */
  getAccountStats(userId: string): {
    totalTransactions: number;
    totalEarned: number;
    totalSpent: number;
    accountAge: number;
  } | null {
    const account = AccountModel.getAccountByUserId(userId);
    if (!account) {
      return null;
    }

    const transactions = this.getTransactionHistory(userId);
    let totalEarned = 0;
    let totalSpent = 0;

    for (const tx of transactions) {
      if (tx.amount > 0) {
        totalEarned += tx.amount;
      } else {
        totalSpent += Math.abs(tx.amount);
      }
    }

    const accountAge = Date.now() - account.createdAt.getTime();

    return {
      totalTransactions: transactions.length,
      totalEarned,
      totalSpent,
      accountAge
    };
  }

  /**
   * 更新账户信息
   */
  updateAccountInfo(
    userId: string,
    updates: {
      email?: string;
      phone?: string;
      nickname?: string;
      avatar?: string;
    }
  ): any {
    return AccountModel.updateAccount(userId, updates);
  }

  /**
   * 停用账户
   */
  async deactivateAccount(userId: string, reason: string): Promise<boolean> {
    const account = AccountModel.getAccountByUserId(userId);
    if (!account) {
      throw new Error('账户不存在');
    }

    // 更新账户状态
    AccountModel.updateAccount(userId, {
      status: 'INACTIVE' as any
    });

    return true;
  }

  /**
   * 激活账户
   */
  async activateAccount(userId: string): Promise<boolean> {
    const account = AccountModel.getAccountByUserId(userId);
    if (!account) {
      throw new Error('账户不存在');
    }

    // 更新账户状态
    AccountModel.updateAccount(userId, {
      status: 'ACTIVE' as any
    });

    return true;
  }
}

// 导出单例
export const accountService = new AccountService();
