/**
 * 账户控制器 - 处理账户相关的HTTP请求
 */
import { ApiResponse } from '../types';
export declare class AccountController {
    /**
     * 创建账户
     * POST /api/account/create
     * Body: { userId: string, initialBalance?: number }
     */
    createAccount(params: any): Promise<ApiResponse>;
    /**
     * 查询余额
     * GET /api/account/balance/:userId
     */
    getBalance(params: any): Promise<ApiResponse>;
    /**
     * 充值/存款
     * POST /api/account/deposit
     * Body: { userId: string, amount: number, reason?: string }
     */
    deposit(params: any): Promise<ApiResponse>;
    /**
     * 提现/取款
     * POST /api/account/withdraw
     * Body: { userId: string, amount: number, reason?: string }
     */
    withdraw(params: any): Promise<ApiResponse>;
    /**
     * 转账
     * POST /api/account/transfer
     * Body: { fromUserId: string, toUserId: string, amount: number, reason?: string }
     */
    transfer(params: any): Promise<ApiResponse>;
    /**
     * 冻结账户
     * POST /api/account/freeze
     * Body: { userId: string, reason: string, duration?: number }
     */
    freezeAccount(params: any): Promise<ApiResponse>;
    /**
     * 解冻账户
     * POST /api/account/unfreeze
     * Body: { userId: string, reason?: string }
     */
    unfreezeAccount(params: any): Promise<ApiResponse>;
    /**
     * 查询交易记录
     * GET /api/account/transactions/:userId
     */
    getTransactionHistory(params: any): Promise<ApiResponse>;
    /**
     * 兼容旧方法名
     * @deprecated 请使用 getTransactionHistory
     */
    getTransactions(params: any): Promise<ApiResponse>;
    /**
     * 冻结余额（冻结特定金额）
     * POST /api/account/freeze-balance
     * Body: { userId: string, amount: number, reason?: string }
     */
    freezeBalance(params: any): Promise<ApiResponse>;
    /**
     * 解冻余额（解冻特定金额）
     * POST /api/account/unfreeze-balance
     * Body: { userId: string, amount: number, reason?: string }
     */
    unfreezeBalance(params: any): Promise<ApiResponse>;
    /**
     * 获取冻结账户列表
     * GET /api/account/frozen
     */
    getFrozenAccounts(params: any): Promise<ApiResponse>;
    /**
     * 获取账户信息
     * GET /api/account/info/:userId
     */
    getAccountInfo(params: any): Promise<ApiResponse>;
    /**
     * 更新账户状态
     * PUT /api/account/status
     * Body: { userId: string, status: string }
     */
    updateAccountStatus(params: any): Promise<ApiResponse>;
}
export declare const accountController: AccountController;
