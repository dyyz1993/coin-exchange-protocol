/**
 * 任务服务 - 管理任务创建、完成和奖励发放
 */
import { TaskStatus } from '../types';
export declare class TaskService {
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
    }): Promise<{
        taskId: string;
        title: string;
        reward: number;
        status: TaskStatus;
    }>;
    /**
     * 激活任务
     */
    activateTask(taskId: string): Promise<{
        success: boolean;
        status: TaskStatus;
    }>;
    /**
     * 暂停任务
     */
    pauseTask(taskId: string): Promise<{
        success: boolean;
        status: TaskStatus;
    }>;
    /**
     * 取消任务
     */
    cancelTask(taskId: string): Promise<{
        success: boolean;
        status: TaskStatus;
    }>;
    /**
     * 用户完成任务
     */
    completeTask(taskId: string, userId: string): Promise<{
        success: boolean;
        reward: number;
        completionId: string;
        newBalance: number;
    }>;
    /**
     * 获取任务详情
     */
    getTaskDetail(taskId: string): {
        task: any;
        completionCount: number;
        canComplete: boolean;
    };
    /**
     * 获取所有任务
     */
    getAllTasks(): any[];
    /**
     * 获取活跃任务
     */
    getActiveTasks(): any[];
    /**
     * 获取用户可完成的任务
     */
    getAvailableTasks(userId: string): any[];
    /**
     * 获取用户完成记录
     */
    getUserCompletions(userId: string): any[];
    /**
     * 检查用户是否可完成任务
     */
    canUserComplete(taskId: string, userId: string): {
        canComplete: boolean;
        reason?: string;
    };
    /**
     * 获取任务统计信息
     */
    getTaskStats(taskId?: string): {
        totalTasks: number;
        activeTasks: number;
        completedTasks: number;
        totalRewardsDistributed: number;
    };
}
export declare const taskService: TaskService;
