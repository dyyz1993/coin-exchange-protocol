/**
 * API 请求参数类型定义
 * 用于 Controller 层的参数类型约束
 */

// ==================== 账户相关请求 ====================

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
 * 充值请求
 */
export interface DepositRequest {
  userId: string;
  amount: number;
  reason?: string;
}

/**
 * 提现请求
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
export interface GetTransactionHistoryRequest {
  userId: string;
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

// ==================== 空投相关请求 ====================

/**
 * 创建空投请求
 */
export interface CreateAirdropRequest {
  name: string;
  description: string;
  totalAmount: number | string;
  perUserAmount: number | string;
  startTime: string | Date;
  endTime: string | Date;
}

/**
 * 获取空投详情请求
 */
export interface GetAirdropRequest {
  airdropId: string;
}

/**
 * 激活空投请求
 */
export interface ActivateAirdropRequest {
  airdropId: string;
}

/**
 * 领取空投请求
 */
export interface ClaimAirdropRequest {
  airdropId: string;
  userId: string;
}

/**
 * 检查用户是否可领取空投请求
 */
export interface CanUserClaimAirdropRequest {
  airdropId: string;
  userId: string;
}

/**
 * 获取用户空投领取记录请求
 */
export interface GetUserClaimsRequest {
  userId: string;
}

// ==================== 任务相关请求 ====================

/**
 * 创建任务请求
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  reward: number | string;
  type?: string;
  maxCompletions?: number;
  startTime?: string | Date;
  endTime?: string | Date;
}

/**
 * 获取任务详情请求
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
 * 检查用户是否可完成任务请求
 */
export interface CanUserCompleteTaskRequest {
  taskId: string;
  userId: string;
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
 * 完成任务请求
 */
export interface CompleteTaskRequest {
  taskId: string;
  userId: string;
}

/**
 * 获取用户可完成的任务请求
 */
export interface GetAvailableTasksRequest {
  userId: string;
}

/**
 * 获取用户任务完成记录请求
 */
export interface GetUserCompletionsRequest {
  userId: string;
}

// ==================== 冻结相关请求 ====================

/**
 * 申请冻结请求
 */
export interface ApplyFreezeRequest {
  userId: string;
  amount: number;
  reason: string;
}

/**
 * 审核通过冻结请求
 */
export interface ApproveFreezeRequest {
  freezeId: string;
  approver: string;
  comment?: string;
}

/**
 * 审核拒绝冻结请求
 */
export interface RejectFreezeRequest {
  freezeId: string;
  approver: string;
  reason: string;
}

/**
 * 解冻请求
 */
export interface UnfreezeRecordRequest {
  freezeId: string;
  operator: string;
  reason: string;
}

/**
 * 查询冻结记录列表请求
 */
export interface GetFreezeListRequest {
  userId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 查询单个冻结记录请求
 */
export interface GetFreezeByIdRequest {
  id: string;
}

/**
 * 冻结账户请求（立即冻结）
 */
export interface FreezeAccountImmediatelyRequest {
  userId: string;
  reason: string;
}

/**
 * 解冻账户请求（解除冻结状态）
 */
export interface UnfreezeAccountImmediatelyRequest {
  userId: string;
  reason: string;
}

/**
 * 获取冻结账户列表请求
 */
export interface GetFrozenAccountsRequest {
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 获取冻结状态请求
 */
export interface GetFreezeStatusRequest {
  userId: string;
}

/**
 * 批量冻结请求
 */
export interface BatchFreezeRequest {
  userIds: string[];
  reason: string;
}

/**
 * 批量解冻请求
 */
export interface BatchUnfreezeRequest {
  userIds: string[];
  reason: string;
}
