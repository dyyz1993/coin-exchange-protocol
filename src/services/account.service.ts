/**
 * 账户服务 - 管理用户账户和代币余额
 */

import { accountModel } from '../models/Account';
import { TransactionType, Transaction } from '../types/common';

export class AccountService {
  /**
   * 创建新用户账户
   */
  async createAccount(
    userId: string,
    initialBalanceOrData?:
      | number
      | {
          email?: string;
          phone?: string;
          nickname?: string;
        }
  ): Promise<{
    accountId: string;
    createdAt: Date;
    initialBalance?: number;
  }> {
    // 兼容两种参数形式：直接传 initialBalance 数字，或传 initialData 对象
    let initialBalance = 0;
    if (typeof initialBalanceOrData === 'number') {
      initialBalance = initialBalanceOrData;
    }

    // 创建用户账户，传入初始余额
    const account = await accountModel.createAccount(userId, initialBalance);

    return {
      accountId: account.id!,
      createdAt: account.createdAt,
      initialBalance: account.balance,
    };
  }

  /**
   * 获取用户账户信息
   */
  getAccountInfo(userId: string): {
    balance: number;
    frozenBalance: number;
    availableBalance: number;
    totalEarned?: number;
    totalSpent?: number;
  } | null {
    const account = accountModel.getAccountByUserId(userId);
    if (!account) {
      return null;
    }

    return {
      balance: account.balance,
      frozenBalance: account.frozenBalance,
      availableBalance: account.balance - account.frozenBalance,
      totalEarned: account.totalEarned,
      totalSpent: account.totalSpent,
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
    const account = accountModel.getAccountByUserId(userId);
    if (!account) {
      return null;
    }

    return {
      balance: account.balance,
      frozenBalance: account.frozenBalance,
      availableBalance: account.balance - account.frozenBalance,
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
    const transaction = await accountModel.addBalance(userId, amount, description, type);

    return {
      success: true,
      newBalance: accountModel.getAccountByUserId(userId)!.balance,
      transactionId: transaction.id,
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
    const transaction = await accountModel.deductBalance(userId, amount, description, type);

    return {
      success: true,
      newBalance: accountModel.getAccountByUserId(userId)!.balance,
      transactionId: transaction.id,
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
    const transaction = await accountModel.freezeBalance(userId, amount);
    const account = accountModel.getAccountByUserId(userId)!;

    return {
      success: true,
      frozenAmount: amount,
      availableBalance: account.balance - account.frozenBalance,
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
    const transaction = await accountModel.unfreezeBalance(userId, amount);
    const account = accountModel.getAccountByUserId(userId)!;

    return {
      success: true,
      unfrozenAmount: amount,
      availableBalance: account.balance - account.frozenBalance,
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

    // 使用 AccountModel 的 transfer 方法
    const transaction = await accountModel.transfer(fromUserId, toUserId, amount, description);

    const fromAccount = accountModel.getAccountByUserId(fromUserId)!;
    const toAccount = accountModel.getAccountByUserId(toUserId)!;

    return {
      success: true,
      fromNewBalance: fromAccount.balance,
      toNewBalance: toAccount.balance,
      transactionId: transaction.id,
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
  ): Transaction[] {
    let transactions = accountModel.getUserTransactions(userId);

    // 过滤类型
    if (options?.type) {
      transactions = transactions.filter((tx) => tx.type === options.type);
    }

    // 分页
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return transactions.slice(offset, offset + limit);
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
    const account = accountModel.getAccountByUserId(userId);
    if (!account) {
      return null;
    }

    const transactions = this.getTransactionHistory(userId);
    let totalEarned = 0;
    let totalSpent = 0;

    for (const tx of transactions) {
      if (tx.toUserId === userId && tx.amount > 0) {
        totalEarned += tx.amount;
      } else if (tx.fromUserId === userId && tx.amount > 0) {
        totalSpent += tx.amount;
      }
    }

    const accountAge = Date.now() - account.createdAt.getTime();

    return {
      totalTransactions: transactions.length,
      totalEarned,
      totalSpent,
      accountAge,
    };
  }

  /**
   * 更新账户信息
   * 注意：当前 AccountModel 没有更新账户信息的方法，这里只是占位
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
    // AccountModel 目前不支持更新这些字段
    // 返回当前账户信息
    return accountModel.getAccountByUserId(userId);
  }

  /**
   * 停用账户
   * 注意：当前 AccountModel 没有 status 字段，这里只是占位
   */
  async deactivateAccount(userId: string, reason: string): Promise<boolean> {
    const account = accountModel.getAccountByUserId(userId);
    if (!account) {
      throw new Error('账户不存在');
    }

    // AccountModel 目前不支持状态管理
    return true;
  }

  /**
   * 激活账户
   * 注意：当前 AccountModel 没有 status 字段，这里只是占位
   */
  async activateAccount(userId: string): Promise<boolean> {
    const account = accountModel.getAccountByUserId(userId);
    if (!account) {
      throw new Error('账户不存在');
    }

    // AccountModel 目前不支持状态管理
    return true;
  }

  /**
   * 获取余额 - getTokenBalance 的别名
   * 为 AccountController 提供的便捷方法
   */
  async getBalance(userId: string): Promise<{
    balance: number;
    frozenBalance: number;
    availableBalance: number;
  } | null> {
    return this.getTokenBalance(userId);
  }

  /**
   * 充值 - addTokens 的别名
   * 为 AccountController 提供的便捷方法
   */
  async deposit(
    userId: string,
    amount: number,
    reason?: string
  ): Promise<{
    success: boolean;
    newBalance: number;
    transactionId: string;
  }> {
    return this.addTokens(userId, amount, TransactionType.REWARD, reason || '充值');
  }

  /**
   * 提现 - deductTokens 的别名
   * 为 AccountController 提供的便捷方法
   */
  async withdraw(
    userId: string,
    amount: number,
    reason?: string
  ): Promise<{
    success: boolean;
    newBalance: number;
    transactionId: string;
  }> {
    return this.deductTokens(userId, amount, TransactionType.PENALTY, reason || '提现');
  }

  /**
   * 冻结账户 - freezeTokens 的别名
   * 为 AccountController 提供的便捷方法
   */
  async freezeAccount(
    userId: string,
    reason: string,
    duration?: number
  ): Promise<{
    success: boolean;
    frozenAmount: number;
    availableBalance: number;
  }> {
    const account = accountModel.getAccountByUserId(userId);
    if (!account) {
      throw new Error('账户不存在');
    }

    // 冻结全部可用余额
    const amount = account.balance - account.frozenBalance;
    if (amount <= 0) {
      return {
        success: true,
        frozenAmount: 0,
        availableBalance: account.balance - account.frozenBalance,
      };
    }

    return this.freezeTokens(userId, amount, reason);
  }

  /**
   * 解冻账户 - unfreezeTokens 的别名
   * 为 AccountController 提供的便捷方法
   */
  async unfreezeAccount(
    userId: string,
    reason: string
  ): Promise<{
    success: boolean;
    unfrozenAmount: number;
    availableBalance: number;
  }> {
    const account = accountModel.getAccountByUserId(userId);
    if (!account) {
      throw new Error('账户不存在');
    }

    // 解冻全部冻结余额
    const amount = account.frozenBalance;
    if (amount <= 0) {
      return {
        success: true,
        unfrozenAmount: 0,
        availableBalance: account.balance - account.frozenBalance,
      };
    }

    return this.unfreezeTokens(userId, amount, reason);
  }

  /**
   * 获取交易记录 - getTransactionHistory 的别名
   * 为 AccountController 提供的便捷方法
   */
  async getTransactions(userId: string): Promise<Transaction[]> {
    return this.getTransactionHistory(userId);
  }

  /**
   * 获取冻结账户列表
   * 注意：AccountModel 没有专门的冻结账户列表，这里返回所有有冻结余额的账户
   */
  async getFrozenAccounts(): Promise<any[]> {
    // 由于 AccountModel 没有 getAllAccounts 方法，我们需要通过其他方式获取
    // 这里暂时返回空数组，实际应用中可能需要修改 AccountModel
    return [];
  }

  /**
   * 更新账户状态
   * 注意：AccountModel 没有状态字段，这里只是占位
   */
  async updateAccountStatus(
    userId: string,
    status: string
  ): Promise<{
    success: boolean;
    status: string;
  }> {
    const account = accountModel.getAccountByUserId(userId);
    if (!account) {
      throw new Error('账户不存在');
    }

    // AccountModel 目前不支持状态管理
    return {
      success: true,
      status: status,
    };
  }
}

// 导出单例
export const accountService = new AccountService();
