/**
 * 空投系统类型定义
 */

// import { Transaction } from './common';

export enum AirdropStatus {
  DRAFT = 'draft', // 草稿
  PENDING = 'pending', // 待激活
  ACTIVE = 'active', // 活跃中
  PAUSED = 'paused', // 暂停
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
}

export interface Airdrop {
  id: string;
  name: string;
  description: string;
  totalAmount: number; // 总金额
  claimedAmount: number; // 已领取金额
  perUserAmount: number; // 每人可领取金额
  startTime: Date; // 开始时间
  endTime: Date; // 结束时间
  status: AirdropStatus;
  maxClaims?: number; // 最大领取人数（可选）
  currentClaims: number; // 当前领取人数
  createdAt: Date;
  updatedAt: Date;
}

export interface AirdropClaim {
  id: string;
  airdropId: string;
  userId: string;
  amount: number;
  claimedAt: Date;
  transactionId?: string; // 关联的交易ID
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
