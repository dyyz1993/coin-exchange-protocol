/**
 * 任务控制器 - 处理任务相关的HTTP请求
 */
import { taskService } from '../services/task.service';
export class TaskController {
    /**
     * 创建任务
     * POST /api/task/create
     */
    async createTask(params) {
        try {
            const { title, description, reward, type, maxCompletions, startTime, endTime } = params;
            if (!title || !reward) {
                return { success: false, error: '缺少必要参数' };
            }
            return taskService.createTask({
                title,
                description: description || '',
                reward: Number(reward),
                type: type || 'daily',
                maxCompletions: maxCompletions || 0,
                startTime: startTime ? new Date(startTime) : new Date(),
                endTime: endTime ? new Date(endTime) : undefined
            });
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '创建任务失败'
            };
        }
    }
    /**
     * 查询任务详情
     * GET /api/task/:taskId
     */
    async getTask(params) {
        try {
            const { taskId } = params;
            if (!taskId) {
                return { success: false, error: '缺少任务ID' };
            }
            return taskService.getTaskDetail(taskId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询任务失败'
            };
        }
    }
    /**
     * 获取所有任务
     * GET /api/task/list
     */
    async getAllTasks() {
        try {
            return taskService.getAllTasks();
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '获取任务列表失败'
            };
        }
    }
    /**
     * 获取活跃任务
     * GET /api/task/active
     */
    async getActiveTasks() {
        try {
            return taskService.getActiveTasks();
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '获取活跃任务失败'
            };
        }
    }
    /**
     * 激活任务
     * POST /api/task/activate/:taskId
     */
    async activateTask(params) {
        try {
            const { taskId } = params;
            if (!taskId) {
                return { success: false, error: '缺少任务ID' };
            }
            return taskService.activateTask(taskId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '激活任务失败'
            };
        }
    }
    /**
     * 检查用户是否可完成任务
     * GET /api/task/can-complete/:taskId/:userId
     */
    async canUserComplete(params) {
        try {
            const { taskId, userId } = params;
            if (!taskId || !userId) {
                return { success: false, error: '缺少必要参数' };
            }
            return taskService.canUserComplete(taskId, userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '检查任务失败'
            };
        }
    }
    /**
     * 暂停任务
     * POST /api/task/pause/:taskId
     */
    async pauseTask(params) {
        try {
            const { taskId } = params;
            if (!taskId) {
                return { success: false, error: '缺少任务ID' };
            }
            return taskService.pauseTask(taskId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '暂停任务失败'
            };
        }
    }
    /**
     * 取消任务
     * POST /api/task/cancel/:taskId
     */
    async cancelTask(params) {
        try {
            const { taskId } = params;
            if (!taskId) {
                return { success: false, error: '缺少任务ID' };
            }
            return taskService.cancelTask(taskId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '取消任务失败'
            };
        }
    }
    /**
     * 完成任务
     * POST /api/task/complete
     */
    async completeTask(params) {
        try {
            const { taskId, userId } = params;
            if (!taskId || !userId) {
                return { success: false, error: '缺少必要参数' };
            }
            return taskService.completeTask(taskId, userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '完成任务失败'
            };
        }
    }
    /**
     * 获取用户可完成的任务
     * GET /api/task/available/:userId
     */
    async getAvailableTasks(params) {
        try {
            const { userId } = params;
            if (!userId) {
                return { success: false, error: '缺少用户ID' };
            }
            return taskService.getAvailableTasks(userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '获取可用任务失败'
            };
        }
    }
    /**
     * 获取用户任务完成记录
     * GET /api/task/completions/:userId
     */
    async getUserCompletions(params) {
        try {
            const { userId } = params;
            if (!userId) {
                return { success: false, error: '缺少用户ID' };
            }
            return taskService.getUserCompletions(userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '获取完成记录失败'
            };
        }
    }
}
export const taskController = new TaskController();
