/**
 * 代币服务 - 核心业务逻辑
 */

import { accountModel } from '../models/Account';
import { BalanceResponse, TransactionType, Transaction } from '../types';

export class TokenService {
  /**
   * 获取用户余额
   */
  getBalance(userId: string): BalanceResponse {
    const account = accountModel.getAccountByUserId(userId);
    
    if (!account) {
      return {
        userId,
        balance: 0,
        frozenBalance: 0,
        availableBalance: 0
      };
    }

    return {
      userId: account.userId,
      balance: account.balance,
      frozenBalance: account.frozenBalance,
      availableBalance: account.balance
    };
  }

  /**
   * 增加余额（内部方法）
   */
  addBalance(userId: string, amount: number, description: string, type: TransactionType): Transaction {
    return accountModel.addBalance(userId, amount, description, type);
  }

  /**
   * 扣减余额
   */
  deductBalance(userId: string, amount: number, description: string): Transaction {
    return accountModel.deductBalance(userId, amount, description, TransactionType.TRANSFER);
  }

  /**
   * 转账
   */
  transfer(fromUserId: string, toUserId: string, amount: number, description: string): Transaction {
    return accountModel.transfer(fromUserId, toUserId, amount, description);
  }

  /**
   * 冻结余额
   */
  freezeBalance(userId: string, amount: number): Transaction {
    return accountModel.freezeBalance(userId, amount);
  }

  /**
   * 解冻余额
   */
  unfreezeBalance(userId: string, amount: number): Transaction {
    return accountModel.unfreezeBalance(userId, amount);
  }

  /**
   * 获取用户交易历史
   */
  getTransactionHistory(userId: string): Transaction[] {
    return accountModel.getUserTransactions(userId);
  }

  /**
   * 获取交易详情
   */
  getTransaction(transactionId: string): Transaction | undefined {
    return accountModel.getTransaction(transactionId);
  }
}

// 导出单例
export const tokenService = new TokenService();