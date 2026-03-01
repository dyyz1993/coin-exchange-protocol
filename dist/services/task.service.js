/**
 * 任务服务 - 管理任务创建、完成和奖励发放
 */
import { taskModel } from '../models/Task';
import { accountService } from './account.service';
import { TaskStatus, TransactionType } from '../types';
export class TaskService {
    /**
     * 创建任务
     */
    async createTask(params) {
        // 验证时间
        if (params.startTime >= params.endTime) {
            throw new Error('开始时间必须早于结束时间');
        }
        // 验证奖励金额
        if (params.reward <= 0) {
            throw new Error('奖励金额必须大于0');
        }
        // 验证最大完成次数
        if (params.maxCompletions <= 0) {
            throw new Error('最大完成次数必须大于0');
        }
        const task = taskModel.createTask(params);
        return {
            taskId: task.id,
            title: task.title,
            reward: task.reward,
            status: task.status
        };
    }
    /**
     * 激活任务
     */
    async activateTask(taskId) {
        const task = taskModel.getTask(taskId);
        if (!task) {
            throw new Error('任务不存在');
        }
        if (task.status !== TaskStatus.DRAFT) {
            throw new Error('只有草稿状态的任务可以激活');
        }
        const updatedTask = taskModel.updateTaskStatus(taskId, TaskStatus.ACTIVE);
        return {
            success: true,
            status: updatedTask.status
        };
    }
    /**
     * 暂停任务
     */
    async pauseTask(taskId) {
        const task = taskModel.getTask(taskId);
        if (!task) {
            throw new Error('任务不存在');
        }
        if (task.status !== TaskStatus.ACTIVE) {
            throw new Error('只有活跃状态的任务可以暂停');
        }
        const updatedTask = taskModel.updateTaskStatus(taskId, TaskStatus.PAUSED);
        return {
            success: true,
            status: updatedTask.status
        };
    }
    /**
     * 取消任务
     */
    async cancelTask(taskId) {
        const task = taskModel.getTask(taskId);
        if (!task) {
            throw new Error('任务不存在');
        }
        if (task.status === TaskStatus.COMPLETED) {
            throw new Error('已完成的任务无法取消');
        }
        const updatedTask = taskModel.updateTaskStatus(taskId, TaskStatus.CANCELLED);
        return {
            success: true,
            status: updatedTask.status
        };
    }
    /**
     * 用户完成任务
     */
    async completeTask(taskId, userId) {
        const task = taskModel.getTask(taskId);
        if (!task) {
            throw new Error('任务不存在');
        }
        // 检查任务状态
        if (task.status !== TaskStatus.ACTIVE) {
            throw new Error('任务未激活或已结束');
        }
        // 检查时间
        const now = new Date();
        if (now < task.startTime) {
            throw new Error('任务尚未开始');
        }
        if (now > task.endTime) {
            throw new Error('任务已结束');
        }
        // 检查是否已完成
        if (taskModel.hasUserCompleted(userId, taskId)) {
            throw new Error('您已经完成过此任务');
        }
        // 检查完成次数
        if (task.currentCompletions >= task.maxCompletions) {
            throw new Error('任务已完成次数已达上限');
        }
        // 创建完成记录
        const completion = taskModel.createCompletion(taskId, userId);
        // 发放奖励
        const result = await accountService.addTokens(userId, task.reward, TransactionType.TASK_REWARD, `任务奖励: ${task.title}`, completion.id);
        return {
            success: true,
            reward: task.reward,
            completionId: completion.id,
            newBalance: result.newBalance
        };
    }
    /**
     * 获取任务详情
     */
    getTaskDetail(taskId) {
        const task = taskModel.getTask(taskId);
        if (!task) {
            throw new Error('任务不存在');
        }
        const completions = taskModel.getTaskCompletions(taskId);
        return {
            task,
            completionCount: completions.length,
            canComplete: task.status === TaskStatus.ACTIVE &&
                new Date() >= task.startTime &&
                new Date() <= task.endTime &&
                task.currentCompletions < task.maxCompletions
        };
    }
    /**
     * 获取所有任务
     */
    getAllTasks() {
        return taskModel.getAllTasks();
    }
    /**
     * 获取活跃任务
     */
    getActiveTasks() {
        return taskModel.getActiveTasks();
    }
    /**
     * 获取用户可完成的任务
     */
    getAvailableTasks(userId) {
        const activeTasks = taskModel.getActiveTasks();
        return activeTasks.filter(task => {
            return !taskModel.hasUserCompleted(userId, task.id);
        }).map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            reward: task.reward,
            endTime: task.endTime,
            remainingTime: task.endTime.getTime() - Date.now(),
            remainingSlots: task.maxCompletions - task.currentCompletions
        }));
    }
    /**
     * 获取用户完成记录
     */
    getUserCompletions(userId) {
        const completions = taskModel.getUserCompletions(userId);
        return completions.map(completion => {
            const task = taskModel.getTask(completion.taskId);
            return {
                completionId: completion.id,
                taskId: completion.taskId,
                taskTitle: task?.title || '未知任务',
                reward: completion.reward,
                status: completion.status,
                completedAt: completion.completedAt
            };
        });
    }
    /**
     * 检查用户是否可完成任务
     */
    canUserComplete(taskId, userId) {
        const task = taskModel.getTask(taskId);
        if (!task) {
            return { canComplete: false, reason: '任务不存在' };
        }
        if (task.status !== TaskStatus.ACTIVE) {
            return { canComplete: false, reason: '任务未激活或已结束' };
        }
        const now = new Date();
        if (now < task.startTime) {
            return { canComplete: false, reason: '任务尚未开始' };
        }
        if (now > task.endTime) {
            return { canComplete: false, reason: '任务已结束' };
        }
        if (taskModel.hasUserCompleted(userId, taskId)) {
            return { canComplete: false, reason: '您已经完成过此任务' };
        }
        if (task.currentCompletions >= task.maxCompletions) {
            return { canComplete: false, reason: '任务已完成次数已达上限' };
        }
        return { canComplete: true };
    }
    /**
     * 获取任务统计信息
     */
    getTaskStats(taskId) {
        const allTasks = taskModel.getAllTasks();
        let activeTasks = 0;
        let completedTasks = 0;
        let totalRewardsDistributed = 0;
        if (taskId) {
            // 单个任务统计
            const task = taskModel.getTask(taskId);
            if (task) {
                const completions = taskModel.getTaskCompletions(taskId);
                totalRewardsDistributed = completions.reduce((sum, c) => sum + c.reward, 0);
                if (task.status === TaskStatus.ACTIVE)
                    activeTasks = 1;
                if (task.status === TaskStatus.COMPLETED)
                    completedTasks = 1;
            }
        }
        else {
            // 所有任务统计
            for (const task of allTasks) {
                if (task.status === TaskStatus.ACTIVE)
                    activeTasks++;
                if (task.status === TaskStatus.COMPLETED)
                    completedTasks++;
                const completions = taskModel.getTaskCompletions(task.id);
                totalRewardsDistributed += completions.reduce((sum, c) => sum + c.reward, 0);
            }
        }
        return {
            totalTasks: taskId ? 1 : allTasks.length,
            activeTasks,
            completedTasks,
            totalRewardsDistributed
        };
    }
}
// 导出单例
export const taskService = new TaskService();
