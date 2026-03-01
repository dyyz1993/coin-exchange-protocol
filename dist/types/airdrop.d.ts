/**
 * 空投系统类型定义
 */
export declare enum AirdropStatus {
    DRAFT = "draft",// 草稿
    PENDING = "pending",// 待激活
    ACTIVE = "active",// 活跃中
    PAUSED = "paused",// 暂停
    COMPLETED = "completed",// 已完成
    CANCELLED = "cancelled"
}
export interface Airdrop {
    id: string;
    name: string;
    description: string;
    totalAmount: number;
    perUserAmount: number;
    startTime: Date;
    endTime: Date;
    status: AirdropStatus;
    maxClaims?: number;
    currentClaims: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface AirdropClaim {
    id: string;
    airdropId: string;
    userId: string;
    amount: number;
    claimedAt: Date;
    transactionId?: string;
}
export interface CreateAirdropParams {
    name: string;
    description: string;
    totalAmount: number;
    perUserAmount: number;
    startTime: Date;
    endTime: Date;
    maxClaims?: number;
}
export interface ClaimAirdropParams {
    airdropId: string;
    userId: string;
}
export interface AirdropResponse {
    airdrop: Airdrop;
    canClaim: boolean;
    hasClaimed: boolean;
    remainingAmount: number;
    remainingClaims: number;
}
