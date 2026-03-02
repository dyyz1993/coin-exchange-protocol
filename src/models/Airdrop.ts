/**
 * 空投模型 - 管理空投活动和领取记录
 */

import { Airdrop, AirdropClaim, AirdropStatus } from '../types';
import { Mutex } from 'async-mutex';

/**
 * 🔥 P0 溢出保护：安全加法函数
 * 检查加法是否会超过 Number.MAX_SAFE_INTEGER
 */
function safeAdd(a: number, b: number): number {
  if (a > Number.MAX_SAFE_INTEGER - b) {
    throw new Error(`Overflow detected: ${a} + ${b} exceeds Number.MAX_SAFE_INTEGER`);
  }
  return a + b;
}

/**
 * 🔥 P0 溢出保护：安全减法函数
 * 检查减法结果是否为负数
 */
function safeSubtract(a: number, b: number): number {
  const result = a - b;
  if (result < 0) {
    throw new Error(`Underflow detected: ${a} - ${b} results in negative value`);
  }
  return result;
}

export class AirdropModel {
  private airdrops: Map<string, Airdrop> = new Map();
  private claims: Map<string, AirdropClaim> = new Map();
  private userClaims: Map<string, Set<string>> = new Map(); // userId -> Set<airdropId>
  private airdropMutexes: Map<string, Mutex> = new Map(); // 🔥 P0修复: 空投级别的并发锁（async-mutex）

  /**
   * 获取或创建空投的 Mutex
   */
  private getAirdropMutex(airdropId: string): Mutex {
    if (!this.airdropMutexes.has(airdropId)) {
      this.airdropMutexes.set(airdropId, new Mutex());
    }
    return this.airdropMutexes.get(airdropId)!;
  }

  /**
   * 创建空投活动
   */
  createAirdrop(params: {
    name: string;
    description: string;
    totalAmount: number;
    perUserAmount: number;
    startTime: Date;
    endTime: Date;
  }): Airdrop {
    const airdropId = `airdrop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const airdrop: Airdrop = {
      id: airdropId,
      name: params.name,
      description: params.description,
      totalAmount: params.totalAmount,
      claimedAmount: 0, // 初始化为0
      perUserAmount: params.perUserAmount,
      startTime: params.startTime,
      endTime: params.endTime,
      status: AirdropStatus.PENDING,
      currentClaims: 0, // 初始化为0
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.airdrops.set(airdropId, airdrop);

    return airdrop;
  }

  /**
   * 获取空投活动
   */
  getAirdrop(airdropId: string): Airdrop | undefined {
    return this.airdrops.get(airdropId);
  }

  /**
   * 获取所有空投活动
   */
  getAllAirdrops(): Airdrop[] {
    return Array.from(this.airdrops.values());
  }

  /**
   * 获取活跃的空投活动
   */
  getActiveAirdrops(): Airdrop[] {
    const now = new Date();
    return Array.from(this.airdrops.values()).filter((airdrop) => {
      return (
        airdrop.status === AirdropStatus.ACTIVE &&
        airdrop.startTime <= now &&
        airdrop.endTime >= now
      );
    });
  }

  /**
   * 更新空投状态
   */
  updateAirdropStatus(airdropId: string, status: AirdropStatus): Airdrop {
    const airdrop = this.airdrops.get(airdropId);
    if (!airdrop) {
      throw new Error('Airdrop not found');
    }

    airdrop.status = status;
    return airdrop;
  }

  /**
   * 用户是否已领取空投
   */
  hasUserClaimed(userId: string, airdropId: string): boolean {
    const userClaimSet = this.userClaims.get(userId);
    if (!userClaimSet) {
      return false;
    }
    return userClaimSet.has(airdropId);
  }

  /**
   * 记录空投领取（P0 并发安全修复 + 余额超发漏洞修复）
   * 🔥 Issue #351: 修复自旋锁死锁问题，使用 async-mutex
   */
  async createClaim(airdropId: string, userId: string, _amount: number): Promise<AirdropClaim> {
    // 🔥 P0 修复：使用 async-mutex 替代自旋锁，避免死锁
    const mutex = this.getAirdropMutex(airdropId);
    const release = await mutex.acquire();

    try {
      const airdrop = this.getAirdrop(airdropId);
      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      // 检查是否已领取（幂等性检查 - 防重放攻击）
      if (this.hasUserClaimed(userId, airdropId)) {
        throw new Error('User has already claimed this airdrop');
      }

      // 检查空投状态
      if (airdrop.status !== AirdropStatus.ACTIVE) {
        throw new Error('Airdrop is not active');
      }

      // 检查时间
      const now = new Date();
      if (now < airdrop.startTime || now > airdrop.endTime) {
        throw new Error('Airdrop is not within the valid time range');
      }

      // 🔥 P0 超发漏洞修复：强制使用 perUserAmount，忽略传入的 amount
      const claimAmount = airdrop.perUserAmount;

      // 🔥 P0 修复：检查剩余余额（基于 claims 的总额检查）
      const claims = this.getAirdropClaims(airdropId);
      // 🔥 P0 溢出保护：使用安全加法
      const totalClaimed = claims.reduce((sum, claim) => safeAdd(sum, claim.amount), 0);
      // 🔥 P0 溢出保护：使用安全减法
      const remainingAmount = safeSubtract(airdrop.totalAmount, totalClaimed);

      if (remainingAmount < claimAmount) {
        throw new Error(
          `Insufficient airdrop balance. Total: ${airdrop.totalAmount}, Claimed: ${totalClaimed}, Remaining: ${remainingAmount}, Requested: ${claimAmount}`
        );
      }

      const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const claim: AirdropClaim = {
        id: claimId,
        airdropId,
        userId,
        amount: claimAmount, // 使用 perUserAmount
        claimedAt: new Date(),
      };

      this.claims.set(claimId, claim);

      // 记录用户领取
      if (!this.userClaims.has(userId)) {
        this.userClaims.set(userId, new Set());
      }
      this.userClaims.get(userId)!.add(airdropId);

      // 更新已领取金额和领取人数
      // 🔥 P0 溢出保护：使用安全加法
      airdrop.claimedAmount = safeAdd(totalClaimed, claimAmount);
      airdrop.currentClaims = claims.length + 1;
      airdrop.updatedAt = new Date();

      return claim;
    } finally {
      // 🔥 P0 修复：释放 async-mutex 锁
      release();
    }
  }

  /**
   * 获取空投领取记录
   */
  getClaim(claimId: string): AirdropClaim | undefined {
    return this.claims.get(claimId);
  }

  /**
   * 获取用户的所有领取记录
   */
  getUserClaims(userId: string): AirdropClaim[] {
    const claims: AirdropClaim[] = [];
    for (const claim of this.claims.values()) {
      if (claim.userId === userId) {
        claims.push(claim);
      }
    }
    return claims.sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
  }

  /**
   * 获取空投的所有领取记录
   */
  getAirdropClaims(airdropId: string): AirdropClaim[] {
    const claims: AirdropClaim[] = [];
    for (const claim of this.claims.values()) {
      if (claim.airdropId === airdropId) {
        claims.push(claim);
      }
    }
    return claims.sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
  }

  /**
   * 获取空投剩余余额
   */
  getRemainingAmount(airdropId: string): number {
    const airdrop = this.getAirdrop(airdropId);
    if (!airdrop) {
      throw new Error('Airdrop not found');
    }

    const claims = this.getAirdropClaims(airdropId);
    // 🔥 P0 溢出保护：使用安全加法
    const totalClaimed = claims.reduce((sum, claim) => safeAdd(sum, claim.amount), 0);
    // 🔥 P0 溢出保护：使用安全减法
    return safeSubtract(airdrop.totalAmount, totalClaimed);
  }

  /**
   * 检查空投是否已耗尽
   */
  isAirdropExhausted(airdropId: string): boolean {
    const remainingAmount = this.getRemainingAmount(airdropId);
    return remainingAmount <= 0;
  }
}

// 导出单例
export const airdropModel = new AirdropModel();
