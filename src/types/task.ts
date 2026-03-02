/**
 * 任务系统类型定义
 */

export enum TaskType {
  DAILY = 'daily', // 每日任务
  WEEKLY = 'weekly', // 每周任务
  SPECIAL = 'special', // 特殊任务
}

export enum TaskStatus {
  DRAFT = 'draft', // 草稿
  PENDING = 'pending', // 待激活
  ACTIVE = 'active', // 活跃中
  PAUSED = 'paused', // 暂停
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
}

export enum TaskCompletionStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number; // 奖励金额
  type: TaskType;
  status: TaskStatus;
  maxCompletions: number; // 最大完成人数
  currentCompletions: number; // 当前完成人数
  startTime: Date; // 开始时间
  endTime: Date; // 结束时间
  version: number; // 乐观锁版本号（Issue #353）
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  reward: number; // 实际获得的奖励
  status: TaskCompletionStatus;
  completedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  transactionId?: string; // 关联的交易ID
  remark?: string;
}

export interface CreateTaskParams {
  title: string;
  description: string;
  reward: number;
  type: TaskType;
  maxCompletions: number;
  startTime: Date;
  endTime: Date;
}

export interface CompleteTaskParams {
  taskId: string;
  userId: string;
}

export interface TaskResponse {
  task: Task;
  canComplete: boolean;
  hasCompleted: boolean;
  remainingCompletions: number;
}
