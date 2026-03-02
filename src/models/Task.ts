/**
 * 任务模型 - 管理任务和任务完成记录
 *
 * 修复并发安全问题 (Issue #312)：
 * 1. 添加 Mutex 锁确保同一任务操作串行化
 * 2. 为 Task 添加 version 字段和乐观锁
 * 3. 修复 createCompletion 的竞态条件（检查-创建-更新原子操作）
 * 4. 为 updateTaskStatus 添加版本号检查
 * 5. 转换为异步 API
 */

import { Task, TaskCompletion, TaskStatus, TaskCompletionStatus, TaskType } from '../types';
import { Mutex } from 'async-mutex';

export class TaskModel {
  private tasks: Map<string, Task> = new Map();
  private completions: Map<string, TaskCompletion> = new Map();
  private userTaskCompletions: Map<string, Set<string>> = new Map(); // userId -> Set<taskId>

  // 并发控制：使用 async-mutex 替代 busy wait
  private taskMutexes: Map<string, Mutex> = new Map(); // taskId -> Mutex

  /**
   * 获取或创建任务的 Mutex
   */
  private getTaskMutex(taskId: string): Mutex {
    if (!this.taskMutexes.has(taskId)) {
      this.taskMutexes.set(taskId, new Mutex());
    }
    return this.taskMutexes.get(taskId)!;
  }

  /**
   * 使用锁执行任务操作
   */
  private async withTaskLock<T>(taskId: string, operation: () => T | Promise<T>): Promise<T> {
    const mutex = this.getTaskMutex(taskId);
    const release = await mutex.acquire();
    try {
      return await operation();
    } finally {
      release();
    }
  }

  /**
   * 验证版本号并更新（CAS 操作）
   */
  private validateAndUpdateTask(task: Task, expectedVersion: number, updateFn: () => void): void {
    if (task.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected for task ${task.id}. ` +
          `Expected version ${expectedVersion}, but got ${task.version}`
      );
    }
    updateFn();
    task.version++;
    task.updatedAt = new Date();
  }

  /**
   * 创建任务
   */
  async createTask(params: {
    title: string;
    description: string;
    reward: number;
    maxCompletions: number;
    startTime: Date;
    endTime: Date;
    type?: TaskType;
  }): Promise<Task> {
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
      version: 0, // 初始版本号
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
   * 更新任务状态（带乐观锁，强制版本号检查）
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    expectedVersion: number
  ): Promise<Task> {
    return this.withTaskLock(taskId, () => {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      this.validateAndUpdateTask(task, expectedVersion, () => {
        task.status = status;
      });

      return task;
    });
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
   * 创建任务完成记录（修复竞态条件）
   *
   * 修复说明：
   * - 使用 Mutex 锁确保检查-创建-更新是原子操作
   * - 在锁内完成所有验证和状态更新
   * - 防止高并发下超过 maxCompletions 限制
   */
  async createCompletion(taskId: string, userId: string): Promise<TaskCompletion> {
    return this.withTaskLock(taskId, async () => {
      const task = this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // 原子操作：所有检查和更新都在锁内完成
      const currentVersion = task.version;

      this.validateAndUpdateTask(task, currentVersion, () => {
        // 检查任务状态
        if (task.status !== TaskStatus.ACTIVE) {
          throw new Error('Task is not active');
        }

        // 检查时间
        const now = new Date();
        if (now < task.startTime || now > task.endTime) {
          throw new Error('Task is not within the valid time range');
        }

        // 检查完成次数（防止超过限制）
        if (task.currentCompletions >= task.maxCompletions) {
          throw new Error('Task has reached maximum completions');
        }

        // 检查用户是否已完成（每个用户只能完成一次）
        if (this.hasUserCompleted(userId, taskId)) {
          throw new Error('User has already completed this task');
        }

        // 更新任务完成次数
        task.currentCompletions++;
      });

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

      return completion;
    });
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
