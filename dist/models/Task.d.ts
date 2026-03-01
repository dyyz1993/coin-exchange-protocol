/**
 * 任务模型 - 管理任务和任务完成记录
 */
import { Task, TaskCompletion, TaskStatus } from '../types';
export declare class TaskModel {
    private tasks;
    private completions;
    private userTaskCompletions;
    /**
     * 创建任务
     */
    createTask(params: {
        title: string;
        description: string;
        reward: number;
        maxCompletions: number;
        startTime: Date;
        endTime: Date;
    }): Task;
    /**
     * 获取任务
     */
    getTask(taskId: string): Task | undefined;
    /**
     * 获取所有任务
     */
    getAllTasks(): Task[];
    /**
     * 获取活跃任务
     */
    getActiveTasks(): Task[];
    /**
     * 更新任务状态
     */
    updateTaskStatus(taskId: string, status: TaskStatus): Task;
    /**
     * 用户是否已完成任务
     */
    hasUserCompleted(userId: string, taskId: string): boolean;
    /**
     * 创建任务完成记录
     */
    createCompletion(taskId: string, userId: string): TaskCompletion;
    /**
     * 获取完成记录
     */
    getCompletion(completionId: string): TaskCompletion | undefined;
    /**
     * 获取用户的所有完成记录
     */
    getUserCompletions(userId: string): TaskCompletion[];
    /**
     * 获取任务的所有完成记录
     */
    getTaskCompletions(taskId: string): TaskCompletion[];
}
export declare const taskModel: TaskModel;
