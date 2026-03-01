/**
 * 任务控制器 - 处理任务相关的HTTP请求
 */
import { ApiResponse } from '../types';
export declare class TaskController {
    /**
     * 创建任务
     * POST /api/task/create
     */
    createTask(params: any): Promise<ApiResponse>;
    /**
     * 查询任务详情
     * GET /api/task/:taskId
     */
    getTask(params: any): Promise<ApiResponse>;
    /**
     * 获取所有任务
     * GET /api/task/list
     */
    getAllTasks(): Promise<ApiResponse>;
    /**
     * 获取活跃任务
     * GET /api/task/active
     */
    getActiveTasks(): Promise<ApiResponse>;
    /**
     * 激活任务
     * POST /api/task/activate/:taskId
     */
    activateTask(params: any): Promise<ApiResponse>;
    /**
     * 检查用户是否可完成任务
     * GET /api/task/can-complete/:taskId/:userId
     */
    canUserComplete(params: any): Promise<ApiResponse>;
    /**
     * 暂停任务
     * POST /api/task/pause/:taskId
     */
    pauseTask(params: any): Promise<ApiResponse>;
    /**
     * 取消任务
     * POST /api/task/cancel/:taskId
     */
    cancelTask(params: any): Promise<ApiResponse>;
    /**
     * 完成任务
     * POST /api/task/complete
     */
    completeTask(params: any): Promise<ApiResponse>;
    /**
     * 获取用户可完成的任务
     * GET /api/task/available/:userId
     */
    getAvailableTasks(params: any): Promise<ApiResponse>;
    /**
     * 获取用户任务完成记录
     * GET /api/task/completions/:userId
     */
    getUserCompletions(params: any): Promise<ApiResponse>;
}
export declare const taskController: TaskController;
