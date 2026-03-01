/**
 * 空投服务 - 管理空投活动和代币分发
 */
import { AirdropStatus } from '../types';
export declare class AirdropService {
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
    }): Promise<{
        airdropId: string;
        name: string;
        totalAmount: number;
        perUserAmount: number;
        status: AirdropStatus;
    }>;
    /**
     * 启动空投活动
     */
    startAirdrop(airdropId: string): Promise<{
        success: boolean;
        status: AirdropStatus;
    }>;
    /**
     * 用户领取空投
     */
    claimAirdrop(airdropId: string, userId: string): Promise<{
        success: boolean;
        amount: number;
        claimId: string;
        newBalance: number;
    }>;
    /**
     * 结束空投活动
     */
    endAirdrop(airdropId: string): Promise<{
        success: boolean;
        status: AirdropStatus;
        totalClaimed: number;
        totalAmount: number;
    }>;
    /**
     * 取消空投活动
     */
    cancelAirdrop(airdropId: string, reason: string): Promise<{
        success: boolean;
        status: AirdropStatus;
    }>;
    /**
     * 获取空投详情
     */
    getAirdropDetail(airdropId: string): {
        airdrop: any;
        claimCount: number;
        totalClaimed: number;
        canClaim: boolean;
    };
    /**
     * 获取可领取的空投列表
     */
    getClaimableAirdrops(userId: string): any[];
    /**
     * 获取用户已领取的空投记录
     */
    getUserClaimHistory(userId: string): any[];
    /**
     * 获取空投统计信息
     */
    getAirdropStats(airdropId?: string): {
        totalAirdrops: number;
        activeAirdrops: number;
        completedAirdrops: number;
        totalDistributed: number;
    };
}
export declare const airdropService: AirdropService;
