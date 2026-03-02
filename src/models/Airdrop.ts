/**
 * 空投模型 - 管理空投活动和领取记录
 */

import { Airdrop, AirdropClaim, AirdropStatus } from '../types';

// 🔥 P0 溢出保护常量
const MAX_SAFE_AMOUNT = Number.MAX_SAFE_INTEGER / 2; // 4503599627370496 - 安全边界
const MAX_TOTAL_AMOUNT = 1e15; // 1,000,000,000,000,000 - 最大总额限制
const MAX_PER_USER_AMOUNT = 1e12; // 1,000,000,000,000 - 最大单人限制

export class AirdropModel {
  private airdrops: Map<string, Airdrop> = new Map();
  private claims: Map<string, AirdropClaim> = new Map();
  private userClaims: Map<string, Set<string>> = new Map(); // userId -> Set<airdropId>
  private airdropLocks: Map<string, boolean> = new Map(); // 🔥 P0修复: 空投锁机制（并发安全）

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
    // 🔥 P0 溢出保护：验证数值范围
    if (params.totalAmount <= 0) {
      throw new Error('totalAmount must be positive');
    }
    if (params.perUserAmount <= 0) {
      throw new Error('perUserAmount must be positive');
    }
    if (params.totalAmount > MAX_TOTAL_AMOUNT) {
      throw new Error(
        `totalAmount exceeds maximum limit: ${MAX_TOTAL_AMOUNT}. Provided: ${params.totalAmount}`
      );
    }
    if (params.perUserAmount > MAX_PER_USER_AMOUNT) {
      throw new Error(
        `perUserAmount exceeds maximum limit: ${MAX_PER_USER_AMOUNT}. Provided: ${params.perUserAmount}`
      );
    }
    if (params.perUserAmount > params.totalAmount) {
      throw new Error('perUserAmount cannot exceed totalAmount');
    }
    if (!Number.isSafeInteger(params.totalAmount) || !Number.isSafeInteger(params.perUserAmount)) {
      throw new Error('Amount values must be safe integers');
    }

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
   * 记录空投领取（P0 并发安全修复 + 余额超发漏洞修复）
   */
  createClaim(airdropId: string, userId: string, _amount: number): AirdropClaim {
    // 🔥 P0 修复：获取空投级别的锁，防止并发问题
    while (this.airdropLocks.get(airdropId)) {
      // 简单的自旋锁等待（生产环境建议使用 async-mutex）
      // 这里因为单线程环境，短暂等待即可
      const wait = new Int32Array(new SharedArrayBuffer(4));
      Atomics.wait(wait, 0, 0, 10);
    }

    try {
      // 加锁
      this.airdropLocks.set(airdropId, true);

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
      const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);

      // 🔥 P0 溢出保护：检查累加是否会溢出
      const newClaimedAmount = totalClaimed + claimAmount;
      if (newClaimedAmount > MAX_SAFE_AMOUNT) {
        throw new Error(
          `Overflow detected: claimedAmount would exceed safe limit. ` +
            `Current: ${totalClaimed}, Adding: ${claimAmount}, Limit: ${MAX_SAFE_AMOUNT}`
        );
      }

      // 🔥 P0 溢出保护：使用 Number.isSafeInteger 验证结果
      if (!Number.isSafeInteger(newClaimedAmount)) {
        throw new Error(
          `Unsafe integer detected after claim. Total claimed would be: ${newClaimedAmount}`
        );
      }

      const remainingAmount = airdrop.totalAmount - totalClaimed;

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
      airdrop.claimedAmount = totalClaimed + claimAmount; // 🔥 P0修复：使用准确值
      airdrop.currentClaims = claims.length + 1;
      airdrop.updatedAt = new Date();

      return claim;
    } finally {
      // 解锁
      this.airdropLocks.delete(airdropId);
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
    const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);
    return airdrop.totalAmount - totalClaimed;
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
