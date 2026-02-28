/**
 * 争议处理服务 - 完整的争议处理流程
 */

import { orderModel } from '../models/Order';
import { freezeService } from './freeze.service';
import { evidenceModel } from '../models/Evidence';
import { 
  Dispute, 
  DisputeStatus,
  Evidence,
  EvidenceType,
  DisputeStatusExtended,
  JudgmentType,
  DisputeJudgment,
  CustomerServiceAction,
  DisputeTimeline,
  CreateDisputeRequest,
  UploadEvidenceRequest,
  MakeJudgmentRequest,
  DisputeResponse,
  DISPUTE_CONFIG
} from '../types/dispute';

export class DisputeService {
  private judgments: Map<string, DisputeJudgment> = new Map();
  private actions: Map<string, CustomerServiceAction[]> = new Map();
  private timelines: Map<string, DisputeTimeline[]> = new Map();

  /**
   * 1. 用户点击"我已支付但未收到" - 创建争议
   */
  async createDispute(request: CreateDisputeRequest): Promise<DisputeResponse> {
    // 1. 获取订单
    const order = orderModel.getOrder(request.orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    // 2. 检查是否已有争议
    const existingDispute = orderModel.getDisputeByOrderId(request.orderId);
    if (existingDispute) {
      throw new Error('该订单已存在争议');
    }

    // 3. 创建争议记录
    const dispute = orderModel.createDispute({
      orderId: request.orderId,
      raisedBy: request.raisedBy,
      reason: request.reason,
      description: request.description
    });

    // 4. 延长冻结至30分钟（争议冻结）
    let freezeId: string | undefined;
    if (order.frozenAmount && order.transactionId) {
      try {
        const disputeFreeze = freezeService.createDisputeFreeze({
          userId: request.raisedBy,
          amount: order.frozenAmount,
          transactionId: order.transactionId,
          remark: `争议冻结 - 订单号: ${order.orderNo}`
        });
        freezeId = disputeFreeze.id;
      } catch (error) {
        console.error('创建争议冻结失败:', error);
      }
    }

    // 5. 上传初始证据（如果有）
    const evidence: Evidence[] = [];
    if (request.initialEvidence && request.initialEvidence.length > 0) {
      for (const ev of request.initialEvidence) {
        const uploadedEvidence = evidenceModel.createEvidence({
          disputeId: dispute.id,
          uploadedBy: request.raisedBy,
          type: ev.type,
          description: ev.description,
          fileUrl: ev.fileUrl
        });
        evidence.push(uploadedEvidence);
      }
    }

    // 6. 创建时间线
    const timeline = this.addTimelineEvent(
      dispute.id,
      '争议创建',
      `用户 ${request.raisedBy} 创建了争议: ${request.reason}`,
      request.raisedBy
    );

    // 7. 计算证据提交截止时间
    const evidenceDeadline = new Date(Date.now() + DISPUTE_CONFIG.EVIDENCE_UPLOAD_DEADLINE);

    return {
      disputeId: dispute.id,
      orderId: dispute.orderId,
      status: DisputeStatusExtended.EVIDENCE_COLLECTION,
      freezeId,
      evidenceDeadline,
      evidence,
      timeline,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt
    };
  }

  /**
   * 2. 用户上传证据（10分钟内）
   */
  async uploadEvidence(request: UploadEvidenceRequest): Promise<Evidence> {
    const dispute = orderModel.getDispute(request.disputeId);
    if (!dispute) {
      throw new Error('争议不存在');
    }

    // 检查争议状态
    if (dispute.status !== DisputeStatus.PENDING && 
        dispute.status !== DisputeStatusExtended.EVIDENCE_COLLECTION) {
      throw new Error('当前争议状态不允许上传证据');
    }

    // 检查是否超过截止时间
    const evidenceDeadline = new Date(
      dispute.createdAt.getTime() + DISPUTE_CONFIG.EVIDENCE_UPLOAD_DEADLINE
    );
    
    if (new Date() > evidenceDeadline) {
      throw new Error('证据上传已超过截止时间');
    }

    // 上传证据
    const evidence = evidenceModel.createEvidence({
      disputeId: request.disputeId,
      uploadedBy: request.uploadedBy,
      type: request.type,
      description: request.description,
      fileUrl: request.fileUrl
    });

    // 添加时间线事件
    this.addTimelineEvent(
      request.disputeId,
      '证据上传',
      `用户 ${request.uploadedBy} 上传了证据: ${request.description}`,
      request.uploadedBy
    );

    return evidence;
  }

  /**
   * 3. 客服介入处理
   */
  async customerServiceIntervene(disputeId: string, customerId: string): Promise<Dispute> {
    const dispute = orderModel.getDispute(disputeId);
    if (!dispute) {
      throw new Error('争议不存在');
    }

    // 更新争议状态为客服审核中
    const updatedDispute = orderModel.updateDisputeStatus(
      disputeId, 
      DisputeStatusExtended.CUSTOMER_SERVICE_REVIEW as any
    );

    // 记录客服操作
    this.addCustomerServiceAction(
      disputeId,
      customerId,
      'COMMENT',
      '客服已介入处理该争议'
    );

    // 添加时间线事件
    this.addTimelineEvent(
      disputeId,
      '客服介入',
      `客服 ${customerId} 已介入处理争议`,
      customerId
    );

    return updatedDispute;
  }

  /**
   * 4. 客服请求补充证据
   */
  async requestAdditionalEvidence(
    disputeId: string, 
    customerId: string,
    targetUserId: string,
    message: string
  ): Promise<void> {
    const dispute = orderModel.getDispute(disputeId);
    if (!dispute) {
      throw new Error('争议不存在');
    }

    // 记录客服操作
    this.addCustomerServiceAction(
      disputeId,
      customerId,
      'REQUEST_EVIDENCE',
      `请求用户 ${targetUserId} 补充证据: ${message}`
    );

    // 添加时间线事件
    this.addTimelineEvent(
      disputeId,
      '请求补充证据',
      message,
      customerId
    );

    // 这里应该发送通知给用户（实际项目中需要实现通知系统）
  }

  /**
   * 5. 平台判决
   */
  async makeJudgment(request: MakeJudgmentRequest): Promise<DisputeJudgment> {
    const dispute = orderModel.getDispute(request.disputeId);
    if (!dispute) {
      throw new Error('争议不存在');
    }

    // 检查是否已判决
    if (this.judgments.has(request.disputeId)) {
      throw new Error('该争议已判决');
    }

    // 获取所有已验证的证据
    const allEvidence = evidenceModel.getDisputeEvidences(request.disputeId);
    const verifiedEvidence = allEvidence.filter(e => e.status === 'VERIFIED' as any);

    // 创建判决记录
    const judgmentId = `judgment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const judgment: DisputeJudgment = {
      id: judgmentId,
      disputeId: request.disputeId,
      judgmentType: request.judgmentType,
      judgment: request.judgment,
      buyerCompensation: request.buyerCompensation,
      sellerCompensation: request.sellerCompensation,
      judgedBy: request.judgedBy,
      judgedAt: new Date(),
      evidence: verifiedEvidence
    };

    this.judgments.set(request.disputeId, judgment);

    // 更新争议状态为已解决
    orderModel.resolveDispute(
      request.disputeId,
      `平台判决: ${request.judgment}`,
      request.judgedBy
    );

    // 解冻相关冻结
    const order = orderModel.getOrder(dispute.orderId);
    if (order && order.transactionId) {
      const freeze = freezeService.getFreezeByTransactionId(order.transactionId);
      if (freeze) {
        await freezeService.unfreeze(freeze.id, '争议已解决，自动解冻');
      }
    }

    // 记录客服操作
    this.addCustomerServiceAction(
      request.disputeId,
      request.judgedBy,
      'MAKE_JUDGMENT',
      `判决结果: ${request.judgmentType} - ${request.judgment}`
    );

    // 添加时间线事件
    this.addTimelineEvent(
      request.disputeId,
      '平台判决',
      `判决结果: ${request.judgmentType}`,
      request.judgedBy
    );

    return judgment;
  }

  /**
   * 获取争议详情
   */
  getDisputeDetail(disputeId: string): DisputeResponse {
    const dispute = orderModel.getDispute(disputeId);
    if (!dispute) {
      throw new Error('争议不存在');
    }

    const order = orderModel.getOrder(dispute.orderId);
    const evidence = evidenceModel.getDisputeEvidences(disputeId);
    const timeline = this.timelines.get(disputeId) || [];
    const judgment = this.judgments.get(disputeId);

    let freezeId: string | undefined;
    if (order && order.transactionId) {
      const freeze = freezeService.getFreezeByTransactionId(order.transactionId);
      if (freeze) {
        freezeId = freeze.id;
      }
    }

    const evidenceDeadline = new Date(
      dispute.createdAt.getTime() + DISPUTE_CONFIG.EVIDENCE_UPLOAD_DEADLINE
    );

    return {
      disputeId: dispute.id,
      orderId: dispute.orderId,
      status: dispute.status as any,
      freezeId,
      evidenceDeadline,
      evidence,
      timeline,
      judgment,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt
    };
  }

  /**
   * 获取客服待处理的争议
   */
  getPendingDisputesForCustomerService(): DisputeResponse[] {
    const allDisputes = orderModel.getAllDisputes();
    const pending: DisputeResponse[] = [];

    for (const dispute of allDisputes) {
      if (dispute.status === DisputeStatus.PENDING || 
          dispute.status === DisputeStatusExtended.EVIDENCE_COLLECTION ||
          dispute.status === DisputeStatusExtended.CUSTOMER_SERVICE_REVIEW) {
        pending.push(this.getDisputeDetail(dispute.id));
      }
    }

    return pending.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * 添加时间线事件
   */
  private addTimelineEvent(
    disputeId: string,
    event: string,
    description: string,
    performedBy?: string
  ): DisputeTimeline[] {
    if (!this.timelines.has(disputeId)) {
      this.timelines.set(disputeId, []);
    }

    const timeline = this.timelines.get(disputeId)!;
    const timelineEvent: DisputeTimeline = {
      id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      disputeId,
      event,
      description,
      performedBy,
      createdAt: new Date()
    };

    timeline.push(timelineEvent);
    return timeline;
  }

  /**
   * 添加客服操作记录
   */
  private addCustomerServiceAction(
    disputeId: string,
    customerId: string,
    actionType: CustomerServiceAction['actionType'],
    content: string,
    metadata?: any
  ): void {
    if (!this.actions.has(disputeId)) {
      this.actions.set(disputeId, []);
    }

    const actions = this.actions.get(disputeId)!;
    actions.push({
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      disputeId,
      actionType,
      performedBy: customerId,
      content,
      metadata,
      createdAt: new Date()
    });
  }

  /**
   * 获取争议统计
   */
  getDisputeStats(): {
    total: number;
    pending: number;
    inReview: number;
    resolved: number;
    avgResolutionTime: number;
  } {
    const allDisputes = orderModel.getAllDisputes();
    let pending = 0;
    let inReview = 0;
    let resolved = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const dispute of allDisputes) {
      if (dispute.status === DisputeStatus.PENDING || 
          dispute.status === DisputeStatusExtended.EVIDENCE_COLLECTION) {
        pending++;
      } else if (dispute.status === DisputeStatusExtended.CUSTOMER_SERVICE_REVIEW) {
        inReview++;
      } else if (dispute.status === DisputeStatus.RESOLVED) {
        resolved++;
        
        if (dispute.resolvedAt) {
          totalResolutionTime += dispute.resolvedAt.getTime() - dispute.createdAt.getTime();
          resolvedCount++;
        }
      }
    }

    return {
      total: allDisputes.length,
      pending,
      inReview,
      resolved,
      avgResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0
    };
  }
}

// 导出单例
export const disputeService = new DisputeService();
