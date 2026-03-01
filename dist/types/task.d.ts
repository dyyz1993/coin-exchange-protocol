/**
 * 任务系统类型定义
 */
export declare enum TaskType {
    DAILY = "daily",// 每日任务
    WEEKLY = "weekly",// 每周任务
    SPECIAL = "special"
}
export declare enum TaskStatus {
    DRAFT = "draft",// 草稿
    PENDING = "pending",// 待激活
    ACTIVE = "active",// 活跃中
    PAUSED = "paused",// 暂停
    COMPLETED = "completed",// 已完成
    CANCELLED = "cancelled"
}
export declare enum TaskCompletionStatus {
    PENDING = "pending",// 待审核
    APPROVED = "approved",// 已通过
    REJECTED = "rejected"
}
export interface Task {
    id: string;
    title: string;
    description: string;
    reward: number;
    type: TaskType;
    status: TaskStatus;
    maxCompletions: number;
    currentCompletions: number;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface TaskCompletion {
    id: string;
    taskId: string;
    userId: string;
    reward: number;
    status: TaskCompletionStatus;
    completedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    transactionId?: string;
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
