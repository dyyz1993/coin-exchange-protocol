/**
 * 黑名单系统类型定义
 */
export declare enum BlacklistType {
    USER = "user",// 用户黑名单
    MERCHANT = "merchant"
}
export declare enum BlacklistReason {
    FRAUD = "fraud",// 欺诈行为
    DISPUTE_ABUSE = "dispute_abuse",// 滥用争议
    PAYMENT_ISSUE = "payment_issue",// 支付问题
    VIOLATION = "violation",// 违反规则
    OTHER = "other"
}
export declare enum BlacklistStatus {
    ACTIVE = "active",// 激活中
    INACTIVE = "inactive",// 已失效
    APPEALED = "appealed"
}
export interface BlacklistEntry {
    id: string;
    targetId: string;
    targetType: BlacklistType;
    reason: BlacklistReason;
    reasonDetail: string;
    status: BlacklistStatus;
    disputeCount: number;
    orderCount: number;
    blockedBy: string;
    blockedAt: Date;
    expiresAt?: Date;
    unblockedAt?: Date;
    unblockedBy?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserDisputeStats {
    userId: string;
    totalDisputes: number;
    successfulDisputes: number;
    failedDisputes: number;
    fraudDisputes: number;
    disputeRate: number;
    lastDisputeAt?: Date;
    isBlacklisted: boolean;
    blacklistEntry?: BlacklistEntry;
}
export interface CreateBlacklistParams {
    targetId: string;
    targetType: BlacklistType;
    reason: BlacklistReason;
    reasonDetail: string;
    blockedBy: string;
    expiresAt?: Date;
    notes?: string;
}
export interface UnblockParams {
    entryId: string;
    unblockedBy: string;
    reason: string;
}
export interface CheckBlacklistResponse {
    isBlacklisted: boolean;
    entry?: BlacklistEntry;
}
