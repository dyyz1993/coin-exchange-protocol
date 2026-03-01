/**
 * 空投模型 - 管理空投活动和领取记录
 */
import { AirdropStatus } from '../types';
export class AirdropModel {
    airdrops = new Map();
    claims = new Map();
    userClaims = new Map(); // userId -> Set<airdropId>
    /**
     * 创建空投活动
     */
    createAirdrop(params) {
        const airdropId = `airdrop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const airdrop = {
            id: airdropId,
            name: params.name,
            description: params.description,
            totalAmount: params.totalAmount,
            perUserAmount: params.perUserAmount,
            startTime: params.startTime,
            endTime: params.endTime,
            status: AirdropStatus.PENDING,
            createdAt: new Date()
        };
        this.airdrops.set(airdropId, airdrop);
        return airdrop;
    }
    /**
     * 获取空投活动
     */
    getAirdrop(airdropId) {
        return this.airdrops.get(airdropId);
    }
    /**
     * 获取所有空投活动
     */
    getAllAirdrops() {
        return Array.from(this.airdrops.values());
    }
    /**
     * 获取活跃的空投活动
     */
    getActiveAirdrops() {
        const now = new Date();
        return Array.from(this.airdrops.values()).filter(airdrop => {
            return airdrop.status === AirdropStatus.ACTIVE &&
                airdrop.startTime <= now &&
                airdrop.endTime >= now;
        });
    }
    /**
     * 更新空投状态
     */
    updateAirdropStatus(airdropId, status) {
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
    hasUserClaimed(userId, airdropId) {
        const userClaimSet = this.userClaims.get(userId);
        if (!userClaimSet)
            return false;
        return userClaimSet.has(airdropId);
    }
    /**
     * 记录空投领取
     */
    createClaim(airdropId, userId, amount) {
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
        const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const claim = {
            id: claimId,
            airdropId,
            userId,
            amount,
            claimedAt: new Date()
        };
        this.claims.set(claimId, claim);
        // 记录用户领取
        if (!this.userClaims.has(userId)) {
            this.userClaims.set(userId, new Set());
        }
        this.userClaims.get(userId).add(airdropId);
        return claim;
    }
    /**
     * 获取空投领取记录
     */
    getClaim(claimId) {
        return this.claims.get(claimId);
    }
    /**
     * 获取用户的所有领取记录
     */
    getUserClaims(userId) {
        const claims = [];
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
    getAirdropClaims(airdropId) {
        const claims = [];
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
