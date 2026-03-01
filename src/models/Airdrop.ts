/**
 * 空投模型 - 管理空投活动和领取记录
 */

import { Airdrop, AirdropClaim, AirdropStatus } from '../types';

export class AirdropModel {
  private airdrops: Map<string, Airdrop> = new Map();
  private claims: Map<string, AirdropClaim> = new Map();
  private userClaims: Map<string, Set<string>> = new Map(); // userId -> Set<airdropId>

  // 🔥 并发安全：内存锁机制
  private claimLocks: Map<string, boolean> = new Map(); // 锁定键: `${userId}:${airdropId}`
  private airdropLocks: Map<string, boolean> = new Map(); // 空投活动锁

  // 🔥 防重放攻击：请求幂等性检查
  private requestCache: Map<string, { timestamp: number; result: AirdropClaim }> = new Map();

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
    if (!userClaimSet) return false;
    return userClaimSet.has(airdropId);
  }

  /**
   * 🔥 并发安全：获取用户领取锁
   */
  private acquireClaimLock(userId: string, airdropId: string): boolean {
    const lockKey = `${userId}:${airdropId}`;
    if (this.claimLocks.get(lockKey)) {
      return false; // 已被锁定
    }
    this.claimLocks.set(lockKey, true);
    return true;
  }

  /**
   * 🔥 并发安全：释放用户领取锁
   */
  private releaseClaimLock(userId: string, airdropId: string): void {
    const lockKey = `${userId}:${airdropId}`;
    this.claimLocks.delete(lockKey);
  }

  /**
   * 🔥 并发安全：获取空投活动锁
   */
  private acquireAirdropLock(airdropId: string): boolean {
    if (this.airdropLocks.get(airdropId)) {
      return false; // 已被锁定
    }
    this.airdropLocks.set(airdropId, true);
    return true;
  }

  /**
   * 🔥 并发安全：释放空投活动锁
   */
  private releaseAirdropLock(airdropId: string): void {
    this.airdropLocks.delete(airdropId);
  }

  /**
   * 🔥 防重放攻击：检查请求幂等性
   * 使用 requestId 或 userId+airdropId 组合来防止重复请求
   */
  private checkIdempotency(
    userId: string,
    airdropId: string,
    requestId?: string
  ): { isDuplicate: boolean; cachedResult?: AirdropClaim } {
    // 如果用户已经领取过，直接返回
    if (this.hasUserClaimed(userId, airdropId)) {
      const claims = this.getUserClaims(userId);
      const existingClaim = claims.find((c) => c.airdropId === airdropId);
      return { isDuplicate: true, cachedResult: existingClaim };
    }

    // 如果提供了 requestId，检查缓存
    if (requestId) {
      const cached = this.requestCache.get(requestId);
      if (cached) {
        // 如果缓存在 5 分钟内，认为是重复请求
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
          return { isDuplicate: true, cachedResult: cached.result };
        }
      }
    }

    return { isDuplicate: false };
  }

  /**
   * 🔥 防重放攻击：缓存请求结果
   */
  private cacheRequestResult(requestId: string, result: AirdropClaim): void {
    this.requestCache.set(requestId, { timestamp: Date.now(), result });

    // 清理过期缓存（保留最近 10 分钟的）
    const expireTime = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of this.requestCache.entries()) {
      if (value.timestamp < expireTime) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * 记录空投领取（并发安全版本）
   */
  createClaim(airdropId: string, userId: string, amount: number, requestId?: string): AirdropClaim {
    // 🔥 步骤 1: 防重放攻击检查（快速失败）
    const idempotencyCheck = this.checkIdempotency(userId, airdropId, requestId);
    if (idempotencyCheck.isDuplicate && idempotencyCheck.cachedResult) {
      // 如果是重复请求，返回之前的结果（幂等性）
      console.log(
        `[AirdropModel] Duplicate request detected for user ${userId}, airdrop ${airdropId}`
      );
      return idempotencyCheck.cachedResult;
    }

    // 🔥 步骤 2: 获取用户领取锁（防止同一用户并发领取）
    if (!this.acquireClaimLock(userId, airdropId)) {
      throw new Error('Your claim request is being processed, please wait');
    }

    // 🔥 步骤 3: 获取空投活动锁（防止并发修改活动数据）
    if (!this.acquireAirdropLock(airdropId)) {
      this.releaseClaimLock(userId, airdropId);
      throw new Error('Airdrop is being updated, please try again later');
    }

    try {
      // 🔥 步骤 4: 在锁的保护下进行所有检查和操作（原子操作）

      const airdrop = this.getAirdrop(airdropId);
      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      // 再次检查是否已领取（双重检查锁定模式）
      if (this.hasUserClaimed(userId, airdropId)) {
        const claims = this.getUserClaims(userId);
        const existingClaim = claims.find((c) => c.airdropId === airdropId);
        if (existingClaim) {
          return existingClaim; // 幂等性：返回已有记录
        }
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

      // 🔥 关键：检查剩余金额是否足够（使用 claimedAmount 而不是重新计算）
      const remainingAmount = airdrop.totalAmount - airdrop.claimedAmount;
      if (remainingAmount < amount) {
        throw new Error(
          `Insufficient airdrop balance. Remaining: ${remainingAmount}, Requested: ${amount}`
        );
      }

      // 检查是否超过每人限额
      if (amount > airdrop.perUserAmount) {
        throw new Error(
          `Amount exceeds per-user limit. Limit: ${airdrop.perUserAmount}, Requested: ${amount}`
        );
      }

      // 🔥 步骤 5: 创建领取记录（所有验证通过后）
      const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const claim: AirdropClaim = {
        id: claimId,
        airdropId,
        userId,
        amount,
        claimedAt: new Date(),
      };

      // 保存领取记录
      this.claims.set(claimId, claim);

      // 记录用户领取关系
      if (!this.userClaims.has(userId)) {
        this.userClaims.set(userId, new Set());
      }
      this.userClaims.get(userId)!.add(airdropId);

      // 🔥 关键：更新已领取金额和领取人数（原子更新）
      airdrop.claimedAmount += amount;
      airdrop.currentClaims += 1;
      airdrop.updatedAt = new Date();

      // 🔥 步骤 6: 缓存请求结果（防重放）
      if (requestId) {
        this.cacheRequestResult(requestId, claim);
      }

      console.log(
        `[AirdropModel] Claim created successfully: user=${userId}, airdrop=${airdropId}, amount=${amount}, remaining=${airdrop.totalAmount - airdrop.claimedAmount}`
      );

      return claim;
    } finally {
      // 🔥 步骤 7: 释放锁（确保一定会执行）
      this.releaseAirdropLock(airdropId);
      this.releaseClaimLock(userId, airdropId);
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
}

// 导出单例
export const airdropModel = new AirdropModel();
