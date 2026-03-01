/**
 * 冻结控制器 - 处理账户冻结相关的HTTP请求
 */

import { freezeService } from '../services/freeze.service';
import { ApiResponse } from '../types';

export class FreezeController {
  /**
   * 申请冻结
   * POST /api/freeze/apply
   * Body: { userId: string, amount: number, reason: string }
   */
  async applyFreeze(params: any): Promise<ApiResponse> {
    try {
      const { userId, amount, reason } = params;
      
      // 输入验证
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: '无效的用户ID' };
      }
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return { success: false, error: '无效的冻结金额' };
      }
      
      if (!reason || typeof reason !== 'string') {
        return { success: false, error: '冻结原因不能为空' };
      }
      
      // 调用服务层
      return freezeService.applyFreeze(userId, amount, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '申请冻结失败' 
      };
    }
  }

  /**
   * 审核通过
   * POST /api/freeze/approve
   * Body: { freezeId: string, approver: string, comment?: string }
   */
  async approveFreeze(params: any): Promise<ApiResponse> {
    try {
      const { freezeId, approver, comment } = params;
      
      // 输入验证
      if (!freezeId || typeof freezeId !== 'string') {
        return { success: false, error: '无效的冻结ID' };
      }
      
      if (!approver || typeof approver !== 'string') {
        return { success: false, error: '无效的审核人ID' };
      }
      
      // 调用服务层
      return freezeService.approveFreeze(freezeId, approver, comment);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '审核失败' 
      };
    }
  }

  /**
   * 审核拒绝
   * POST /api/freeze/reject
   * Body: { freezeId: string, approver: string, reason: string }
   */
  async rejectFreeze(params: any): Promise<ApiResponse> {
    try {
      const { freezeId, approver, reason } = params;
      
      // 输入验证
      if (!freezeId || typeof freezeId !== 'string') {
        return { success: false, error: '无效的冻结ID' };
      }
      
      if (!approver || typeof approver !== 'string') {
        return { success: false, error: '无效的审核人ID' };
      }
      
      if (!reason || typeof reason !== 'string') {
        return { success: false, error: '拒绝原因不能为空' };
      }
      
      // 调用服务层
      return freezeService.rejectFreeze(freezeId, approver, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '审核失败' 
      };
    }
  }

  /**
   * 解冻
   * POST /api/freeze/unfreeze
   * Body: { freezeId: string, operator: string, reason: string }
   */
  async unfreeze(params: any): Promise<ApiResponse> {
    try {
      const { freezeId, operator, reason } = params;
      
      // 输入验证
      if (!freezeId || typeof freezeId !== 'string') {
        return { success: false, error: '无效的冻结ID' };
      }
      
      if (!operator || typeof operator !== 'string') {
        return { success: false, error: '无效的操作人ID' };
      }
      
      if (!reason || typeof reason !== 'string') {
        return { success: false, error: '解冻原因不能为空' };
      }
      
      // 调用服务层
      return freezeService.unfreeze(freezeId, operator, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '解冻失败' 
      };
    }
  }

  /**
   * 查询冻结记录列表
   * GET /api/freeze/list?userId=xxx&status=xxx&page=1&pageSize=10
   */
  async getFreezeList(params: any): Promise<ApiResponse> {
    try {
      const { userId, status, page = 1, pageSize = 10 } = params;
      
      // 输入验证
      if (page < 1 || pageSize < 1 || pageSize > 100) {
        return { success: false, error: '无效的分页参数' };
      }
      
      // 调用服务层
      return freezeService.getFreezeList({ userId, status, page, pageSize });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '查询失败' 
      };
    }
  }

  /**
   * 查询单个冻结记录
   * GET /api/freeze/:id
   */
  async getFreezeById(params: any): Promise<ApiResponse> {
    try {
      const { id } = params;
      
      if (!id) {
        return { success: false, error: '缺少冻结ID' };
      }
      
      // 调用服务层
      return freezeService.getFreezeById(id);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '查询失败' 
      };
    }
  }
}

export const freezeController = new FreezeController();
