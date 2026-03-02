/**
 * 任务模型 - 管理任务和任务完成记录
 */

import { Task, TaskCompletion, TaskStatus, TaskCompletionStatus, TaskType } from '../types';

/**
 * 简单的互斥锁实现，用于防止并发操作
 */
class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async lock(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  unlock(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
}

export class TaskModel {
  private tasks: Map<string, Task> = new Map();
  private completions: Map<string, TaskCompletion> = new Map();
  private userTaskCompletions: Map<string, Set<string>> = new Map(); // userId -> Set<taskId>
  private taskLocks: Map<string, Mutex> = new Map(); // 每个任务一个锁
  private userTaskLocks: Map<string, Mutex> = new Map(); // 每个用户-任务组合一个锁
  private mutexCreationLock = new Mutex(); // 全局锁保护 Mutex 创建（修复 TOCTOU 竞态）

  /**
   * 获取任务级别的互斥锁（全局锁保护）
   * 🔥 P0 修复：解决锁创建的 TOCTOU 竞态条件（Issue #410）
   */
  private async getTaskMutex(taskId: string): Promise<Mutex> {
    // 快速路径：如果已存在直接返回
    if (this.taskLocks.has(taskId)) {
      return this.taskLocks.get(taskId)!;
    }

    // 慢路径：使用全局锁保护创建
    await this.mutexCreationLock.lock();
    try {
      // 双重检查
      if (!this.taskLocks.has(taskId)) {
        this.taskLocks.set(taskId, new Mutex());
      }
      return this.taskLocks.get(taskId)!;
    } finally {
      this.mutexCreationLock.unlock();
    }
  }

  /**
   * 获取用户-任务级别的互斥锁（全局锁保护）
   * 🔥 P0 修复：解决锁创建的 TOCTOU 竞态条件（Issue #410）
   */
  private async getUserTaskMutex(userId: string, taskId: string): Promise<Mutex> {
    const userTaskKey = `${userId}:${taskId}`;
    
    // 快速路径：如果已存在直接返回
    if (this.userTaskLocks.has(userTaskKey)) {
      return this.userTaskLocks.get(userTaskKey)!;
    }

    // 慢路径：使用全局锁保护创建
    await this.mutexCreationLock.lock();
    try {
      // 双重检查
      if (!this.userTaskLocks.has(userTaskKey)) {
        this.userTaskLocks.set(userTaskKey, new Mutex());
      }
      return this.userTaskLocks.get(userTaskKey)!;
    } finally {
      this.mutexCreationLock.unlock();
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
   * 更新任务状态
   */
  updateTaskStatus(taskId: string, status: TaskStatus, expectedVersion?: number): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // 乐观锁检查
    if (expectedVersion !== undefined && task.version !== expectedVersion) {
      throw new Error(
        `Optimistic lock failed: expected version ${expectedVersion}, but got ${task.version}`
      );
    }

    task.status = status;
    task.version++;
    task.updatedAt = new Date();
    return task;
  }

  /**
   * 获取任务当前版本号（用于乐观锁）
   */
  getTaskVersion(taskId: string): number {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    return task.version;
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
   * 创建任务完成记录 - 使用乐观锁和互斥锁防止并发问题
   */
  async createCompletion(
    taskId: string,
    userId: string,
    expectedVersion?: number
  ): Promise<TaskCompletion> {
    // 获取任务锁
    if (!this.taskLocks.has(taskId)) {
      this.taskLocks.set(taskId, new Mutex());
    }
    const taskLock = this.taskLocks.get(taskId)!;

    // 获取用户-任务锁（防止同一用户并发完成同一任务）
    const userTaskKey = `${userId}:${taskId}`;
    if (!this.userTaskLocks.has(userTaskKey)) {
      this.userTaskLocks.set(userTaskKey, new Mutex());
    }
    const userTaskLock = this.userTaskLocks.get(userTaskKey)!;

    // 先获取用户-任务锁，再获取任务锁（避免死锁）
    await userTaskLock.lock();
    await taskLock.lock();

    try {
      const task = this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // 乐观锁检查：验证版本号
      if (expectedVersion !== undefined && task.version !== expectedVersion) {
        throw new Error(
          `Optimistic lock failed: expected version ${expectedVersion}, but got ${task.version}`
        );
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

      // 检查完成次数（互斥锁保护）
      if (task.currentCompletions >= task.maxCompletions) {
        throw new Error('Task has reached maximum completions');
      }

      // 检查用户是否已完成（每个用户只能完成一次）
      if (!this.userTaskCompletions.has(userId)) {
        this.userTaskCompletions.set(userId, new Set());
      }

      const userTaskSet = this.userTaskCompletions.get(userId)!;
      if (userTaskSet.has(taskId)) {
        throw new Error('User has already completed this task');
      }

      // 创建完成记录
      const completionId = `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const completion: TaskCompletion = {
        id: completionId,
        taskId,
        userId,
        reward: task.reward,
        status: TaskCompletionStatus.APPROVED, // 自动审批
        completedAt: new Date(),
      };

      // 原子性操作：按正确顺序更新状态
      // 1. 添加完成记录
      this.completions.set(completionId, completion);

      // 2. 记录用户完成（防止重复）
      userTaskSet.add(taskId);

      // 3. 更新任务完成次数和版本号（乐观锁）
      task.currentCompletions++;
      task.version++;
      task.updatedAt = new Date();

      return completion;
    } finally {
      // 释放锁（按相反顺序）
      taskLock.unlock();
      userTaskLock.unlock();
    }
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
