/**
 * 空投控制器 - 处理空投相关的HTTP请求
 */

import { airdropService } from '../services/airdrop.service';
import { ApiResponse } from '../types';

export class AirdropController {
  /**
   * 创建空投
   * POST /api/airdrop/create
   * Body: { name, description, totalAmount, perUserAmount, startTime, endTime }
   */
  async createAirdrop(req: Request): Promise<ApiResponse> {
    try {
      const body = await req.json();
      const { name, description, totalAmount, perUserAmount, startTime, endTime } = body;

      return airdropService.createAirdrop(
        name,
        description,
        Number(totalAmount),
        Number(perUserAmount),
        new Date(startTime),
        new Date(endTime)
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建空投失败'
      };
    }
  }

  /**
   * 获取所有空投
   * GET /api/airdrop/list
   */
  async getAllAirdrops(): Promise<ApiResponse> {
    return airdropService.getAllAirdrops();
  }

  /**
   * 获取用户可领取的空投
   * GET /api/airdrop/available/:userId
   */
  async getAvailableAirdrops(req: Request): Promise<ApiResponse> {
    const url = new URL(req.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return { success: false, error: '缺少用户ID' };
    }

    return airdropService.getAvailableAirdrops(userId);
  }

  /**
   * 领取空投
   * POST /api/airdrop/claim
   * Body: { airdropId, userId }
   */
  async claimAirdrop(req: Request): Promise<ApiResponse> {
    try {
      const body = await req.json();
      const { airdropId, userId } = body;

      if (!airdropId || !userId) {
        return { success: false, error: '缺少必要参数' };
      }

      return airdropService.claimAirdrop(airdropId, userId);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '领取空投失败'
      };
    }
  }

  /**
   * 获取用户空投领取记录
   * GET /api/airdrop/claims/:userId
   */
  async getUserClaims(req: Request): Promise<ApiResponse> {
    const url = new URL(req.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return { success: false, error: '缺少用户ID' };
    }

    return airdropService.getUserClaims(userId);
  }
}

export const airdropController = new AirdropController();