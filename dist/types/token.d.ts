/**
 * 代币系统类型定义
 */
export type { Transaction, Account } from './common';
export { TransactionType, TransactionStatus } from './common';
export interface TokenAccount {
    id: string;
    userId: string;
    balance: number;
    frozenBalance?: number;
    totalEarned: number;
    totalSpent: number;
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
