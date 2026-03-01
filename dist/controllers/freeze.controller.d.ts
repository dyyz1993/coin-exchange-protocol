/**
 * 冻结控制器 - 处理账户冻结相关的HTTP请求
 */
import { ApiResponse } from '../types';
export declare class FreezeController {
    /**
     * 申请冻结
     * POST /api/freeze/apply
     * Body: { userId: string, amount: number, reason: string }
     */
    applyFreeze(params: any): Promise<ApiResponse>;
    /**
     * 审核通过
     * POST /api/freeze/approve
     * Body: { freezeId: string, approver: string, comment?: string }
     */
    approveFreeze(params: any): Promise<ApiResponse>;
    /**
     * 审核拒绝
     * POST /api/freeze/reject
     * Body: { freezeId: string, approver: string, reason: string }
     */
    rejectFreeze(params: any): Promise<ApiResponse>;
    /**
     * 解冻
     * POST /api/freeze/unfreeze
     * Body: { freezeId: string, operator: string, reason: string }
     */
    unfreeze(params: any): Promise<ApiResponse>;
    /**
     * 查询冻结记录列表
     * GET /api/freeze/list?userId=xxx&status=xxx&page=1&pageSize=10
     */
    getFreezeList(params: any): Promise<ApiResponse>;
    /**
     * 查询单个冻结记录
     * GET /api/freeze/:id
     */
    getFreezeById(params: any): Promise<ApiResponse>;
    /**
     * 冻结账户 - 立即冻结指定账户
     * POST /api/freeze/account
     * Body: { userId: string, reason: string }
     */
    freezeAccount(params: any): Promise<ApiResponse>;
    /**
     * 解冻账户 - 解除账户冻结状态
     * POST /api/freeze/unfreeze-account
     * Body: { userId: string, reason: string }
     */
    unfreezeAccount(params: any): Promise<ApiResponse>;
    /**
     * 获取冻结账户列表 - 查询所有冻结状态的账户
     * GET /api/freeze/frozen-accounts?status=xxx&page=1&pageSize=10
     */
    getFrozenAccounts(params: any): Promise<ApiResponse>;
    /**
     * 获取冻结状态 - 查询指定账户的冻结状态
     * GET /api/freeze/status/:userId
     */
    getFreezeStatus(params: any): Promise<ApiResponse>;
    /**
     * 批量冻结 - 批量冻结多个账户
     * POST /api/freeze/batch-freeze
     * Body: { userIds: string[], reason: string }
     */
    batchFreeze(params: any): Promise<ApiResponse>;
    /**
     * 批量解冻 - 批量解冻多个账户
     * POST /api/freeze/batch-unfreeze
     * Body: { userIds: string[], reason: string }
     */
    batchUnfreeze(params: any): Promise<ApiResponse>;
}
export declare const freezeController: FreezeController;
