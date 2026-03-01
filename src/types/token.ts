/**
 * 代币系统类型定义
 */

// 从 common.ts 导入统一的类型定义
// 使用 export type 导出接口，使用 export 导出枚举
export type { Transaction, Account } from './common';
export { TransactionType, TransactionStatus } from './common';

export interface TokenAccount {
  id: string;
  userId: string;
  balance: number; // 代币余额
  frozenBalance?: number; // 冻结余额
  totalEarned: number; // 累计获得
  totalSpent: number; // 累计消费
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceQuery {
  userId: string;
}

export interface BalanceResponse {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  frozenBalance?: number;
}

export interface TransactionHistoryQuery {
  userId: string;
  page?: number;
  pageSize?: number;
  type?: import('./common').TransactionType;
}

export interface TransactionHistoryResponse {
  transactions: import('./common').Transaction[];
  total: number;
  page: number;
  pageSize: number;
}
