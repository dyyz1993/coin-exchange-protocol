/**
 * 空投模型 - 管理空投活动和领取记录
 */
import { Airdrop, AirdropClaim, AirdropStatus } from '../types';
export declare class AirdropModel {
    private airdrops;
    private claims;
    private userClaims;
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
    }): Airdrop;
    /**
     * 获取空投活动
     */
    getAirdrop(airdropId: string): Airdrop | undefined;
    /**
     * 获取所有空投活动
     */
    getAllAirdrops(): Airdrop[];
    /**
     * 获取活跃的空投活动
     */
    getActiveAirdrops(): Airdrop[];
    /**
     * 更新空投状态
     */
    updateAirdropStatus(airdropId: string, status: AirdropStatus): Airdrop;
    /**
     * 用户是否已领取空投
     */
    hasUserClaimed(userId: string, airdropId: string): boolean;
    /**
     * 记录空投领取
     */
    createClaim(airdropId: string, userId: string, amount: number): AirdropClaim;
    /**
     * 获取空投领取记录
     */
    getClaim(claimId: string): AirdropClaim | undefined;
    /**
     * 获取用户的所有领取记录
     */
    getUserClaims(userId: string): AirdropClaim[];
    /**
     * 获取空投的所有领取记录
     */
    getAirdropClaims(airdropId: string): AirdropClaim[];
}
export declare const airdropModel: AirdropModel;
