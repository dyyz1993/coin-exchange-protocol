/**
 * 订单模型 - 管理订单和争议记录
 */
import { OrderStatus, DisputeStatus } from '../types';
export class OrderModel {
    orders = new Map();
    disputes = new Map();
    orderCounter = 1;
    /**
     * 生成订单号
     */
    generateOrderNo() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD${timestamp}${random}`;
    }
    /**
     * 创建订单
     */
    createOrder(params) {
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const order = {
            id: orderId,
            orderNo: this.generateOrderNo(),
            buyerId: params.buyerId,
            sellerId: params.sellerId,
            amount: params.amount,
            price: params.price,
            currency: params.currency || 'USD',
            status: OrderStatus.DRAFT,
            description: params.description,
            buyerInfo: params.buyerInfo,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.orders.set(orderId, order);
        return order;
    }
    /**
     * 获取订单
     */
    getOrder(orderId) {
        return this.orders.get(orderId);
    }
    /**
     * 根据订单号获取订单
     */
    getOrderByOrderNo(orderNo) {
        for (const order of this.orders.values()) {
            if (order.orderNo === orderNo) {
                return order;
            }
        }
        return undefined;
    }
    /**
     * 获取所有订单
     */
    getAllOrders() {
        return Array.from(this.orders.values());
    }
    /**
     * 获取买家订单
     */
    getBuyerOrders(buyerId) {
        const orders = [];
        for (const order of this.orders.values()) {
            if (order.buyerId === buyerId) {
                orders.push(order);
            }
        }
        return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    /**
     * 获取卖家订单
     */
    getSellerOrders(sellerId) {
        const orders = [];
        for (const order of this.orders.values()) {
            if (order.sellerId === sellerId) {
                orders.push(order);
            }
        }
        return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    /**
     * 更新订单状态
     */
    updateOrderStatus(orderId, status) {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        order.status = status;
        order.updatedAt = new Date();
        // 根据状态设置时间戳
        const now = new Date();
        if (status === OrderStatus.PAID && !order.paidAt) {
            order.paidAt = now;
        }
        if (status === OrderStatus.CONFIRMED && !order.confirmedAt) {
            order.confirmedAt = now;
        }
        if (status === OrderStatus.COMPLETED && !order.completedAt) {
            order.completedAt = now;
        }
        return order;
    }
    /**
     * 设置冻结金额
     */
    setFrozenAmount(orderId, frozenAmount) {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        order.frozenAmount = frozenAmount;
        order.updatedAt = new Date();
        return order;
    }
    /**
     * 设置代币交易ID
     */
    setTransactionId(orderId, transactionId) {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        order.transactionId = transactionId;
        order.updatedAt = new Date();
        return order;
    }
    /**
     * 设置外部支付ID
     */
    setExternalPaymentId(orderId, externalPaymentId) {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        order.externalPaymentId = externalPaymentId;
        order.updatedAt = new Date();
        return order;
    }
    /**
     * 设置争议ID
     */
    setDisputeId(orderId, disputeId) {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        order.disputeId = disputeId;
        order.status = OrderStatus.DISPUTED;
        order.updatedAt = new Date();
        return order;
    }
    /**
     * 创建争议
     */
    createDispute(params) {
        const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const order = this.getOrder(params.orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        const dispute = {
            id: disputeId,
            orderId: params.orderId,
            raisedBy: params.raisedBy,
            reason: params.reason,
            description: params.description,
            evidence: params.evidence,
            status: DisputeStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.disputes.set(disputeId, dispute);
        // 更新订单状态
        this.setDisputeId(params.orderId, disputeId);
        return dispute;
    }
    /**
     * 获取争议
     */
    getDispute(disputeId) {
        return this.disputes.get(disputeId);
    }
    /**
     * 根据订单ID获取争议
     */
    getDisputeByOrderId(orderId) {
        for (const dispute of this.disputes.values()) {
            if (dispute.orderId === orderId) {
                return dispute;
            }
        }
        return undefined;
    }
    /**
     * 更新争议状态
     */
    updateDisputeStatus(disputeId, status) {
        const dispute = this.disputes.get(disputeId);
        if (!dispute) {
            throw new Error('Dispute not found');
        }
        dispute.status = status;
        dispute.updatedAt = new Date();
        return dispute;
    }
    /**
     * 解决争议
     */
    resolveDispute(disputeId, resolution, resolvedBy) {
        const dispute = this.disputes.get(disputeId);
        if (!dispute) {
            throw new Error('Dispute not found');
        }
        dispute.status = DisputeStatus.RESOLVED;
        dispute.resolution = resolution;
        dispute.resolvedBy = resolvedBy;
        dispute.resolvedAt = new Date();
        dispute.updatedAt = new Date();
        return dispute;
    }
    /**
     * 获取所有争议
     */
    getAllDisputes() {
        return Array.from(this.disputes.values());
    }
    /**
     * 获取用户的争议
     */
    getUserDisputes(userId) {
        const disputes = [];
        for (const dispute of this.disputes.values()) {
            const order = this.getOrder(dispute.orderId);
            if (order && (order.buyerId === userId || order.sellerId === userId)) {
                disputes.push(dispute);
            }
        }
        return disputes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
}
// 导出单例
export const orderModel = new OrderModel();
