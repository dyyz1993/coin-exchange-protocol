/**
 * 异步锁工具 - 用于并发控制
 */

export class AsyncLock {
  private locked = false;
  private queue: Array<() => void> = [];

  /**
   * 获取锁
   */
  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * 释放锁
   */
  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }

  /**
   * 使用锁执行异步操作
   */
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * 任务锁管理器 - 为每个任务提供独立的锁
 */
export class TaskLockManager {
  private locks: Map<string, AsyncLock> = new Map();

  /**
   * 获取任务的锁
   */
  getLock(taskId: string): AsyncLock {
    if (!this.locks.has(taskId)) {
      this.locks.set(taskId, new AsyncLock());
    }
    return this.locks.get(taskId)!;
  }

  /**
   * 使用任务锁执行操作
   */
  async withTaskLock<T>(taskId: string, fn: () => Promise<T>): Promise<T> {
    const lock = this.getLock(taskId);
    return await lock.withLock(fn);
  }

  /**
   * 清理任务的锁
   */
  clearLock(taskId: string): void {
    this.locks.delete(taskId);
  }
}

// 导出单例
export const taskLockManager = new TaskLockManager();
