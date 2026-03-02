/**
 * 任务模型 - 管理任务和任务完成记录
 *
 * 并发安全设计（Issue #353）：
 * 1. 使用 async-mutex 保护任务操作
 * 2. 全局锁保护 Mutex 创建，防止竞态
 * 3. 读取方法返回快照，防止数据不一致
 */

import { Task, TaskCompletion, TaskStatus, TaskCompletionStatus, TaskType } from '../types';
import { Mutex } from 'async-mutex';

export class TaskModel {
  private tasks: Map<string, Task> = new Map();
  private completions: Map<string, TaskCompletion> = new Map();
  private userTaskCompletions: Map<string, Set<string>> = new Map(); // userId -> Set<taskId>

  // 并发控制：使用 async-mutex 保护任务操作
  private taskMutexes: Map<string, Mutex> = new Map(); // taskId -> Mutex
  private mutexCreationLock: Mutex = new Mutex(); // 全局锁，保护 Mutex 创建

  /**
   * 获取或创建任务的 Mutex（线程安全）
   *
   * 修复 Issue #353：使用全局锁保护 Mutex 创建，防止竞态条件
   *
   * @param taskId 任务ID
   * @returns 任务的 Mutex
   */
  private async getTaskMutex(taskId: string): Promise<Mutex> {
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
   * 使用锁执行任务操作
   *
   * @param taskId 任务ID
   * @param operation 要执行的操作
   * @returns 操作结果
   */
  private async withTaskLock<T>(taskId: string, operation: () => T | Promise<T>): Promise<T> {
    const mutex = await this.getTaskMutex(taskId);
    const release = await mutex.acquire();
    try {
      return await operation();
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
      version: 1, // 初始版本号（用于乐观锁）
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, task);

    return task;
  }

  /**
   * 获取任务（返回快照）
   *
   * 修复 Issue #353：返回深拷贝，防止外部修改影响内部数据
   *
   * @param taskId 任务ID
   * @returns 任务的快照副本，或 undefined
   */
  getTask(taskId: string): Task | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }

    // 返回深拷贝，防止外部修改影响内部数据
    return JSON.parse(JSON.stringify(task));
  }

  /**
   * 获取所有任务（返回快照数组）
   *
   * 修复 Issue #353：返回深拷贝数组，防止外部修改影响内部数据
   */
  getAllTasks(): Task[] {
    // 返回深拷贝数组，防止外部修改影响内部数据
    return Array.from(this.tasks.values()).map((task) => JSON.parse(JSON.stringify(task)));
  }

  /**
   * 获取活跃任务（返回快照数组）
   *
   * 修复 Issue #353：返回深拷贝数组，防止外部修改影响内部数据
   */
  getActiveTasks(): Task[] {
    const now = new Date();
    // 返回深拷贝数组，防止外部修改影响内部数据
    return Array.from(this.tasks.values())
      .filter((task) => {
        return (
          task.status === TaskStatus.ACTIVE &&
          task.startTime <= now &&
          task.endTime >= now &&
          task.currentCompletions < task.maxCompletions
        );
      })
      .map((task) => JSON.parse(JSON.stringify(task)));
  }

  /**
   * 更新任务状态（带乐观锁）
   *
   * @param taskId 任务ID
   * @param status 新状态
   * @param expectedVersion 预期版本号（乐观锁）
   * @returns 更新后的任务
   * @throws 如果任务不存在或版本号不匹配
   */
  updateTaskStatus(taskId: string, status: TaskStatus, expectedVersion?: number): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // 乐观锁验证
    if (expectedVersion !== undefined && task.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected. Expected version ${expectedVersion}, but current is ${task.version}`
      );
    }

    // 更新状态和版本号
    task.status = status;
    task.version = (task.version || 1) + 1;
    task.updatedAt = new Date();

    return task;
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
   * 创建任务完成记录（带锁保护）
   *
   * 修复 Issue #353：使用锁确保操作串行化，防止竞态条件
   *
   * @param taskId 任务ID
   * @param userId 用户ID
   * @returns 任务完成记录
   */
  async createCompletion(taskId: string, userId: string): Promise<TaskCompletion> {
    return this.withTaskLock(taskId, async () => {
      const task = this.tasks.get(taskId); // 在锁内获取内部引用
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

      // 检查完成次数（锁保护下，确保原子性）
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

      // 更新任务完成次数和版本号（原子操作）
      task.currentCompletions++;
      task.version = (task.version || 1) + 1;
      task.updatedAt = new Date();

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
