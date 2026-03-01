/**
 * 冻结记录模型 - 管理代币冻结和解冻记录
 */
import { FreezeRecord, FreezeType } from '../types';
export declare class FreezeModel {
    private freezes;
    private userFreezes;
    /**
     * 创建冻结记录
     */
    createFreeze(params: {
        userId: string;
        amount: number;
        type: FreezeType;
        transactionId?: string;
        remark?: string;
    }): FreezeRecord;
    /**
     * 获取冻结记录
     */
    getFreeze(freezeId: string): FreezeRecord | undefined;
    /**
     * 根据交易ID获取冻结记录
     */
    getFreezeByTransactionId(transactionId: string): FreezeRecord | undefined;
    /**
     * 获取用户的所有冻结记录
     */
    getUserFreezes(userId: string): FreezeRecord[];
    /**
     * 获取用户的活跃冻结记录
     */
    getActiveFreezes(userId: string): FreezeRecord[];
    /**
     * 获取所有活跃的冻结记录
     */
    getAllActiveFreezes(): FreezeRecord[];
    /**
     * 解冻
     */
    unfreeze(freezeId: string, reason?: string): FreezeRecord;
    /**
     * 获取所有过期的冻结记录（用于定时任务）
     */
    getExpiredFreezes(): FreezeRecord[];
    /**
     * 批量解冻过期的冻结记录
     */
    autoUnfreezeExpired(): FreezeRecord[];
    /**
     * 检查用户是否有足够的可用余额进行冻结
     */
    checkFreezeAvailable(userId: string, amount: number, currentBalance: number): boolean;
    /**
     * 获取用户的冻结总额
     */
    getUserFrozenAmount(userId: string): number;
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
}
export declare const freezeModel: FreezeModel;
