/**
 * 账户控制器 - 处理账户相关的HTTP请求
 */
import { accountService } from '../services/account.service';
export class AccountController {
    /**
     * 创建账户
     * POST /api/account/create
     * Body: { userId: string, initialBalance?: number }
     */
    async createAccount(params) {
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
        }
        catch (error) {
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
    async getBalance(params) {
        try {
            const { userId } = params;
            if (!userId) {
                return { success: false, error: '缺少用户ID' };
            }
            return accountService.getBalance(userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询余额失败'
            };
        }
    }
    /**
     * 充值/存款
     * POST /api/account/deposit
     * Body: { userId: string, amount: number, reason?: string }
     */
    async deposit(params) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '充值失败'
            };
        }
    }
    /**
     * 提现/取款
     * POST /api/account/withdraw
     * Body: { userId: string, amount: number, reason?: string }
     */
    async withdraw(params) {
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
        }
        catch (error) {
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
    async transfer(params) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '转账失败'
            };
        }
    }
    /**
     * 冻结账户
     * POST /api/account/freeze
     * Body: { userId: string, reason: string, duration?: number }
     */
    async freezeAccount(params) {
        try {
            const { userId, reason, duration } = params;
            // 输入验证
            if (!userId || typeof userId !== 'string') {
                return { success: false, error: '无效的用户ID' };
            }
            if (!reason || typeof reason !== 'string') {
                return { success: false, error: '冻结原因不能为空' };
            }
            // 调用服务层
            return accountService.freezeAccount(userId, reason, duration);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '冻结账户失败'
            };
        }
    }
    /**
     * 解冻账户
     * POST /api/account/unfreeze
     * Body: { userId: string, reason?: string }
     */
    async unfreezeAccount(params) {
        try {
            const { userId, reason } = params;
            // 输入验证
            if (!userId || typeof userId !== 'string') {
                return { success: false, error: '无效的用户ID' };
            }
            // 调用服务层
            return accountService.unfreezeAccount(userId, reason);
        }
        catch (error) {
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
    async getTransactionHistory(params) {
        try {
            const { userId } = params;
            if (!userId) {
                return { success: false, error: '缺少用户ID' };
            }
            return accountService.getTransactions(userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询交易记录失败'
            };
        }
    }
    /**
     * 兼容旧方法名
     * @deprecated 请使用 getTransactionHistory
     */
    async getTransactions(params) {
        return this.getTransactionHistory(params);
    }
    /**
     * 冻结余额（冻结特定金额）
     * POST /api/account/freeze-balance
     * Body: { userId: string, amount: number, reason?: string }
     */
    async freezeBalance(params) {
        try {
            const { userId, amount, reason } = params;
            // 输入验证
            if (!userId || typeof userId !== 'string') {
                return { success: false, error: '无效的用户ID' };
            }
            if (!amount || typeof amount !== 'number' || amount <= 0) {
                return { success: false, error: '无效的冻结金额' };
            }
            // 调用服务层
            return accountService.freezeTokens(userId, amount, reason || '冻结余额');
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '冻结余额失败'
            };
        }
    }
    /**
     * 解冻余额（解冻特定金额）
     * POST /api/account/unfreeze-balance
     * Body: { userId: string, amount: number, reason?: string }
     */
    async unfreezeBalance(params) {
        try {
            const { userId, amount, reason } = params;
            // 输入验证
            if (!userId || typeof userId !== 'string') {
                return { success: false, error: '无效的用户ID' };
            }
            if (!amount || typeof amount !== 'number' || amount <= 0) {
                return { success: false, error: '无效的解冻金额' };
            }
            // 调用服务层
            return accountService.unfreezeTokens(userId, amount, reason || '解冻余额');
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '解冻余额失败'
            };
        }
    }
    /**
     * 获取冻结账户列表
     * GET /api/account/frozen
     */
    async getFrozenAccounts(params) {
        try {
            // 调用服务层获取冻结账户列表
            return accountService.getFrozenAccounts();
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '获取冻结账户列表失败'
            };
        }
    }
    /**
     * 获取账户信息
     * GET /api/account/info/:userId
     */
    async getAccountInfo(params) {
        try {
            const { userId } = params;
            if (!userId) {
                return { success: false, error: '缺少用户ID' };
            }
            // 调用服务层获取账户信息
            return accountService.getAccountInfo(userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '获取账户信息失败'
            };
        }
    }
    /**
     * 更新账户状态
     * PUT /api/account/status
     * Body: { userId: string, status: string }
     */
    async updateAccountStatus(params) {
        try {
            const { userId, status } = params;
            // 输入验证
            if (!userId || typeof userId !== 'string') {
                return { success: false, error: '无效的用户ID' };
            }
            if (!status || typeof status !== 'string') {
                return { success: false, error: '无效的账户状态' };
            }
            // 调用服务层
            return accountService.updateAccountStatus(userId, status);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '更新账户状态失败'
            };
        }
    }
}
export const accountController = new AccountController();
