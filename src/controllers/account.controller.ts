/**
 * 账户控制器 - 处理账户相关的HTTP请求
 */

import { accountService } from '../services/account.service';
import { ApiResponse } from '../types';

export class AccountController {
  /**
   * 查询余额
   * GET /api/account/balance/:userId
   */
  async getBalance(req: Request): Promise<ApiResponse> {
    const url = new URL(req.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return { success: false, error: '缺少用户ID' };
    }

    return accountService.getBalance(userId);
  }

  /**
   * 查询交易记录
   * GET /api/account/transactions/:userId
   */
  async getTransactions(req: Request): Promise<ApiResponse> {
    const url = new URL(req.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return { success: false, error: '缺少用户ID' };
    }

    return accountService.getTransactions(userId);
  }
}

export const accountController = new AccountController();