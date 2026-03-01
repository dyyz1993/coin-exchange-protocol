/**
 * 订单模型 - 管理订单和争议记录
 */
import { Order, Dispute, OrderStatus, DisputeStatus } from '../types';
export declare class OrderModel {
    private orders;
    private disputes;
    private orderCounter;
    /**
     * 生成订单号
     */
    private generateOrderNo;
    /**
     * 创建订单
     */
    createOrder(params: {
        buyerId: string;
        sellerId: string;
        amount: number;
        price: number;
        currency: string;
        description: string;
        buyerInfo: Order['buyerInfo'];
    }): Order;
    /**
     * 获取订单
     */
    getOrder(orderId: string): Order | undefined;
    /**
     * 根据订单号获取订单
     */
    getOrderByOrderNo(orderNo: string): Order | undefined;
    /**
     * 获取所有订单
     */
    getAllOrders(): Order[];
    /**
     * 获取买家订单
     */
    getBuyerOrders(buyerId: string): Order[];
    /**
     * 获取卖家订单
     */
    getSellerOrders(sellerId: string): Order[];
    /**
     * 更新订单状态
     */
    updateOrderStatus(orderId: string, status: OrderStatus): Order;
    /**
     * 设置冻结金额
     */
    setFrozenAmount(orderId: string, frozenAmount: number): Order;
    /**
     * 设置代币交易ID
     */
    setTransactionId(orderId: string, transactionId: string): Order;
    /**
     * 设置外部支付ID
     */
    setExternalPaymentId(orderId: string, externalPaymentId: string): Order;
    /**
     * 设置争议ID
     */
    setDisputeId(orderId: string, disputeId: string): Order;
    /**
     * 创建争议
     */
    createDispute(params: {
        orderId: string;
        raisedBy: string;
        reason: string;
        description: string;
        evidence?: string[];
    }): Dispute;
    /**
     * 获取争议
     */
    getDispute(disputeId: string): Dispute | undefined;
    /**
     * 根据订单ID获取争议
     */
    getDisputeByOrderId(orderId: string): Dispute | undefined;
    /**
     * 更新争议状态
     */
    updateDisputeStatus(disputeId: string, status: DisputeStatus): Dispute;
    /**
     * 解决争议
     */
    resolveDispute(disputeId: string, resolution: string, resolvedBy: string): Dispute;
    /**
     * 获取所有争议
     */
    getAllDisputes(): Dispute[];
    /**
     * 获取用户的争议
     */
    getUserDisputes(userId: string): Dispute[];
}
export declare const orderModel: OrderModel;
