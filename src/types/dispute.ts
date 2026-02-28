/**
 * 争议处理系统类型定义
 */

/**
 * 证据类型
 */
export enum EvidenceType {
  PAYMENT_PROOF = 'PAYMENT_PROOF',           // 支付凭证
  CHAT_HISTORY = 'CHAT_HISTORY',             // 聊天记录
  SCREENSHOT = 'SCREENSHOT',                 // 截图
  RECEIPT = 'RECEIPT',                       // 收据
  OTHER = 'OTHER'                            // 其他
}

/**
 * 证据状态
 */
export enum EvidenceStatus {
  PENDING = 'PENDING',                       // 待审核
  VERIFIED = 'VERIFIED',                     // 已验证
  REJECTED = 'REJECTED'                      // 已拒绝
}

/**
 * 证据记录
 */
export interface Evidence {
  id: string;
  disputeId: string;
  uploadedBy: string;                        // 上传者ID
  type: EvidenceType;
  description: string;
  fileUrl: string;
  status: EvidenceStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 争议状态（扩展现有状态）
 */
export enum DisputeStatusExtended {
  PENDING = 'PENDING',                       // 待处理
  EVIDENCE_COLLECTION = 'EVIDENCE_COLLECTION', // 证据收集中
  CUSTOMER_SERVICE_REVIEW = 'CUSTOMER_SERVICE_REVIEW', // 客服审核中
  WAITING_JUDGMENT = 'WAITING_JUDGMENT',     // 等待判决
  RESOLVED = 'RESOLVED',                     // 已解决
  CANCELLED = 'CANCELLED'                    // 已取消
}

/**
 * 争议判决类型
 */
export enum JudgmentType {
  BUYER_WINS = 'BUYER_WINS',                 // 买家胜诉
  SELLER_WINS = 'SELLER_WINS',               // 卖家胜诉
  SPLIT = 'SPLIT',                           // 平分
  COMPROMISE = 'COMPROMISE'                  // 协商解决
}

/**
 * 争议判决记录
 */
export interface DisputeJudgment {
  id: string;
  disputeId: string;
  judgmentType: JudgmentType;
  judgment: string;                          // 判决说明
  buyerCompensation: number;                 // 买家获得补偿
  sellerCompensation: number;                // 卖家获得补偿
  judgedBy: string;                          // 判决人（客服ID）
  judgedAt: Date;
  evidence: Evidence[];                      // 使用的证据
}

/**
 * 客服处理记录
 */
export interface CustomerServiceAction {
  id: string;
  disputeId: string;
  actionType: 'COMMENT' | 'REQUEST_EVIDENCE' | 'EXTEND_TIME' | 'MAKE_JUDGMENT';
  performedBy: string;
  content: string;
  metadata?: any;
  createdAt: Date;
}

/**
 * 争议时间线
 */
export interface DisputeTimeline {
  id: string;
  disputeId: string;
  event: string;
  description: string;
  performedBy?: string;
  createdAt: Date;
}

/**
 * 争议配置
 */
export const DISPUTE_CONFIG = {
  EVIDENCE_UPLOAD_DEADLINE: 10 * 60 * 1000,  // 10分钟（毫秒）
  CUSTOMER_SERVICE_RESPONSE_TIME: 30 * 60 * 1000, // 30分钟
  AUTO_CLOSE_TIME: 24 * 60 * 60 * 1000,      // 24小时
  MAX_EVIDENCE_COUNT: 10,                    // 最多证据数量
  MAX_FILE_SIZE: 10 * 1024 * 1024,           // 10MB
  ALLOWED_FILE_TYPES: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
};

/**
 * 创建争议请求
 */
export interface CreateDisputeRequest {
  orderId: string;
  raisedBy: string;
  reason: string;
  description: string;
  initialEvidence?: {
    type: EvidenceType;
    description: string;
    fileUrl: string;
  }[];
}

/**
 * 上传证据请求
 */
export interface UploadEvidenceRequest {
  disputeId: string;
  uploadedBy: string;
  type: EvidenceType;
  description: string;
  fileUrl: string;
}

/**
 * 客服判决请求
 */
export interface MakeJudgmentRequest {
  disputeId: string;
  judgmentType: JudgmentType;
  judgment: string;
  buyerCompensation: number;
  sellerCompensation: number;
  judgedBy: string;
}

/**
 * 争议响应
 */
export interface DisputeResponse {
  disputeId: string;
  orderId: string;
  status: DisputeStatusExtended;
  freezeId?: string;
  evidenceDeadline?: Date;
  evidence: Evidence[];
  timeline: DisputeTimeline[];
  judgment?: DisputeJudgment;
  createdAt: Date;
  updatedAt: Date;
}
