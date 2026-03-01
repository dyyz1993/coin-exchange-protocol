/**
 * 黑名单模型 - 管理用户和商家黑名单
 */
import { BlacklistEntry, BlacklistType, UserDisputeStats } from '../types';
export declare class BlacklistModel {
    private blacklist;
    private userDisputeStats;
    /**
     * 添加黑名单
     */
    addToBlacklist(params: {
        targetId: string;
        targetType: BlacklistType;
        reason: BlacklistEntry['reason'];
        reasonDetail: string;
        blockedBy: string;
        expiresAt?: Date;
        notes?: string;
    }): BlacklistEntry;
    /**
     * 从黑名单移除
     */
    removeFromBlacklist(entryId: string, unblockedBy: string, reason: string): BlacklistEntry;
    /**
     * 获取黑名单记录
     */
    getBlacklistEntry(entryId: string): BlacklistEntry | undefined;
    /**
     * 根据目标ID获取黑名单记录
     */
    getBlacklistEntryByTarget(targetId: string, targetType?: BlacklistType): BlacklistEntry | undefined;
    /**
     * 检查用户是否在黑名单中
     */
    isBlacklisted(targetId: string, targetType?: BlacklistType): boolean;
    /**
     * 获取所有黑名单
     */
    getAllBlacklistEntries(): BlacklistEntry[];
    /**
     * 获取活跃的黑名单
     */
    getActiveBlacklistEntries(): BlacklistEntry[];
    /**
     * 更新黑名单过期时间
     */
    updateExpireTime(entryId: string, expiresAt: Date): BlacklistEntry;
    /**
     * 更新争议统计
     */
    updateDisputeStats(userId: string, isFraud: boolean): void;
    /**
     * 更新订单统计
     */
    updateOrderStats(userId: string): void;
    /**
     * 获取用户争议统计
     */
    getUserDisputeStats(userId: string): UserDisputeStats;
    /**
     * 获取所有争议统计
     */
    getAllDisputeStats(): UserDisputeStats[];
    /**
     * 检查是否需要自动拉黑
     */
    checkAutoBlacklist(userId: string): {
        shouldBlacklist: boolean;
        reason?: string;
    };
}
export declare const blacklistModel: BlacklistModel;
