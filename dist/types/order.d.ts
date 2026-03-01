/**
 * 订单系统类型定义
 */
export declare enum OrderStatus {
    DRAFT = "draft",// 草稿
    PENDING_PAYMENT = "pending_payment",// 待支付（已冻结）
    PAID = "paid",// 已支付（外部系统确认）
    CONFIRMED = "confirmed",// 已确认
    COMPLETED = "completed",// 已完成
    DISPUTED = "disputed",// 争议中
    CANCELLED = "cancelled"
}
export declare enum DisputeStatus {
    PENDING = "pending",// 待处理
    INVESTIGATING = "investigating",// 调查中
    RESOLVED = "resolved",// 已解决
    REJECTED = "rejected"
}
export interface Order {
    id: string;
    orderNo: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    price: number;
    currency: string;
    status: OrderStatus;
    description: string;
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
    frozenAmount?: number;
    transactionId?: string;
    externalPaymentId?: string;
    disputeId?: string;
    createdAt: Date;
    updatedAt: Date;
    paidAt?: Date;
    confirmedAt?: Date;
    completedAt?: Date;
}
export interface Dispute {
    id: string;
    orderId: string;
    raisedBy: string;
    reason: string;
    description: string;
    status: DisputeStatus;
    evidence?: string[];
    resolution?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
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
    sellerId: string;
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
export interface ExtendDisputeFreezeParams {
    orderId: string;
    durationMinutes: number;
}
export interface JudgeDisputeParams {
    disputeId: string;
    judgeId: string;
    decision: 'buyer' | 'seller' | 'refund';
    reason: string;
    notes?: string;
}
