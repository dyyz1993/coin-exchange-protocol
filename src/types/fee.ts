/**
 * 手续费系统类型定义
 */

export enum FeeType {
  TRANSACTION = 'transaction', // 交易手续费
  TRANSFER = 'transfer', // 转账手续费
  WITHDRAWAL = 'withdrawal', // 提现手续费
  TASK_CREATE = 'task_create', // 创建任务手续费
  OTHER = 'other', // 其他手续费
}

export enum FeeStatus {
  PENDING = 'pending', // 待收取
  COLLECTED = 'collected', // 已收取
  REFUNDED = 'refunded', // 已退还
}

export interface FeeRule {
  id: string;
  name: string;
  description: string;
  feeType: FeeType;
  feeRate: number; // 手续费率（如 0.02 表示 2%）
  minFee: number; // 最小手续费
  maxFee?: number; // 最大手续费（可选）
  minTransactionAmount: number; // 最小交易单位
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeRecord {
  id: string;
  userId: string; // 用户ID
  transactionId: string; // 关联的交易ID
  order?: string; // 关联的订单ID（如果有）
  feeType: FeeType;
  transactionAmount: number; // 交易金额
  feeRate: number; // 实际使用的费率
  feeAmount: number; // 手续费金额
  status: FeeStatus;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalculateFeeParams {
  amount: number;
  feeType: FeeType;
  userId?: string; // 可选，用于查询用户级别费率
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
  totalAmount: number; // 总交易金额
  totalFee: number; // 总手续费
  transactionCount: number; // 交易笔数
  averageFee: number; // 平均手续费
  averageFeeRate: number; // 平均费率
  feeByType: Map<FeeType, number>; // 按类型分组的手续费
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
