/**
 * 空投服务 - 管理空投活动和代币分发
 */

import { airdropModel } from '../models/Airdrop';
import { accountService } from './account.service';
import { AirdropStatus, TransactionType } from '../types';

export class AirdropService {
  /**
   * 创建空投活动
   */
  async createAirdrop(params: {
    name: string;
    description: string;
    totalAmount: number;
    perUserAmount: number;
    startTime: Date;
    endTime: Date;
  }): Promise<{
    airdropId: string;
    name: string;
    totalAmount: number;
    perUserAmount: number;
    status: AirdropStatus;
  }> {
    // 验证时间
    if (params.startTime >= params.endTime) {
      throw new Error('开始时间必须早于结束时间');
    }

    // 验证金额
    if (params.totalAmount <= 0 || params.perUserAmount <= 0) {
      throw new Error('金额必须大于0');
    }

    const airdrop = airdropModel.createAirdrop(params);

    return {
      airdropId: airdrop.id,
      name: airdrop.name,
      totalAmount: airdrop.totalAmount,
      perUserAmount: airdrop.perUserAmount,
      status: airdrop.status,
    };
  }

  /**
   * 启动空投活动
   */
  async startAirdrop(airdropId: string): Promise<{
    success: boolean;
    status: AirdropStatus;
  }> {
    const airdrop = airdropModel.getAirdrop(airdropId);
    if (!airdrop) {
      throw new Error('空投活动不存在');
    }

    if (airdrop.status !== AirdropStatus.PENDING) {
      throw new Error('只有待处理状态的空投可以启动');
    }

    const updatedAirdrop = airdropModel.updateAirdropStatus(airdropId, AirdropStatus.ACTIVE);

    return {
      success: true,
      status: updatedAirdrop.status,
    };
  }

  /**
   * 用户领取空投
   */
  async claimAirdrop(
    airdropId: string,
    userId: string
  ): Promise<{
    success: boolean;
    amount: number;
    claimId: string;
    newBalance: number;
  }> {
    const airdrop = airdropModel.getAirdrop(airdropId);
    if (!airdrop) {
      throw new Error('空投活动不存在');
    }

    // 检查是否已领取
    if (airdropModel.hasUserClaimed(userId, airdropId)) {
      throw new Error('您已经领取过此空投');
    }

    // 检查空投状态和时间
    const now = new Date();
    if (airdrop.status !== AirdropStatus.ACTIVE) {
      throw new Error('空投活动未激活');
    }

    if (now < airdrop.startTime) {
      throw new Error('空投活动尚未开始');
    }

    if (now > airdrop.endTime) {
      throw new Error('空投活动已结束');
    }

    // 检查总金额是否足够
    const claims = airdropModel.getAirdropClaims(airdropId);
    const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);
    const remainingAmount = airdrop.totalAmount - totalClaimed;

    if (remainingAmount < airdrop.perUserAmount) {
      throw new Error('空投金额已耗尽');
    }

    // 创建领取记录（带并发控制）
    const claim = await airdropModel.createClaim(airdropId, userId, airdrop.perUserAmount);

    // 增加用户代币
    const result = await accountService.addTokens(
      userId,
      airdrop.perUserAmount,
      TransactionType.AIRDROP,
      `空投奖励: ${airdrop.name}`,
      claim.id
    );

    return {
      success: true,
      amount: airdrop.perUserAmount,
      claimId: claim.id,
      newBalance: result.newBalance,
    };
  }

  /**
   * 结束空投活动
   */
  async endAirdrop(airdropId: string): Promise<{
    success: boolean;
    status: AirdropStatus;
    totalClaimed: number;
    totalAmount: number;
  }> {
    const airdrop = airdropModel.getAirdrop(airdropId);
    if (!airdrop) {
      throw new Error('空投活动不存在');
    }

    const claims = airdropModel.getAirdropClaims(airdropId);
    const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);

    const updatedAirdrop = airdropModel.updateAirdropStatus(airdropId, AirdropStatus.COMPLETED);

    return {
      success: true,
      status: updatedAirdrop.status,
      totalClaimed,
      totalAmount: airdrop.totalAmount,
    };
  }

  /**
   * 取消空投活动
   */
  async cancelAirdrop(
    airdropId: string,
    _reason: string
  ): Promise<{
    success: boolean;
    status: AirdropStatus;
  }> {
    const airdrop = airdropModel.getAirdrop(airdropId);
    if (!airdrop) {
      throw new Error('空投活动不存在');
    }

    if (airdrop.status === AirdropStatus.COMPLETED) {
      throw new Error('已完成的空投活动无法取消');
    }

    const updatedAirdrop = airdropModel.updateAirdropStatus(airdropId, AirdropStatus.CANCELLED);

    return {
      success: true,
      status: updatedAirdrop.status,
    };
  }

  /**
   * 获取空投详情
   */
  getAirdropDetail(airdropId: string): {
    airdrop: any;
    claimCount: number;
    totalClaimed: number;
    canClaim: boolean;
  } {
    const airdrop = airdropModel.getAirdrop(airdropId);
    if (!airdrop) {
      throw new Error('空投活动不存在');
    }

    const claims = airdropModel.getAirdropClaims(airdropId);
    const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);

    return {
      airdrop,
      claimCount: claims.length,
      totalClaimed,
      canClaim:
        airdrop.status === AirdropStatus.ACTIVE &&
        new Date() >= airdrop.startTime &&
        new Date() <= airdrop.endTime,
    };
  }

  /**
   * 获取可领取的空投列表
   */
  getClaimableAirdrops(userId: string): any[] {
    const activeAirdrops = airdropModel.getActiveAirdrops();

    return activeAirdrops
      .filter((airdrop) => {
        return !airdropModel.hasUserClaimed(userId, airdrop.id);
      })
      .map((airdrop) => ({
        id: airdrop.id,
        name: airdrop.name,
        description: airdrop.description,
        perUserAmount: airdrop.perUserAmount,
        endTime: airdrop.endTime,
        remainingTime: airdrop.endTime.getTime() - Date.now(),
      }));
  }

  /**
   * 获取用户已领取的空投记录
   */
  getUserClaimHistory(userId: string): any[] {
    const claims = airdropModel.getUserClaims(userId);

    return claims.map((claim) => {
      const airdrop = airdropModel.getAirdrop(claim.airdropId);
      return {
        claimId: claim.id,
        airdropId: claim.airdropId,
        airdropName: airdrop?.name || '未知空投',
        amount: claim.amount,
        claimedAt: claim.claimedAt,
      };
    });
  }

  /**
   * 获取空投统计信息
   */
  getAirdropStats(airdropId?: string): {
    totalAirdrops: number;
    activeAirdrops: number;
    completedAirdrops: number;
    totalDistributed: number;
  } {
    const allAirdrops = airdropModel.getAllAirdrops();
    let activeAirdrops = 0;
    let completedAirdrops = 0;
    let totalDistributed = 0;

    if (airdropId) {
      // 单个空投统计
      const airdrop = airdropModel.getAirdrop(airdropId);
      if (airdrop) {
        const claims = airdropModel.getAirdropClaims(airdropId);
        totalDistributed = claims.reduce((sum, claim) => sum + claim.amount, 0);

        if (airdrop.status === AirdropStatus.ACTIVE) activeAirdrops = 1;
        if (airdrop.status === AirdropStatus.COMPLETED) completedAirdrops = 1;
      }
    } else {
      // 所有空投统计
      for (const airdrop of allAirdrops) {
        if (airdrop.status === AirdropStatus.ACTIVE) activeAirdrops++;
        if (airdrop.status === AirdropStatus.COMPLETED) completedAirdrops++;

        const claims = airdropModel.getAirdropClaims(airdrop.id);
        totalDistributed += claims.reduce((sum, claim) => sum + claim.amount, 0);
      }
    }

    return {
      totalAirdrops: airdropId ? 1 : allAirdrops.length,
      activeAirdrops,
      completedAirdrops,
      totalDistributed,
    };
  }
}

// 导出单例
export const airdropService = new AirdropService();
