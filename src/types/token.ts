/**
 * 代币系统类型定义
 */

export interface TokenAccount {
  id: string;
  userId: string;
  balance: number; // 代币余额
  totalEarned: number; // 累计获得
  totalSpent: number; // 累计消费
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number; // 交易后余额
  description: string;
  referenceId?: string; // 关联ID（任务ID、空投ID等）
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum TransactionType {
  AIRDROP = 'airdrop', // 空投
  TASK_REWARD = 'task_reward', // 任务奖励
  TRANSFER_IN = 'transfer_in', // 转账收入
  TRANSFER_OUT = 'transfer_out', // 转账支出
  REWARD = 'reward', // 其他奖励
  PENALTY = 'penalty', // 惩罚扣除
}

export interface BalanceQuery {
  userId: string;
}

export interface BalanceResponse {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface TransactionHistoryQuery {
  userId: string;
  page?: number;
  pageSize?: number;
  type?: TransactionType;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}