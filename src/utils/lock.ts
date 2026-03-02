/**
 * 分布式锁工具 - 基于 async-mutex 实现进程内互斥锁
 *
 * 用于保护并发操作，防止竞态条件
 */

import { Mutex } from 'async-mutex';

/**
 * 锁管理器 - 管理所有锁实例
 */
class LockManager {
  private locks: Map<string, Mutex> = new Map();

  /**
   * 获取或创建指定 key 的锁
   */
  private getLock(key: string): Mutex {
    if (!this.locks.has(key)) {
      this.locks.set(key, new Mutex());
    }
    return this.locks.get(key)!;
  }

  /**
   * 获取锁（阻塞直到获取成功）
   *
   * @param key 锁的唯一标识
   * @param timeout 超时时间（毫秒），默认 5000ms
   * @returns 释放锁的函数
   *
   * @example
   * const release = await acquireLock('airdrop:123');
   * try {
   *   // 执行受保护的代码
   * } finally {
   *   await release();
   * }
   */
  async acquireLock(key: string, timeout: number = 5000): Promise<() => void> {
    const lock = this.getLock(key);

    // 设置超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`获取锁超时: ${key} (${timeout}ms)`));
      }, timeout);
    });

    // 竞争获取锁
    const release = await Promise.race([lock.acquire(), timeoutPromise]);

    return release;
  }

  /**
   * 尝试获取锁（非阻塞）
   *
   * @param key 锁的唯一标识
   * @returns 如果成功获取锁，返回释放函数；否则返回 null
   *
   * @example
   * const release = await tryAcquireLock('airdrop:123');
   * if (release) {
   *   try {
   *     // 执行受保护的代码
   *   } finally {
   *     await release();
   *   }
   * } else {
   *   // 锁被占用，执行其他逻辑
   * }
   */
  async tryAcquireLock(key: string): Promise<(() => void) | null> {
    const lock = this.getLock(key);

    try {
      const release = lock.acquire();
      return release;
    } catch (error) {
      return null;
    }
  }

  /**
   * 使用锁执行函数（自动释放）
   *
   * @param key 锁的唯一标识
   * @param fn 要执行的函数
   * @param timeout 超时时间（毫秒）
   * @returns 函数执行结果
   *
   * @example
   * const result = await withLock('airdrop:123', async () => {
   *   // 执行受保护的代码
   *   return result;
   * });
   */
  async withLock<T>(key: string, fn: () => Promise<T>, timeout: number = 5000): Promise<T> {
    const release = await this.acquireLock(key, timeout);
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * 清理未使用的锁（防止内存泄漏）
   */
  cleanup(): void {
    this.locks.clear();
  }

  /**
   * 获取当前活跃的锁数量（用于监控）
   */
  getActiveLockCount(): number {
    return this.locks.size;
  }
}

// 导出单例
export const lockManager = new LockManager();

// 导出便捷方法
export const acquireLock = lockManager.acquireLock.bind(lockManager);
export const tryAcquireLock = lockManager.tryAcquireLock.bind(lockManager);
export const withLock = lockManager.withLock.bind(lockManager);
