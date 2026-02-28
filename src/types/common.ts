/**
 * 通用类型定义
 */

export interface Account {
  id?: string;
  userId: string;
  balance: number; // 可用余额
  frozenBalance: number; // 冻结余额
  totalEarned: number; // 累计获得
  totalSpent: number; // 累计消费
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  balanceAfter?: number;
  relatedId?: string; // 关联ID（任务ID、空投ID等）
  createdAt: Date;
}

export enum TransactionType {
  AIRDROP = 'airdrop', // 空投
  TASK_REWARD = 'task_reward', // 任务奖励
  TRANSFER = 'transfer', // 通用转账
  TRANSFER_IN = 'transfer_in', // 转账收入
  TRANSFER_OUT = 'transfer_out', // 转账支出
  REWARD = 'reward', // 其他奖励
  PENALTY = 'penalty', // 惩罚扣除
  FROZEN = 'frozen', // 冻结
  UNFROZEN = 'unfrozen', // 解冻
}

export enum TransactionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
