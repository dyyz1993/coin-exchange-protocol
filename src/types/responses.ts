/**
 * API 响应类型定义
 * 用于 Controller 层的响应类型约束
 */

import { Account, Transaction } from './common';

// ==================== 通用响应类型 ====================

/**
 * 成功响应
 */
export interface SuccessResponse<T = void> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  success: false;
  error: string;
}

/**
 * API 响应联合类型
 */
export type ApiResponse<T = void> = SuccessResponse<T> | ErrorResponse;

// ==================== 账户相关响应 ====================

/**
 * 创建账户响应
 */
export interface CreateAccountResponse {
  success: boolean;
  data?: Account;
  error?: string;
}

/**
 * 查询余额响应
 */
export interface BalanceResponse {
  success: boolean;
  data?: {
    userId: string;
    balance: number;
    frozenBalance: number;
    availableBalance: number;
  };
  error?: string;
}

/**
 * 充值响应
 */
export interface DepositResponse {
  success: boolean;
  data?: {
    transaction: Transaction;
    newBalance: number;
  };
  error?: string;
}

/**
 * 提现响应
 */
export interface WithdrawResponse {
  success: boolean;
  data?: {
    transaction: Transaction;
    newBalance: number;
  };
  error?: string;
}

/**
 * 转账响应
 */
export interface TransferResponse {
  success: boolean;
  data?: {
    transaction: Transaction;
    fromBalance: number;
    toBalance: number;
  };
  error?: string;
}

/**
 * 交易记录响应
 */
export interface TransactionHistoryResponse {
  success: boolean;
  data?: Transaction[];
  error?: string;
}

/**
 * 账户信息响应
 */
export interface AccountInfoResponse {
  success: boolean;
  data?: Account;
  error?: string;
}

// ==================== 空投相关响应 ====================

/**
 * 空投数据接口
 */
export interface AirdropData {
  id: string;
  name: string;
  description: string;
  totalAmount: number;
  perUserAmount: number;
  claimedAmount: number;
  claimedCount: number;
  status: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
}

/**
 * 空投响应
 */
export interface AirdropResponse {
  success: boolean;
  data?: AirdropData;
  error?: string;
}

/**
 * 空投列表响应
 */
export interface AirdropListResponse {
  success: boolean;
  data?: AirdropData[];
  error?: string;
}

/**
 * 领取空投响应
 */
export interface ClaimAirdropResponse {
  success: boolean;
  data?: {
    amount: number;
    transaction: Transaction;
  };
  error?: string;
}

/**
 * 检查是否可领取响应
 */
export interface CanClaimResponse {
  success: boolean;
  data?: {
    canClaim: boolean;
    reason?: string;
  };
  error?: string;
}

/**
 * 用户空投领取记录响应
 */
export interface UserClaimsResponse {
  success: boolean;
  data?: Array<{
    airdropId: string;
    airdropName: string;
    amount: number;
    claimedAt: Date;
  }>;
  error?: string;
}

// ==================== 任务相关响应 ====================

/**
 * 任务数据接口
 */
export interface TaskData {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: string;
  status: string;
  maxCompletions: number;
  completedCount: number;
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
}

/**
 * 任务响应
 */
export interface TaskResponse {
  success: boolean;
  data?: TaskData;
  error?: string;
}

/**
 * 任务列表响应
 */
export interface TaskListResponse {
  success: boolean;
  data?: TaskData[];
  error?: string;
}

/**
 * 完成任务响应
 */
export interface CompleteTaskResponse {
  success: boolean;
  data?: {
    reward: number;
    transaction: Transaction;
  };
  error?: string;
}

/**
 * 检查是否可完成响应
 */
export interface CanCompleteResponse {
  success: boolean;
  data?: {
    canComplete: boolean;
    reason?: string;
  };
  error?: string;
}

/**
 * 用户任务完成记录响应
 */
export interface UserCompletionsResponse {
  success: boolean;
  data?: Array<{
    taskId: string;
    taskTitle: string;
    reward: number;
    completedAt: Date;
  }>;
  error?: string;
}

// ==================== 冻结相关响应 ====================

/**
 * 冻结记录数据接口
 */
export interface FreezeRecordData {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  status: string;
  approver?: string;
  approvedAt?: Date;
  createdAt: Date;
}

/**
 * 冻结记录响应
 */
export interface FreezeRecordResponse {
  success: boolean;
  data?: FreezeRecordData;
  error?: string;
}

/**
 * 冻结记录列表响应
 */
export interface FreezeRecordListResponse {
  success: boolean;
  data?: {
    items: FreezeRecordData[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

/**
 * 冻结状态响应
 */
export interface FreezeStatusResponse {
  success: boolean;
  data?: {
    isFrozen: boolean;
    frozenAmount: number;
    frozenAt?: Date;
    reason?: string;
  };
  error?: string;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponse {
  success: boolean;
  data?: {
    successCount: number;
    failedCount: number;
    failedUsers?: string[];
  };
  error?: string;
}
