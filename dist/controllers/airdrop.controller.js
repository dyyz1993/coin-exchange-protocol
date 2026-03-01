/**
 * 空投控制器 - 处理空投相关的HTTP请求
 */
import { airdropService } from '../services/airdrop.service';
export class AirdropController {
    /**
     * 创建空投
     * POST /api/airdrop/create
     * Body: { name, description, totalAmount, perUserAmount, startTime, endTime }
     */
    async createAirdrop(params) {
        try {
            const { name, description, totalAmount, perUserAmount, startTime, endTime } = params;
            return airdropService.createAirdrop(name, description, Number(totalAmount), Number(perUserAmount), new Date(startTime), new Date(endTime));
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '创建空投失败'
            };
        }
    }
    /**
     * 获取空投详情
     * GET /api/airdrop/:airdropId
     */
    async getAirdrop(params) {
        try {
            const { airdropId } = params;
            if (!airdropId) {
                return { success: false, error: '缺少空投ID' };
            }
            return airdropService.getAirdrop(airdropId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询空投失败'
            };
        }
    }
    /**
     * 获取所有空投
     * GET /api/airdrop/list
     */
    async getAllAirdrops() {
        return airdropService.getAllAirdrops();
    }
    /**
     * 获取活跃空投
     * GET /api/airdrop/active
     */
    async getActiveAirdrops() {
        return airdropService.getActiveAirdrops();
    }
    /**
     * 激活空投
     * POST /api/airdrop/activate/:airdropId
     */
    async activateAirdrop(params) {
        try {
            const { airdropId } = params;
            if (!airdropId) {
                return { success: false, error: '缺少空投ID' };
            }
            return airdropService.activateAirdrop(airdropId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '激活空投失败'
            };
        }
    }
    /**
     * 领取空投
     * POST /api/airdrop/claim
     * Body: { airdropId, userId }
     */
    async claimAirdrop(params) {
        try {
            const { airdropId, userId } = params;
            if (!airdropId || !userId) {
                return { success: false, error: '缺少必要参数' };
            }
            return airdropService.claimAirdrop(airdropId, userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '领取空投失败'
            };
        }
    }
    /**
     * 检查用户是否可领取
     * GET /api/airdrop/can-claim/:airdropId/:userId
     */
    async canUserClaim(params) {
        try {
            const { airdropId, userId } = params;
            if (!airdropId || !userId) {
                return { success: false, error: '缺少必要参数' };
            }
            return airdropService.canUserClaim(airdropId, userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询失败'
            };
        }
    }
    /**
     * 获取用户空投领取记录
     * GET /api/airdrop/claims/:userId
     */
    async getUserClaims(params) {
        try {
            const { userId } = params;
            if (!userId) {
                return { success: false, error: '缺少用户ID' };
            }
            return airdropService.getUserClaims(userId);
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询失败'
            };
        }
    }
}
export const airdropController = new AirdropController();
