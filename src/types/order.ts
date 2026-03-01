/**
 * 订单系统类型定义
 */

export enum OrderStatus {
  DRAFT = 'draft', // 草稿
  PENDING_PAYMENT = 'pending_payment', // 待支付（已冻结）
  PAID = 'paid', // 已支付（外部系统确认）
  CONFIRMED = 'confirmed', // 已确认
  COMPLETED = 'completed', // 已完成
  DISPUTED = 'disputed', // 争议中
  CANCELLED = 'cancelled', // 已取消
}

export enum DisputeStatus {
  PENDING = 'pending', // 待处理
  INVESTIGATING = 'investigating', // 调查中
  RESOLVED = 'resolved', // 已解决
  REJECTED = 'rejected', // 已拒绝
}

export interface Order {
  id: string;
  orderNo: string; // 订单号（用户可见）
  buyerId: string; // 买家ID
  sellerId: string; // 卖家ID
  amount: number; // 代币金额
  price: number; // 外部支付金额（如法币金额）
  currency: string; // 外部支付货币类型（如 USD, CNY）
  status: OrderStatus;
  description: string; // 订单描述
  buyerInfo?: {
    name: string;
    contact: string;
    address?: string;
  };
  sellerInfo?: {
    name: string;
    contact: string;
    address?: string;
  };
  frozenAmount?: number; // 冻结的代币金额
  transactionId?: string; // 代币交易ID
  externalPaymentId?: string; // 外部支付系统交易ID
  disputeId?: string; // 争议ID（如果有）
  version: number; // 乐观锁版本号，用于并发控制
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date; // 支付时间
  confirmedAt?: Date; // 确认时间
  completedAt?: Date; // 完成时间
}

export interface Dispute {
  id: string;
  orderId: string;
  raisedBy: string; // 发起人ID（买家或卖家）
  reason: string; // 争议原因
  description: string; // 争议详情
  status: DisputeStatus;
  evidence?: string[]; // 证据文件
  resolution?: string; // 解决方案
  resolvedBy?: string; // 处理人ID
  resolvedAt?: Date; // 解决时间
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderParams {
  buyerId: string;
  sellerId: string;
  amount: number;
  price: number;
  currency?: string;
  description: string;
  buyerInfo: {
    name: string;
    contact: string;
    address?: string;
  };
}

export interface PayOrderParams {
  orderId: string;
  externalPaymentId: string;
}

export interface ConfirmOrderParams {
  orderId: string;
  sellerId: string; // 验证是卖家确认
}

export interface DisputeOrderParams {
  orderId: string;
  userId: string;
  reason: string;
  description: string;
  evidence?: string[];
}

export interface OrderResponse {
  order: Order;
  canPay: boolean;
  canConfirm: boolean;
  canDispute: boolean;
}

export interface DisputeResponse {
  dispute: Dispute;
  order: Order;
}

// 证据文件类型
export interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  disputeId: string;
  uploadedAt: Date;
}

// 证据上传参数
export interface UploadEvidenceParams {
  disputeId: string;
  userId: string;
  files: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
  }>;
}

// 争议延长冻结参数
export interface ExtendDisputeFreezeParams {
  orderId: string;
  durationMinutes: number;
}

// 客服判决参数
export interface JudgeDisputeParams {
  disputeId: string;
  judgeId: string;
  decision: 'buyer' | 'seller' | 'refund';
  reason: string;
  notes?: string;
}
