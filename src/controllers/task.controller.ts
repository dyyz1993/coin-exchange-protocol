/**
 * 任务控制器 - 处理任务相关的HTTP请求
 */

import { taskService } from '../services/task.service';
import { ApiResponse, Task } from '../types';

export class TaskController {
  /**
   * 创建任务
   * POST /api/task/create
   * Body: { title, description, reward, type }
   */
  async createTask(req: Request): Promise<ApiResponse> {
    try {
      const body = await req.json();
      const { title, description, reward, type } = body;

      return taskService.createTask(
        title,
        description || '',
        Number(reward),
        (type as Task['type']) || 'daily'
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建任务失败'
      };
    }
  }

  /**
   * 获取所有任务
   * GET /api/task/list
   */
  async getAllTasks(): Promise<ApiResponse> {
    return taskService.getAllTasks();
  }

  /**
   * 获取任务详情
   * GET /api/task/:taskId
   */
  async getTask(req: Request): Promise<ApiResponse> {
    const url = new URL(req.url);
    const taskId = url.pathname.split('/').pop();
    
    if (!taskId) {
      return { success: false, error: '缺少任务ID' };
    }

    return taskService.getTask(taskId);
  }

  /**
   * 获取用户可完成的任务
   * GET /api/task/available/:userId
   */
  async getAvailableTasks(req: Request): Promise<ApiResponse> {
    const url = new URL(req.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return { success: false, error: '缺少用户ID' };
    }

    return taskService.getAvailableTasks(userId);
  }

  /**
   * 完成任务
   * POST /api/task/complete
   * Body: { taskId, userId }
   */
  async completeTask(req: Request): Promise<ApiResponse> {
    try {
      const body = await req.json();
      const { taskId, userId } = body;

      if (!taskId || !userId) {
        return { success: false, error: '缺少必要参数' };
      }

      return taskService.completeTask(taskId, userId);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '完成任务失败'
      };
    }
  }

  /**
   * 获取用户任务完成记录
   * GET /api/task/completions/:userId
   */
  async getUserCompletions(req: Request): Promise<ApiResponse> {
    const url = new URL(req.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return { success: false, error: '缺少用户ID' };
    }

    return taskService.getUserCompletions(userId);
  }

  /**
   * 更新任务状态
   * PUT /api/task/status
   * Body: { taskId, isActive }
   */
  async updateTaskStatus(req: Request): Promise<ApiResponse> {
    try {
      const body = await req.json();
      const { taskId, isActive } = body;

      if (!taskId) {
        return { success: false, error: '缺少任务ID' };
      }

      return taskService.updateTaskStatus(taskId, isActive);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新任务状态失败'
      };
    }
  }
}

export const taskController = new TaskController();