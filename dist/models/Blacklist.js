/**
 * 黑名单模型 - 管理用户和商家黑名单
 */
import { BlacklistStatus } from '../types';
export class BlacklistModel {
    blacklist = new Map();
    userDisputeStats = new Map();
    /**
     * 添加黑名单
     */
    addToBlacklist(params) {
        // 检查是否已在黑名单中
        const existing = this.getBlacklistEntry(params.targetId, params.targetType);
        if (existing && existing.status === BlacklistStatus.ACTIVE) {
            throw new Error('User is already blacklisted');
        }
        const entryId = `bl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const entry = {
            id: entryId,
            targetId: params.targetId,
            targetType: params.targetType,
            reason: params.reason,
            reasonDetail: params.reasonDetail,
            status: BlacklistStatus.ACTIVE,
            disputeCount: 0,
            orderCount: 0,
            blockedBy: params.blockedBy,
            blockedAt: new Date(),
            expiresAt: params.expiresAt,
            notes: params.notes,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.blacklist.set(entryId, entry);
        // 更新用户争议统计
        const stats = this.getUserDisputeStats(params.targetId);
        stats.isBlacklisted = true;
        stats.blacklistEntry = entry;
        return entry;
    }
    /**
     * 从黑名单移除
     */
    removeFromBlacklist(entryId, unblockedBy, reason) {
        const entry = this.blacklist.get(entryId);
        if (!entry) {
            throw new Error('Blacklist entry not found');
        }
        entry.status = BlacklistStatus.INACTIVE;
        entry.unblockedAt = new Date();
        entry.unblockedBy = unblockedBy;
        entry.notes = entry.notes ? `${entry.notes}\nUnblock reason: ${reason}` : reason;
        entry.updatedAt = new Date();
        // 更新用户争议统计
        const stats = this.getUserDisputeStats(entry.targetId);
        stats.isBlacklisted = false;
        return entry;
    }
    /**
     * 获取黑名单记录
     */
    getBlacklistEntry(entryId) {
        return this.blacklist.get(entryId);
    }
    /**
     * 根据目标ID获取黑名单记录
     */
    getBlacklistEntryByTarget(targetId, targetType) {
        for (const entry of this.blacklist.values()) {
            if (entry.targetId === targetId) {
                if (targetType && entry.targetType !== targetType) {
                    continue;
                }
                if (entry.status === BlacklistStatus.ACTIVE) {
                    return entry;
                }
            }
        }
        return undefined;
    }
    /**
     * 检查用户是否在黑名单中
     */
    isBlacklisted(targetId, targetType) {
        const entry = this.getBlacklistEntryByTarget(targetId, targetType);
        return entry !== undefined;
    }
    /**
     * 获取所有黑名单
     */
    getAllBlacklistEntries() {
        return Array.from(this.blacklist.values());
    }
    /**
     * 获取活跃的黑名单
     */
    getActiveBlacklistEntries() {
        const entries = [];
        for (const entry of this.blacklist.values()) {
            if (entry.status === BlacklistStatus.ACTIVE) {
                // 检查是否过期
                if (!entry.expiresAt || entry.expiresAt > new Date()) {
                    entries.push(entry);
                }
                else {
                    // 自动设置为失效
                    entry.status = BlacklistStatus.INACTIVE;
                    entry.updatedAt = new Date();
                }
            }
        }
        return entries;
    }
    /**
     * 更新黑名单过期时间
     */
    updateExpireTime(entryId, expiresAt) {
        const entry = this.blacklist.get(entryId);
        if (!entry) {
            throw new Error('Blacklist entry not found');
        }
        entry.expiresAt = expiresAt;
        entry.updatedAt = new Date();
        return entry;
    }
    /**
     * 更新争议统计
     */
    updateDisputeStats(userId, isFraud) {
        const stats = this.getUserDisputeStats(userId);
        stats.totalDisputes++;
        stats.lastDisputeAt = new Date();
        if (isFraud) {
            stats.fraudDisputes++;
        }
        // 更新黑名单记录中的争议次数
        const entry = this.getBlacklistEntryByTarget(userId);
        if (entry) {
            entry.disputeCount = stats.totalDisputes;
            entry.updatedAt = new Date();
        }
        // 更新争议率
        stats.disputeRate = stats.orderCount > 0
            ? stats.totalDisputes / stats.orderCount
            : 0;
    }
    /**
     * 更新订单统计
     */
    updateOrderStats(userId) {
        const stats = this.getUserDisputeStats(userId);
        stats.orderCount++;
        // 更新争议率
        stats.disputeRate = stats.orderCount > 0
            ? stats.totalDisputes / stats.orderCount
            : 0;
        // 更新黑名单记录中的订单数量
        const entry = this.getBlacklistEntryByTarget(userId);
        if (entry) {
            entry.orderCount = stats.orderCount;
            entry.updatedAt = new Date();
        }
    }
    /**
     * 获取用户争议统计
     */
    getUserDisputeStats(userId) {
        let stats = this.userDisputeStats.get(userId);
        if (!stats) {
            stats = {
                userId,
                totalDisputes: 0,
                successfulDisputes: 0,
                failedDisputes: 0,
                fraudDisputes: 0,
                disputeRate: 0,
                isBlacklisted: false
            };
            this.userDisputeStats.set(userId, stats);
        }
        return stats;
    }
    /**
     * 获取所有争议统计
     */
    getAllDisputeStats() {
        return Array.from(this.userDisputeStats.values());
    }
    /**
     * 检查是否需要自动拉黑
     */
    checkAutoBlacklist(userId) {
        const stats = this.getUserDisputeStats(userId);
        // 检查恶意争议次数
        if (stats.fraudDisputes >= 3) {
            return {
                shouldBlacklist: true,
                reason: `User has ${stats.fraudDisputes} fraud disputes`
            };
        }
        // 检查争议率（争议率超过30%且有5笔以上订单）
        if (stats.orderCount >= 5 && stats.disputeRate > 0.3) {
            return {
                shouldBlacklist: true,
                reason: `User dispute rate is ${(stats.disputeRate * 100).toFixed(1)}%`
            };
        }
        return { shouldBlacklist: false };
    }
}
// 导出单例
export const blacklistModel = new BlacklistModel();
