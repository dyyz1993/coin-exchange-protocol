/**
 * 空投模型 - 管理空投活动和领取记录
 */

import { Airdrop, AirdropClaim, AirdropStatus } from '../types';

export class AirdropModel {
  private airdrops: Map<string, Airdrop> = new Map();
  private claims: Map<string, AirdropClaim> = new Map();
  private userClaims: Map<string, Set<string>> = new Map(); // userId -> Set<airdropId>

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
   * 记录空投领取
   */
  createClaim(airdropId: string, userId: string, amount: number): AirdropClaim {
    const airdrop = this.getAirdrop(airdropId);
    if (!airdrop) {
      throw new Error('Airdrop not found');
    }

    // 检查是否已领取
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

    // 🔥 关键修复：检查剩余金额是否足够
    const remainingAmount = airdrop.totalAmount - airdrop.claimedAmount;
    if (remainingAmount < amount) {
      throw new Error(
        `Insufficient airdrop balance. Remaining: ${remainingAmount}, Requested: ${amount}`
      );
    }

    // 🔥 关键修复：检查是否超过每人限额
    if (amount > airdrop.perUserAmount) {
      throw new Error(
        `Amount exceeds per-user limit. Limit: ${airdrop.perUserAmount}, Requested: ${amount}`
      );
    }

    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const claim: AirdropClaim = {
      id: claimId,
      airdropId,
      userId,
      amount,
      claimedAt: new Date(),
    };

    this.claims.set(claimId, claim);

    // 记录用户领取
    if (!this.userClaims.has(userId)) {
      this.userClaims.set(userId, new Set());
    }
    this.userClaims.get(userId)!.add(airdropId);

    // 🔥 关键修复：更新已领取金额和领取人数
    airdrop.claimedAmount += amount;
    airdrop.currentClaims += 1;
    airdrop.updatedAt = new Date();

    return claim;
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
