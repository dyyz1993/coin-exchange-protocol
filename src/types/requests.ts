/**
 * API 请求参数类型定义
 * 用于 Controller 层的参数类型约束
 */

// ==================== Account 相关请求 ====================

/**
 * 创建账户请求
 */
export interface CreateAccountRequest {
  userId: string;
  initialBalance?: number;
}

/**
 * 查询余额请求
 */
export interface GetBalanceRequest {
  userId: string;
}

/**
 * 充值/存款请求
 */
export interface DepositRequest {
  userId: string;
  amount: number;
  reason?: string;
}

/**
 * 提现/取款请求
 */
export interface WithdrawRequest {
  userId: string;
  amount: number;
  reason?: string;
}

/**
 * 转账请求
 */
export interface TransferRequest {
  fromUserId: string;
  toUserId: string;
  amount: number;
  reason?: string;
}

/**
 * 冻结账户请求
 */
export interface FreezeAccountRequest {
  userId: string;
  reason: string;
  duration?: number;
}

/**
 * 解冻账户请求
 */
export interface UnfreezeAccountRequest {
  userId: string;
  reason?: string;
}

/**
 * 查询交易记录请求
 */
export interface GetTransactionsRequest {
  userId: string;
  page?: number;
  pageSize?: number;
}

/**
 * 冻结余额请求
 */
export interface FreezeBalanceRequest {
  userId: string;
  amount: number;
  reason?: string;
}

/**
 * 解冻余额请求
 */
export interface UnfreezeBalanceRequest {
  userId: string;
  amount: number;
  reason?: string;
}

/**
 * 获取账户信息请求
 */
export interface GetAccountInfoRequest {
  userId: string;
}

/**
 * 更新账户状态请求
 */
export interface UpdateAccountStatusRequest {
  userId: string;
  status: string;
}

// ==================== Airdrop 相关请求 ====================

/**
 * 创建空投请求
 */
export interface CreateAirdropRequest {
  creatorId: string;
  totalAmount: number;
  recipientCount: number;
  description?: string;
  expiryDays?: number;
}

/**
 * 领取空投请求
 */
export interface ClaimAirdropRequest {
  airdropId: string;
  userId: string;
}

/**
 * 查询空投请求
 */
export interface GetAirdropRequest {
  airdropId: string;
}

// ==================== Task 相关请求 ====================

/**
 * 创建任务请求
 */
export interface CreateTaskRequest {
  creatorId: string;
  title: string;
  description: string;
  reward: number;
  maxParticipants?: number;
  startTime?: Date;
  endTime?: Date;
}

/**
 * 获取任务请求
 */
export interface GetTaskRequest {
  taskId: string;
}

/**
 * 激活任务请求
 */
export interface ActivateTaskRequest {
  taskId: string;
}

/**
 * 暂停任务请求
 */
export interface PauseTaskRequest {
  taskId: string;
}

/**
 * 取消任务请求
 */
export interface CancelTaskRequest {
  taskId: string;
}

/**
 * 检查用户是否可完成任务请求
 */
export interface CanUserCompleteRequest {
  taskId: string;
  userId: string;
}

// ==================== Freeze 相关请求 ====================

/**
 * 冻结用户请求
 */
export interface FreezeUserRequest {
  userId: string;
  reason: string;
  duration?: number;
}

/**
 * 解冻用户请求
 */
export interface UnfreezeUserRequest {
  userId: string;
  reason?: string;
}

/**
 * 获取冻结记录请求
 */
export interface GetFreezeRecordsRequest {
  userId?: string;
  page?: number;
  pageSize?: number;
}
