/**
 * 冻结记录模型 - 管理代币冻结和解冻记录
 */

import { Mutex } from 'async-mutex';
import { FreezeRecord, FreezeType, FreezeStatus, FREEZE_CONFIG } from '../types';

export class FreezeModel {
  private freezes: Map<string, FreezeRecord> = new Map();
  private userFreezes: Map<string, Set<string>> = new Map(); // userId -> Set<freezeId>

  // 🔒 用户级别的互斥锁 - 防止并发操作导致资金安全问题
  private userMutexes: Map<string, Mutex> = new Map();

  /**
   * 获取用户级别的互斥锁
   */
  private getUserMutex(userId: string): Mutex {
    if (!this.userMutexes.has(userId)) {
      this.userMutexes.set(userId, new Mutex());
    }
    return this.userMutexes.get(userId)!;
  }

  /**
   * 使用用户锁执行操作
   */
  private async withUserLock<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    const mutex = this.getUserMutex(userId);
    const release = await mutex.acquire();
    try {
      return await operation();
    } finally {
      release();
    }
  }

  /**
   * 创建冻结记录（添加用户级别锁保护）
   */
  async createFreeze(params: {
    userId: string;
    amount: number;
    type: FreezeType;
    transactionId?: string;
    remark?: string;
  }): Promise<FreezeRecord> {
    return this.withUserLock(params.userId, async () => {
      const now = new Date();
      const freezeId = `frz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 根据冻结类型设置过期时间
      const duration =
        params.type === FreezeType.INITIAL
          ? FREEZE_CONFIG.INITIAL_DURATION
          : FREEZE_CONFIG.DISPUTE_DURATION;

      const expiresAt = new Date(now.getTime() + duration);

      const freeze: FreezeRecord = {
        id: freezeId,
        userId: params.userId,
        amount: params.amount,
        type: params.type,
        status: FreezeStatus.FROZEN,
        transactionId: params.transactionId,
        frozenAt: now,
        expiresAt: expiresAt,
        remark: params.remark,
        createdAt: now,
        updatedAt: now,
      };

      this.freezes.set(freezeId, freeze);

      // 记录用户的冻结记录
      if (!this.userFreezes.has(params.userId)) {
        this.userFreezes.set(params.userId, new Set());
      }
      this.userFreezes.get(params.userId)!.add(freezeId);

      return freeze;
    });
  }

  /**
   * 获取冻结记录
   */
  getFreeze(freezeId: string): FreezeRecord | undefined {
    return this.freezes.get(freezeId);
  }

  /**
   * 根据交易ID获取冻结记录
   */
  getFreezeByTransactionId(transactionId: string): FreezeRecord | undefined {
    for (const freeze of this.freezes.values()) {
      if (freeze.transactionId === transactionId) {
        return freeze;
      }
    }
    return undefined;
  }

  /**
   * 获取用户的所有冻结记录
   */
  getUserFreezes(userId: string): FreezeRecord[] {
    const freezeIds = this.userFreezes.get(userId);
    if (!freezeIds) {
      return [];
    }

    const freezes: FreezeRecord[] = [];
    for (const freezeId of freezeIds) {
      const freeze = this.freezes.get(freezeId);
      if (freeze) {
        freezes.push(freeze);
      }
    }

    return freezes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取用户的活跃冻结记录
   */
  getActiveFreezes(userId: string): FreezeRecord[] {
    return this.getUserFreezes(userId).filter((freeze) => {
      return freeze.status === FreezeStatus.FROZEN && freeze.expiresAt > new Date();
    });
  }

  /**
   * 获取所有活跃的冻结记录
   */
  getAllActiveFreezes(): FreezeRecord[] {
    const now = new Date();
    const activeFreezes: FreezeRecord[] = [];

    for (const freeze of this.freezes.values()) {
      if (freeze.status === FreezeStatus.FROZEN && freeze.expiresAt > now) {
        activeFreezes.push(freeze);
      }
    }

    return activeFreezes;
  }

  /**
   * 解冻（添加用户级别锁保护）
   */
  async unfreeze(freezeId: string, reason?: string): Promise<FreezeRecord> {
    const freeze = this.freezes.get(freezeId);
    if (!freeze) {
      throw new Error('Freeze record not found');
    }

    // 使用用户级别的锁保护整个解冻过程
    return this.withUserLock(freeze.userId, async () => {
      // 双重检查：获取锁后再次验证状态
      const currentFreeze = this.freezes.get(freezeId);
      if (!currentFreeze) {
        throw new Error('Freeze record not found');
      }

      if (currentFreeze.status !== FreezeStatus.FROZEN) {
        throw new Error('Freeze is not active');
      }

      const now = new Date();

      // 判断是否超时自动解冻
      if (now > currentFreeze.expiresAt) {
        currentFreeze.status = FreezeStatus.EXPIRED;
        currentFreeze.unfreezeReason = reason || 'Expired';
      } else {
        currentFreeze.status = FreezeStatus.UNFROZEN;
        currentFreeze.unfreezeReason = reason || 'Manual unfreeze';
      }

      currentFreeze.unfrozenAt = now;
      currentFreeze.updatedAt = now;

      return currentFreeze;
    });
  }

  /**
   * 获取所有过期的冻结记录（用于定时任务）
   */
  getExpiredFreezes(): FreezeRecord[] {
    const now = new Date();
    const expiredFreezes: FreezeRecord[] = [];

    for (const freeze of this.freezes.values()) {
      if (freeze.status === FreezeStatus.FROZEN && freeze.expiresAt <= now) {
        expiredFreezes.push(freeze);
      }
    }

    return expiredFreezes;
  }

  /**
   * 批量解冻过期的冻结记录（异步版本）
   */
  async autoUnfreezeExpired(): Promise<FreezeRecord[]> {
    const expiredFreezes = this.getExpiredFreezes();
    const unfrozen: FreezeRecord[] = [];

    for (const freeze of expiredFreezes) {
      try {
        const result = await this.unfreeze(freeze.id, 'Auto unfreeze due to expiration');
        unfrozen.push(result);
      } catch (error) {
        console.error(`Failed to auto unfreeze ${freeze.id}:`, error);
      }
    }

    return unfrozen;
  }

  /**
   * 检查用户是否有足够的可用余额进行冻结（添加用户级别锁保护）
   */
  async checkFreezeAvailable(
    userId: string,
    amount: number,
    currentBalance: number
  ): Promise<boolean> {
    return this.withUserLock(userId, async () => {
      // 获取用户的活跃冻结金额
      const activeFreezes = this.getActiveFreezes(userId);
      const frozenAmount = activeFreezes.reduce((sum, f) => sum + f.amount, 0);

      // 可用余额 = 当前余额 - 活跃冻结金额
      const availableBalance = currentBalance - frozenAmount;

      return availableBalance >= amount;
    });
  }

  /**
   * 获取用户的冻结总额（添加用户级别锁保护）
   */
  async getUserFrozenAmount(userId: string): Promise<number> {
    return this.withUserLock(userId, async () => {
      const activeFreezes = this.getActiveFreezes(userId);
      return activeFreezes.reduce((sum, f) => sum + f.amount, 0);
    });
  }

  /**
   * 获取冻结统计
   */
  getFreezeStats(): {
    totalFreezes: number;
    activeFreezes: number;
    expiredFreezes: number;
    unfrozenFreezes: number;
    totalFrozenAmount: number;
  } {
    const now = new Date();
    let activeFreezes = 0;
    let expiredFreezes = 0;
    let unfrozenFreezes = 0;
    let totalFrozenAmount = 0;

    for (const freeze of this.freezes.values()) {
      if (freeze.status === FreezeStatus.FROZEN) {
        if (freeze.expiresAt > now) {
          activeFreezes++;
          totalFrozenAmount += freeze.amount;
        } else {
          expiredFreezes++;
        }
      } else if (
        freeze.status === FreezeStatus.UNFROZEN ||
        freeze.status === FreezeStatus.EXPIRED
      ) {
        unfrozenFreezes++;
      }
    }

    return {
      totalFreezes: this.freezes.size,
      activeFreezes,
      expiredFreezes,
      unfrozenFreezes,
      totalFrozenAmount,
    };
  }
}

// 导出单例
export const freezeModel = new FreezeModel();
