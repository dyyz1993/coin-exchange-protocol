/**
 * 通用类型定义
 */

// 先定义枚举，避免前向引用问题
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
  PURCHASE = 'purchase', // 购买
}

export enum TransactionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

export interface Account {
  id?: string;
  userId: string;
  balance: number; // 可用余额
  frozenBalance: number; // 冻结余额
  totalEarned: number; // 累计获得
  totalSpent: number; // 累计消费
  version?: number; // 乐观锁版本号，用于并发控制
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  fromUserId?: string; // 可选，兼容不同场景
  toUserId?: string; // 可选，兼容不同场景
  accountId?: string; // 可选，用于 TokenAccount 等场景
  amount: number;
  type: TransactionType;
  status?: TransactionStatus; // 可选，某些场景下不需要状态
  description: string;
  balanceAfter?: number;
  relatedId?: string; // 关联ID（任务ID、空投ID等）
  referenceId?: string; // 引用ID（兼容 TokenAccount）
  createdAt: Date;
}

/**
 * 通用 API 响应类型
 * @template T - 响应数据的类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string; // 可选的错误代码
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
