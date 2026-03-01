/**
 * 任务模型 - 管理任务和任务完成记录
 */

import {
  Task,
  TaskCompletion,
  TaskStatus,
  TaskCompletionStatus,
  CreateTaskParams,
  TaskType,
} from '../types';

export class TaskModel {
  private tasks: Map<string, Task> = new Map();
  private completions: Map<string, TaskCompletion> = new Map();
  private userTaskCompletions: Map<string, Set<string>> = new Map(); // userId -> Set<taskId>

  /**
   * 创建任务
   */
  createTask(params: CreateTaskParams): Task {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: Task = {
      id: taskId,
      title: params.title,
      description: params.description,
      reward: params.reward,
      type: params.type,
      maxCompletions: params.maxCompletions,
      currentCompletions: 0,
      status: TaskStatus.DRAFT,
      startTime: params.startTime,
      endTime: params.endTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, task);

    return task;
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取活跃任务
   */
  getActiveTasks(): Task[] {
    const now = new Date();
    return Array.from(this.tasks.values()).filter((task) => {
      return (
        task.status === TaskStatus.ACTIVE &&
        task.startTime <= now &&
        task.endTime >= now &&
        task.currentCompletions < task.maxCompletions
      );
    });
  }

  /**
   * 更新任务状态
   */
  updateTaskStatus(taskId: string, status: TaskStatus): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.status = status;
    return task;
  }

  /**
   * 用户是否已完成任务
   */
  hasUserCompleted(userId: string, taskId: string): boolean {
    const userTaskSet = this.userTaskCompletions.get(userId);
    if (!userTaskSet) return false;
    return userTaskSet.has(taskId);
  }

  /**
   * 创建任务完成记录
   */
  createCompletion(taskId: string, userId: string): TaskCompletion {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // 检查任务状态
    if (task.status !== TaskStatus.ACTIVE) {
      throw new Error('Task is not active');
    }

    // 检查时间
    const now = new Date();
    if (now < task.startTime || now > task.endTime) {
      throw new Error('Task is not within the valid time range');
    }

    // 检查完成次数
    if (task.currentCompletions >= task.maxCompletions) {
      throw new Error('Task has reached maximum completions');
    }

    // 检查用户是否已完成（每个用户只能完成一次）
    if (this.hasUserCompleted(userId, taskId)) {
      throw new Error('User has already completed this task');
    }

    const completionId = `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const completion: TaskCompletion = {
      id: completionId,
      taskId,
      userId,
      reward: task.reward,
      status: TaskCompletionStatus.APPROVED, // 自动审批
      completedAt: new Date(),
    };

    this.completions.set(completionId, completion);

    // 记录用户完成
    if (!this.userTaskCompletions.has(userId)) {
      this.userTaskCompletions.set(userId, new Set());
    }
    this.userTaskCompletions.get(userId)!.add(taskId);

    // 更新任务完成次数
    task.currentCompletions++;

    return completion;
  }

  /**
   * 获取完成记录
   */
  getCompletion(completionId: string): TaskCompletion | undefined {
    return this.completions.get(completionId);
  }

  /**
   * 获取用户的所有完成记录
   */
  getUserCompletions(userId: string): TaskCompletion[] {
    const completions: TaskCompletion[] = [];
    for (const completion of this.completions.values()) {
      if (completion.userId === userId) {
        completions.push(completion);
      }
    }
    return completions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  /**
   * 获取任务的所有完成记录
   */
  getTaskCompletions(taskId: string): TaskCompletion[] {
    const completions: TaskCompletion[] = [];
    for (const completion of this.completions.values()) {
      if (completion.taskId === taskId) {
        completions.push(completion);
      }
    }
    return completions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }
}

// 导出单例
export const taskModel = new TaskModel();
