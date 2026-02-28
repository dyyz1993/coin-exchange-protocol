/**
 * 证据管理模型 - 处理争议证据的上传、验证和管理
 */

import { 
  Evidence, 
  EvidenceType, 
  EvidenceStatus,
  DISPUTE_CONFIG 
} from '../types/dispute';

export class EvidenceModel {
  private evidences: Map<string, Evidence> = new Map();
  private disputeEvidences: Map<string, Set<string>> = new Map(); // disputeId -> Set<evidenceId>

  /**
   * 创建证据记录
   */
  createEvidence(params: {
    disputeId: string;
    uploadedBy: string;
    type: EvidenceType;
    description: string;
    fileUrl: string;
  }): Evidence {
    // 检查证据数量限制
    const currentCount = this.getDisputeEvidenceCount(params.disputeId);
    if (currentCount >= DISPUTE_CONFIG.MAX_EVIDENCE_COUNT) {
      throw new Error(`每个争议最多上传 ${DISPUTE_CONFIG.MAX_EVIDENCE_COUNT} 个证据`);
    }

    // 验证文件类型
    const fileExtension = this.getFileExtension(params.fileUrl);
    if (!DISPUTE_CONFIG.ALLOWED_FILE_TYPES.includes(fileExtension)) {
      throw new Error(`不支持的文件类型: ${fileExtension}`);
    }

    const evidenceId = `evd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const evidence: Evidence = {
      id: evidenceId,
      disputeId: params.disputeId,
      uploadedBy: params.uploadedBy,
      type: params.type,
      description: params.description,
      fileUrl: params.fileUrl,
      status: EvidenceStatus.PENDING,
      createdAt: now,
      updatedAt: now
    };

    this.evidences.set(evidenceId, evidence);

    // 记录争议的证据
    if (!this.disputeEvidences.has(params.disputeId)) {
      this.disputeEvidences.set(params.disputeId, new Set());
    }
    this.disputeEvidences.get(params.disputeId)!.add(evidenceId);

    return evidence;
  }

  /**
   * 获取证据
   */
  getEvidence(evidenceId: string): Evidence | undefined {
    return this.evidences.get(evidenceId);
  }

  /**
   * 获取争议的所有证据
   */
  getDisputeEvidences(disputeId: string): Evidence[] {
    const evidenceIds = this.disputeEvidences.get(disputeId);
    if (!evidenceIds) return [];

    const evidences: Evidence[] = [];
    for (const evidenceId of evidenceIds) {
      const evidence = this.evidences.get(evidenceId);
      if (evidence) {
        evidences.push(evidence);
      }
    }

    return evidences.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取争议的证据数量
   */
  getDisputeEvidenceCount(disputeId: string): number {
    const evidenceIds = this.disputeEvidences.get(disputeId);
    return evidenceIds ? evidenceIds.size : 0;
  }

  /**
   * 验证证据
   */
  verifyEvidence(evidenceId: string, verifiedBy: string): Evidence {
    const evidence = this.evidences.get(evidenceId);
    if (!evidence) {
      throw new Error('证据不存在');
    }

    if (evidence.status !== EvidenceStatus.PENDING) {
      throw new Error('证据已被审核');
    }

    evidence.status = EvidenceStatus.VERIFIED;
    evidence.verifiedAt = new Date();
    evidence.verifiedBy = verifiedBy;
    evidence.updatedAt = new Date();

    return evidence;
  }

  /**
   * 拒绝证据
   */
  rejectEvidence(evidenceId: string, rejectedBy: string, reason: string): Evidence {
    const evidence = this.evidences.get(evidenceId);
    if (!evidence) {
      throw new Error('证据不存在');
    }

    if (evidence.status !== EvidenceStatus.PENDING) {
      throw new Error('证据已被审核');
    }

    evidence.status = EvidenceStatus.REJECTED;
    evidence.verifiedAt = new Date();
    evidence.verifiedBy = rejectedBy;
    evidence.rejectReason = reason;
    evidence.updatedAt = new Date();

    return evidence;
  }

  /**
   * 批量验证证据
   */
  batchVerifyEvidence(evidenceIds: string[], verifiedBy: string): Evidence[] {
    const verified: Evidence[] = [];
    
    for (const evidenceId of evidenceIds) {
      try {
        const evidence = this.verifyEvidence(evidenceId, verifiedBy);
        verified.push(evidence);
      } catch (error) {
        console.error(`验证证据失败 ${evidenceId}:`, error);
      }
    }

    return verified;
  }

  /**
   * 获取用户上传的证据
   */
  getUserEvidences(userId: string): Evidence[] {
    const evidences: Evidence[] = [];
    
    for (const evidence of this.evidences.values()) {
      if (evidence.uploadedBy === userId) {
        evidences.push(evidence);
      }
    }

    return evidences.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取待审核的证据
   */
  getPendingEvidences(): Evidence[] {
    const pending: Evidence[] = [];
    
    for (const evidence of this.evidences.values()) {
      if (evidence.status === EvidenceStatus.PENDING) {
        pending.push(evidence);
      }
    }

    return pending.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * 获取证据统计
   */
  getEvidenceStats(): {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  } {
    let pending = 0;
    let verified = 0;
    let rejected = 0;

    for (const evidence of this.evidences.values()) {
      if (evidence.status === EvidenceStatus.PENDING) pending++;
      else if (evidence.status === EvidenceStatus.VERIFIED) verified++;
      else if (evidence.status === EvidenceStatus.REJECTED) rejected++;
    }

    return {
      total: this.evidences.size,
      pending,
      verified,
      rejected
    };
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
}

// 导出单例
export const evidenceModel = new EvidenceModel();
