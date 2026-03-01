/**
 * 冻结服务 - 交易冻结机制核心业务逻辑
 */
import { FreezeRecord, FreezeStatus, FreezeStatusResponse } from '../types';
export declare class FreezeService {
    private autoUnfreezeTimer?;
    /**
     * 初始化服务，启动自动解冻定时任务
     */
    initialize(): void;
    /**
     * 启动自动解冻定时任务
     */
    private startAutoUnfreeze;
    /**
     * 停止自动解冻定时任务
     */
    stopAutoUnfreeze(): void;
    /**
     * 创建初始冻结（交易确认阶段，5分钟）
     */
    createInitialFreeze(params: {
        userId: string;
        amount: number;
        transactionId: string;
        remark?: string;
    }): FreezeRecord;
    /**
     * 创建争议冻结（客服介入阶段，30分钟）
     */
    createDisputeFreeze(params: {
        userId: string;
        amount: number;
        transactionId: string;
        remark?: string;
    }): FreezeRecord;
    /**
     * 解冻
     */
    unfreeze(freezeId: string, reason?: string): FreezeRecord;
    /**
     * 手动解冻（指定原因）
     */
    manualUnfreeze(freezeId: string, reason: string): FreezeRecord;
    /**
     * 自动解冻过期的冻结记录
     */
    autoUnfreezeExpired(): Array<{
        freeze: FreezeRecord;
        success: boolean;
        error?: string;
    }>;
    /**
     * 查询冻结状态
     */
    getFreezeStatus(freezeId: string): FreezeStatusResponse;
    /**
     * 查询用户冻结列表
     */
    getUserFreezes(userId: string, status?: FreezeStatus): FreezeRecord[];
    /**
     * 查询用户活跃冻结
     */
    getActiveFreezes(userId: string): FreezeRecord[];
    /**
     * 根据交易ID查询冻结记录
     */
    getFreezeByTransactionId(transactionId: string): FreezeRecord | undefined;
    /**
     * 获取用户可用余额（考虑冻结金额）
     */
    getAvailableBalance(userId: string): number;
    /**
     * 检查是否可以冻结
     */
    canFreeze(userId: string, amount: number): boolean;
    /**
     * 获取冻结统计
     */
    getFreezeStats(): {
        totalFreezes: number;
        activeFreezes: number;
        expiredFreezes: number;
        unfrozenFreezes: number;
        totalFrozenAmount: number;
    };
    /**
     * 获取所有活跃冻结记录（官方平台查看）
     */
    getAllActiveFreezes(): FreezeRecord[];
    /**
     * 延长冻结时间（争议场景）
     */
    extendFreeze(freezeId: string, durationMinutes: number): FreezeRecord;
    /**
     * 批量解冻用户的指定冻结记录
     */
    unfreezeMultiple(freezeIds: string[], reason?: string): Array<{
        freezeId: string;
        success: boolean;
        error?: string;
    }>;
}
export declare const freezeService: FreezeService;
