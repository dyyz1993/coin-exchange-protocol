/**
 * 手续费系统类型定义
 */
export declare enum FeeType {
    TRANSACTION = "transaction",// 交易手续费
    TRANSFER = "transfer",// 转账手续费
    WITHDRAWAL = "withdrawal",// 提现手续费
    TASK_CREATE = "task_create",// 创建任务手续费
    OTHER = "other"
}
export declare enum FeeStatus {
    PENDING = "pending",// 待收取
    COLLECTED = "collected",// 已收取
    REFUNDED = "refunded"
}
export interface FeeRule {
    id: string;
    name: string;
    description: string;
    feeType: FeeType;
    feeRate: number;
    minFee: number;
    maxFee?: number;
    minTransactionAmount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface FeeRecord {
    id: string;
    userId: string;
    transactionId: string;
    order?: string;
    feeType: FeeType;
    transactionAmount: number;
    feeRate: number;
    feeAmount: number;
    status: FeeStatus;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface CalculateFeeParams {
    amount: number;
    feeType: FeeType;
    userId?: string;
}
export interface CalculateFeeResult {
    amount: number;
    feeRate: number;
    feeAmount: number;
    netAmount: number;
    ruleId?: string;
}
export interface FeeStatisticsQuery {
    startDate?: Date;
    endDate?: Date;
    feeType?: FeeType;
    userId?: string;
}
export interface FeeStatistics {
    totalAmount: number;
    totalFee: number;
    transactionCount: number;
    averageFee: number;
    averageFeeRate: number;
    feeByType: Map<FeeType, number>;
}
export interface FeeTrendData {
    date: string;
    totalAmount: number;
    totalFee: number;
    transactionCount: number;
}
export interface FeeReport {
    statistics: FeeStatistics;
    trend: FeeTrendData[];
    topUsers: Array<{
        userId: string;
        totalFee: number;
        transactionCount: number;
    }>;
}
export interface CreateFeeRuleParams {
    name: string;
    description: string;
    feeType: FeeType;
    feeRate: number;
    minFee: number;
    maxFee?: number;
    minTransactionAmount: number;
}
