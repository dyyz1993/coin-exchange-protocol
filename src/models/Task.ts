/**
 * 任务模型 - 管理任务和任务完成记录
 * 包含并发安全保护机制
 */

import { Mutex } from 'async-mutex';
import { Task, TaskCompletion, TaskStatus, TaskCompletionStatus, TaskType } from '../types';

export class TaskModel {
  private tasks: Map<string, Task> = new Map();
  private completions: Map<string, TaskCompletion> = new Map();
  private userTaskCompletions: Map<string, Set<string>> = new Map(); // userId -> Set<taskId>

  // 并发安全：任务级锁
  private taskMutexes: Map<string, Mutex> = new Map();
  // 全局锁保护 Mutex 创建
  private mutexCreationLock: Mutex = new Mutex();

  // 乐观锁：任务版本号
  private taskVersions: Map<string, number> = new Map();

  /**
   * 获取任务锁（线程安全）
   */
  private async getTaskMutex(taskId: string): Promise<Mutex> {
    // 使用全局锁保护 Mutex 创建，避免竞态条件
    const release = await this.mutexCreationLock.acquire();
    try {
      if (!this.taskMutexes.has(taskId)) {
        this.taskMutexes.set(taskId, new Mutex());
      }
      return this.taskMutexes.get(taskId)!;
    } finally {
      release();
    }
  }

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
    type?: TaskType;
  }): Task {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: Task = {
      id: taskId,
      title: params.title,
      description: params.description,
      reward: params.reward,
      type: params.type || TaskType.SPECIAL,
      maxCompletions: params.maxCompletions,
      currentCompletions: 0,
      status: TaskStatus.DRAFT,
      startTime: params.startTime,
      endTime: params.endTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, task);
    // 初始化版本号
    this.taskVersions.set(taskId, 1);

    return task;
  }

  /**
   * 获取任务（返回快照）
   */
  getTask(taskId: string): Task | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }
    // 返回快照避免外部修改
    return { ...task };
  }

  /**
   * 获取所有任务（返回快照）
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values()).map((task) => ({ ...task }));
  }

  /**
   * 获取活跃任务（返回快照）
   */
  getActiveTasks(): Task[] {
    const now = new Date();
    return Array.from(this.tasks.values())
      .filter((task) => {
        return (
          task.status === TaskStatus.ACTIVE &&
          task.startTime <= now &&
          task.endTime >= now &&
          task.currentCompletions < task.maxCompletions
        );
      })
      .map((task) => ({ ...task })); // 返回快照
  }

  /**
   * 更新任务状态（带乐观锁检查）
   */
  updateTaskStatus(taskId: string, status: TaskStatus, expectedVersion?: number): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // 乐观锁检查
    if (expectedVersion !== undefined) {
      const currentVersion = this.taskVersions.get(taskId) || 1;
      if (currentVersion !== expectedVersion) {
        throw new Error('Task has been modified by another operation');
      }
    }

    task.status = status;
    task.updatedAt = new Date();
    // 更新版本号
    this.taskVersions.set(taskId, (this.taskVersions.get(taskId) || 1) + 1);

    return { ...task };
  }

  /**
   * 用户是否已完成任务
   */
  hasUserCompleted(userId: string, taskId: string): boolean {
    const userTaskSet = this.userTaskCompletions.get(userId);
    if (!userTaskSet) {
      return false;
    }
    return userTaskSet.has(taskId);
  }

  /**
   * 创建任务完成记录（并发安全）
   * 使用任务级锁确保原子性
   */
  async createCompletion(taskId: string, userId: string): Promise<TaskCompletion> {
    // 获取任务锁
    const mutex = await this.getTaskMutex(taskId);
    const release = await mutex.acquire();

    try {
      const task = this.tasks.get(taskId);
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

      // 检查完成次数（在锁保护下进行，确保原子性）
      if (task.currentCompletions >= task.maxCompletions) {
        throw new Error('Task has reached maximum completions');
      }

      // 检查用户是否已完成（在锁保护下进行）
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

      // 原子性更新所有状态
      this.completions.set(completionId, completion);

      // 记录用户完成
      if (!this.userTaskCompletions.has(userId)) {
        this.userTaskCompletions.set(userId, new Set());
      }
      this.userTaskCompletions.get(userId)!.add(taskId);

      // 更新任务完成次数
      task.currentCompletions++;
      task.updatedAt = new Date();

      // 更新版本号
      this.taskVersions.set(taskId, (this.taskVersions.get(taskId) || 1) + 1);

      return completion;
    } finally {
      release();
    }
  }

  /**
   * 获取完成记录
   */
  getCompletion(completionId: string): TaskCompletion | undefined {
    const completion = this.completions.get(completionId);
    if (!completion) {
      return undefined;
    }
    // 返回快照
    return { ...completion };
  }

  /**
   * 获取用户的所有完成记录（返回快照）
   */
  getUserCompletions(userId: string): TaskCompletion[] {
    const completions: TaskCompletion[] = [];
    for (const completion of this.completions.values()) {
      if (completion.userId === userId) {
        completions.push({ ...completion });
      }
    }
    return completions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  /**
   * 获取任务的所有完成记录（返回快照）
   */
  getTaskCompletions(taskId: string): TaskCompletion[] {
    const completions: TaskCompletion[] = [];
    for (const completion of this.completions.values()) {
      if (completion.taskId === taskId) {
        completions.push({ ...completion });
      }
    }
    return completions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  /**
   * 获取任务当前版本号（用于乐观锁）
   */
  getTaskVersion(taskId: string): number {
    return this.taskVersions.get(taskId) || 0;
  }
}

// 导出单例
export const taskModel = new TaskModel();
