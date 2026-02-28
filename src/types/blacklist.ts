/**
 * 黑名单系统类型定义
 */

export enum BlacklistType {
  USER = 'user', // 用户黑名单
  MERCHANT = 'merchant', // 商家黑名单
}

export enum BlacklistReason {
  FRAUD = 'fraud', // 欺诈行为
  DISPUTE_ABUSE = 'dispute_abuse', // 滥用争议
  PAYMENT_ISSUE = 'payment_issue', // 支付问题
  VIOLATION = 'violation', // 违反规则
  OTHER = 'other', // 其他原因
}

export enum BlacklistStatus {
  ACTIVE = 'active', // 激活中
  INACTIVE = 'inactive', // 已失效
  APPEALED = 'appealed', // 申诉中
}

export interface BlacklistEntry {
  id: string;
  targetId: string; // 被拉黑的用户/商家ID
  targetType: BlacklistType;
  reason: BlacklistReason;
  reasonDetail: string;
  status: BlacklistStatus;
  disputeCount: number; // 争议次数
  orderCount: number; // 订单数量
  blockedBy: string; // 操作人ID（管理员）
  blockedAt: Date;
  expiresAt?: Date; // 过期时间（可选）
  unblockedAt?: Date; // 解封时间
  unblockedBy?: string; // 解封人ID
  notes?: string; // 备注
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDisputeStats {
  userId: string;
  totalDisputes: number; // 总争议数
  successfulDisputes: number; // 成功争议数
  failedDisputes: number; // 失败争议数
  fraudDisputes: number; // 恶意争议数
  disputeRate: number; // 争议率
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
