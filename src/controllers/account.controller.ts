/**
 * 账户控制器 - 处理账户相关的HTTP请求
 */

import { accountService } from '../services/account.service';
import { ApiResponse } from '../types';

export class AccountController {
  /**
   * 创建账户
   * POST /api/account/create
   * Body: { userId: string, initialBalance?: number }
   */
  async createAccount(params: any): Promise<ApiResponse> {
    try {
      const { userId, initialBalance = 0 } = params;
      
      // 输入验证
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: '无效的用户ID' };
      }
      
      if (typeof initialBalance !== 'number' || initialBalance < 0) {
        return { success: false, error: '无效的初始余额' };
      }
      
      // 调用服务层
      return accountService.createAccount(userId, initialBalance);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '创建账户失败' 
      };
    }
  }

  /**
   * 查询余额
   * GET /api/account/balance/:userId
   */
  async getBalance(params: any): Promise<ApiResponse> {
    try {
      const { userId } = params;
      
      if (!userId) {
        return { success: false, error: '缺少用户ID' };
      }

      return accountService.getBalance(userId);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '查询余额失败' 
      };
    }
  }

  /**
   * 充值
   * POST /api/account/deposit
   * Body: { userId: string, amount: number, reason?: string }
   */
  async deposit(params: any): Promise<ApiResponse> {
    try {
      const { userId, amount, reason } = params;
      
      // 输入验证
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: '无效的用户ID' };
      }
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return { success: false, error: '无效的充值金额' };
      }
      
      // 调用服务层
      return accountService.deposit(userId, amount, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '充值失败' 
      };
    }
  }

  /**
   * 提现
   * POST /api/account/withdraw
   * Body: { userId: string, amount: number, reason?: string }
   */
  async withdraw(params: any): Promise<ApiResponse> {
    try {
      const { userId, amount, reason } = params;
      
      // 输入验证
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: '无效的用户ID' };
      }
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return { success: false, error: '无效的提现金额' };
      }
      
      // 调用服务层
      return accountService.withdraw(userId, amount, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '提现失败' 
      };
    }
  }

  /**
   * 转账
   * POST /api/account/transfer
   * Body: { fromUserId: string, toUserId: string, amount: number, reason?: string }
   */
  async transfer(params: any): Promise<ApiResponse> {
    try {
      const { fromUserId, toUserId, amount, reason } = params;
      
      // 输入验证
      if (!fromUserId || !toUserId || typeof fromUserId !== 'string' || typeof toUserId !== 'string') {
        return { success: false, error: '无效的用户ID' };
      }
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return { success: false, error: '无效的转账金额' };
      }
      
      if (fromUserId === toUserId) {
        return { success: false, error: '不能转账给自己' };
      }
      
      // 调用服务层
      return accountService.transfer(fromUserId, toUserId, amount, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '转账失败' 
      };
    }
  }

  /**
   * 冻结账户
   * POST /api/account/freeze
   * Body: { userId: string, reason: string }
   */
  async freezeAccount(params: any): Promise<ApiResponse> {
    try {
      const { userId, reason } = params;
      
      // 输入验证
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: '无效的用户ID' };
      }
      
      if (!reason || typeof reason !== 'string') {
        return { success: false, error: '冻结原因不能为空' };
      }
      
      // 调用服务层
      return accountService.freezeAccount(userId, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '冻结账户失败' 
      };
    }
  }

  /**
   * 解冻账户
   * POST /api/account/unfreeze
   * Body: { userId: string, reason: string }
   */
  async unfreezeAccount(params: any): Promise<ApiResponse> {
    try {
      const { userId, reason } = params;
      
      // 输入验证
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: '无效的用户ID' };
      }
      
      if (!reason || typeof reason !== 'string') {
        return { success: false, error: '解冻原因不能为空' };
      }
      
      // 调用服务层
      return accountService.unfreezeAccount(userId, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '解冻账户失败' 
      };
    }
  }

  /**
   * 查询交易记录
   * GET /api/account/transactions/:userId
   */
  async getTransactions(params: any): Promise<ApiResponse> {
    try {
      const { userId } = params;
      
      if (!userId) {
        return { success: false, error: '缺少用户ID' };
      }

      return accountService.getTransactions(userId);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '查询交易记录失败' 
      };
    }
  }
}

export const accountController = new AccountController();
