/**
 * API 响应类型定义
 * 用于 Controller 层的响应类型约束
 */

import { Account, Transaction, PaginatedResponse } from './common';

// ==================== Account 相关响应 ====================

/**
 * 余额响应
 */
export interface BalanceResponse {
  userId: string;
  balance: number;
  frozenBalance: number;
  availableBalance: number;
}

/**
 * 账户信息响应
 */
export interface AccountInfoResponse extends Account {
  status: string;
}

/**
 * 交易响应
 */
export interface TransactionResponse {
  transaction: Transaction;
}

/**
 * 交易列表响应
 */
export interface TransactionListResponse extends PaginatedResponse<Transaction> {}

/**
 * 冻结账户列表响应
 */
export interface FrozenAccountsListResponse {
  accounts: AccountInfoResponse[];
  total: number;
}

// ==================== Airdrop 相关响应 ====================

/**
 * 空投信息响应
 */
export interface AirdropInfoResponse {
  id: string;
  creatorId: string;
  totalAmount: number;
  remainingAmount: number;
  recipientCount: number;
  claimedCount: number;
  amountPerRecipient: number;
  description?: string;
  status: string;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * 领取空投响应
 */
export interface ClaimAirdropResponse {
  success: boolean;
  amount: number;
  transactionId: string;
}

// ==================== Task 相关响应 ====================

/**
 * 任务信息响应
 */
export interface TaskInfoResponse {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  maxParticipants?: number;
  currentParticipants: number;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
}

/**
 * 任务完成检查响应
 */
export interface CanUserCompleteResponse {
  canComplete: boolean;
  reason?: string;
}

// ==================== Freeze 相关响应 ====================

/**
 * 冻结记录响应
 */
export interface FreezeRecordResponse {
  id: string;
  userId: string;
  reason: string;
  frozenAt: Date;
  unfrozenAt?: Date;
  duration?: number;
  status: string;
}

/**
 * 冻结记录列表响应
 */
export interface FreezeRecordsListResponse extends PaginatedResponse<FreezeRecordResponse> {}

// ==================== 通用响应类型 ====================

/**
 * 成功响应
 */
export interface SuccessResponse {
  success: true;
  message: string;
  data?: any;
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * API 响应联合类型
 */
export type ApiResponse<T = any> =
  | SuccessResponse
  | ErrorResponse
  | {
      success: boolean;
      data?: T;
      error?: string;
      message?: string;
    };
