/**
 * 冻结控制器 - 处理账户冻结相关的HTTP请求
 */
import { freezeService } from '../services/freeze.service';
export class FreezeController {
    /**
     * 申请冻结
     * POST /api/freeze/apply
     * Body: { userId: string, amount: number, reason: string }
     */
    async applyFreeze(params) {
        try {
            const { userId, amount, reason } = params;
            // 输入验证
            if (!userId || typeof userId !== 'string') {
                return { success: false, error: '无效的用户ID' };
            }
            if (!amount || typeof amount !== 'number' || amount <= 0) {
                return { success: false, error: '无效的冻结金额' };
            }
            if (!reason || typeof reason !== 'string') {
                return { success: false, error: '冻结原因不能为空' };
            }
            // 调用服务层
            return freezeService.applyFreeze(userId, amount, reason);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '申请冻结失败'
            };
        }
    }
    /**
     * 审核通过
     * POST /api/freeze/approve
     * Body: { freezeId: string, approver: string, comment?: string }
     */
    async approveFreeze(params) {
        try {
            const { freezeId, approver, comment } = params;
            // 输入验证
            if (!freezeId || typeof freezeId !== 'string') {
                return { success: false, error: '无效的冻结ID' };
            }
            if (!approver || typeof approver !== 'string') {
                return { success: false, error: '无效的审核人ID' };
            }
            // 调用服务层
            return freezeService.approveFreeze(freezeId, approver, comment);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '审核失败'
            };
        }
    }
    /**
     * 审核拒绝
     * POST /api/freeze/reject
     * Body: { freezeId: string, approver: string, reason: string }
     */
    async rejectFreeze(params) {
        try {
            const { freezeId, approver, reason } = params;
            // 输入验证
            if (!freezeId || typeof freezeId !== 'string') {
                return { success: false, error: '无效的冻结ID' };
            }
            if (!approver || typeof approver !== 'string') {
                return { success: false, error: '无效的审核人ID' };
            }
            if (!reason || typeof reason !== 'string') {
                return { success: false, error: '拒绝原因不能为空' };
            }
            // 调用服务层
            return freezeService.rejectFreeze(freezeId, approver, reason);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '审核失败'
            };
        }
    }
    /**
     * 解冻
     * POST /api/freeze/unfreeze
     * Body: { freezeId: string, operator: string, reason: string }
     */
    async unfreeze(params) {
        try {
            const { freezeId, operator, reason } = params;
            // 输入验证
            if (!freezeId || typeof freezeId !== 'string') {
                return { success: false, error: '无效的冻结ID' };
            }
            if (!operator || typeof operator !== 'string') {
                return { success: false, error: '无效的操作人ID' };
            }
            if (!reason || typeof reason !== 'string') {
                return { success: false, error: '解冻原因不能为空' };
            }
            // 调用服务层
            return freezeService.unfreeze(freezeId, operator, reason);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '解冻失败'
            };
        }
    }
    /**
     * 查询冻结记录列表
     * GET /api/freeze/list?userId=xxx&status=xxx&page=1&pageSize=10
     */
    async getFreezeList(params) {
        try {
            const { userId, status, page = 1, pageSize = 10 } = params;
            // 输入验证
            if (page < 1 || pageSize < 1 || pageSize > 100) {
                return { success: false, error: '无效的分页参数' };
            }
            // 调用服务层
            return freezeService.getFreezeList({ userId, status, page, pageSize });
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询失败'
            };
        }
    }
    /**
     * 查询单个冻结记录
     * GET /api/freeze/:id
     */
    async getFreezeById(params) {
        try {
            const { id } = params;
            if (!id) {
                return { success: false, error: '缺少冻结ID' };
            }
            // 调用服务层
            return freezeService.getFreezeById(id);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询失败'
            };
        }
    }
    /**
     * 冻结账户 - 立即冻结指定账户
     * POST /api/freeze/account
     * Body: { userId: string, reason: string }
     */
    async freezeAccount(params) {
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
            return freezeService.freezeAccount(userId, reason);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '冻结账户失败'
            };
        }
    }
    /**
     * 解冻账户 - 解除账户冻结状态
     * POST /api/freeze/unfreeze-account
     * Body: { userId: string, reason: string }
     */
    async unfreezeAccount(params) {
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
            return freezeService.unfreezeAccount(userId, reason);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '解冻账户失败'
            };
        }
    }
    /**
     * 获取冻结账户列表 - 查询所有冻结状态的账户
     * GET /api/freeze/frozen-accounts?status=xxx&page=1&pageSize=10
     */
    async getFrozenAccounts(params) {
        try {
            const { status, page = 1, pageSize = 10 } = params;
            // 输入验证
            if (page < 1 || pageSize < 1 || pageSize > 100) {
                return { success: false, error: '无效的分页参数' };
            }
            // 调用服务层
            return freezeService.getFrozenAccounts({ status, page, pageSize });
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询冻结账户失败'
            };
        }
    }
    /**
     * 获取冻结状态 - 查询指定账户的冻结状态
     * GET /api/freeze/status/:userId
     */
    async getFreezeStatus(params) {
        try {
            const { userId } = params;
            // 输入验证
            if (!userId || typeof userId !== 'string') {
                return { success: false, error: '无效的用户ID' };
            }
            // 调用服务层
            return freezeService.getFreezeStatus(userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询冻结状态失败'
            };
        }
    }
    /**
     * 批量冻结 - 批量冻结多个账户
     * POST /api/freeze/batch-freeze
     * Body: { userIds: string[], reason: string }
     */
    async batchFreeze(params) {
        try {
            const { userIds, reason } = params;
            // 输入验证
            if (!Array.isArray(userIds) || userIds.length === 0) {
                return { success: false, error: '无效的用户ID列表' };
            }
            if (!reason || typeof reason !== 'string') {
                return { success: false, error: '冻结原因不能为空' };
            }
            // 调用服务层
            return freezeService.batchFreeze(userIds, reason);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '批量冻结失败'
            };
        }
    }
    /**
     * 批量解冻 - 批量解冻多个账户
     * POST /api/freeze/batch-unfreeze
     * Body: { userIds: string[], reason: string }
     */
    async batchUnfreeze(params) {
        try {
            const { userIds, reason } = params;
            // 输入验证
            if (!Array.isArray(userIds) || userIds.length === 0) {
                return { success: false, error: '无效的用户ID列表' };
            }
            if (!reason || typeof reason !== 'string') {
                return { success: false, error: '解冻原因不能为空' };
            }
            // 调用服务层
            return freezeService.batchUnfreeze(userIds, reason);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '批量解冻失败'
            };
        }
    }
}
export const freezeController = new FreezeController();
