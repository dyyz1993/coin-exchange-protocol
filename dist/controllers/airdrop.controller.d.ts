/**
 * 空投控制器 - 处理空投相关的HTTP请求
 */
import { ApiResponse } from '../types';
export declare class AirdropController {
    /**
     * 创建空投
     * POST /api/airdrop/create
     * Body: { name, description, totalAmount, perUserAmount, startTime, endTime }
     */
    createAirdrop(params: any): Promise<ApiResponse>;
    /**
     * 获取空投详情
     * GET /api/airdrop/:airdropId
     */
    getAirdrop(params: any): Promise<ApiResponse>;
    /**
     * 获取所有空投
     * GET /api/airdrop/list
     */
    getAllAirdrops(): Promise<ApiResponse>;
    /**
     * 获取活跃空投
     * GET /api/airdrop/active
     */
    getActiveAirdrops(): Promise<ApiResponse>;
    /**
     * 激活空投
     * POST /api/airdrop/activate/:airdropId
     */
    activateAirdrop(params: any): Promise<ApiResponse>;
    /**
     * 领取空投
     * POST /api/airdrop/claim
     * Body: { airdropId, userId }
     */
    claimAirdrop(params: any): Promise<ApiResponse>;
    /**
     * 检查用户是否可领取
     * GET /api/airdrop/can-claim/:airdropId/:userId
     */
    canUserClaim(params: any): Promise<ApiResponse>;
    /**
     * 获取用户空投领取记录
     * GET /api/airdrop/claims/:userId
     */
    getUserClaims(params: any): Promise<ApiResponse>;
}
export declare const airdropController: AirdropController;
