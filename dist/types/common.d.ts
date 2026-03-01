/**
 * 通用类型定义
 */
export declare enum TransactionType {
    AIRDROP = "airdrop",// 空投
    TASK_REWARD = "task_reward",// 任务奖励
    TRANSFER = "transfer",// 通用转账
    TRANSFER_IN = "transfer_in",// 转账收入
    TRANSFER_OUT = "transfer_out",// 转账支出
    REWARD = "reward",// 其他奖励
    PENALTY = "penalty",// 惩罚扣除
    FROZEN = "frozen",// 冻结
    UNFROZEN = "unfrozen",// 解冻
    PURCHASE = "purchase"
}
export declare enum TransactionStatus {
    SUCCESS = "success",
    FAILED = "failed",
    PENDING = "pending"
}
export interface Account {
    id?: string;
    userId: string;
    balance: number;
    frozenBalance: number;
    totalEarned: number;
    totalSpent: number;
    version?: number;
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
    relatedId?: string;
    createdAt: Date;
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
