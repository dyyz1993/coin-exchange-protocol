/**
 * 订单模型 - 管理订单和争议记录
 */

import { Order, Dispute, OrderStatus, DisputeStatus } from '../types';
import { randomUUID } from 'crypto';

export class OrderModel {
  private orders: Map<string, Order> = new Map();
  private disputes: Map<string, Dispute> = new Map();

  /**
   * 生成订单号（使用 UUID v4 的一部分）
   * 格式: ORD-{timestamp}-{uuid8}
   * 更可靠且唯一
   */
  private generateOrderNo(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const uuid = randomUUID().split('-')[0].toUpperCase();
    return `ORD-${timestamp}-${uuid}`;
  }

  /**
   * 验证状态转换是否合法
   * 定义订单状态机
   */
  private isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.CONFIRMED, OrderStatus.DISPUTED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.COMPLETED, OrderStatus.DISPUTED],
      [OrderStatus.COMPLETED]: [], // 已完成不能再转换
      [OrderStatus.DISPUTED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.CANCELLED]: [], // 已取消不能再转换
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

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
  }): Order {
    const orderId = `order_${Date.now()}_${randomUUID()}`;

    const order: Order = {
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
      version: 1, // 初始版本号
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(orderId, order);

    return order;
  }

  /**
   * 获取订单
   */
  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  /**
   * 根据订单号获取订单
   */
  getOrderByOrderNo(orderNo: string): Order | undefined {
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
  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  /**
   * 获取买家订单
   */
  getBuyerOrders(buyerId: string): Order[] {
    const orders: Order[] = [];
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
  getSellerOrders(sellerId: string): Order[] {
    const orders: Order[] = [];
    for (const order of this.orders.values()) {
      if (order.sellerId === sellerId) {
        orders.push(order);
      }
    }
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 更新订单状态（带乐观锁）
   * @param orderId 订单ID
   * @param status 新状态
   * @param expectedVersion 预期版本号（乐观锁）
   * @returns 更新后的订单
   * @throws 如果订单不存在、版本号不匹配或状态转换非法
   */
  updateOrderStatus(orderId: string, status: OrderStatus, expectedVersion?: number): Order {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // 乐观锁验证
    if (expectedVersion !== undefined && order.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected. Expected version ${expectedVersion}, but current is ${order.version}`
      );
    }

    // 状态转换验证
    if (!this.isValidTransition(order.status, status)) {
      throw new Error(`Invalid status transition from ${order.status} to ${status}`);
    }

    // 更新状态和版本号
    order.status = status;
    order.version++;
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
   * 设置冻结金额（带乐观锁）
   */
  setFrozenAmount(orderId: string, frozenAmount: number, expectedVersion?: number): Order {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // 乐观锁验证
    if (expectedVersion !== undefined && order.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected. Expected version ${expectedVersion}, but current is ${order.version}`
      );
    }

    order.frozenAmount = frozenAmount;
    order.version++;
    order.updatedAt = new Date();

    return order;
  }

  /**
   * 设置代币交易ID（带乐观锁）
   */
  setTransactionId(orderId: string, transactionId: string, expectedVersion?: number): Order {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // 乐观锁验证
    if (expectedVersion !== undefined && order.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected. Expected version ${expectedVersion}, but current is ${order.version}`
      );
    }

    order.transactionId = transactionId;
    order.version++;
    order.updatedAt = new Date();

    return order;
  }

  /**
   * 设置外部支付ID（带乐观锁）
   */
  setExternalPaymentId(
    orderId: string,
    externalPaymentId: string,
    expectedVersion?: number
  ): Order {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // 乐观锁验证
    if (expectedVersion !== undefined && order.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected. Expected version ${expectedVersion}, but current is ${order.version}`
      );
    }

    order.externalPaymentId = externalPaymentId;
    order.version++;
    order.updatedAt = new Date();

    return order;
  }

  /**
   * 设置争议ID（带乐观锁）
   */
  setDisputeId(orderId: string, disputeId: string, expectedVersion?: number): Order {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // 乐观锁验证
    if (expectedVersion !== undefined && order.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected. Expected version ${expectedVersion}, but current is ${order.version}`
      );
    }

    // 状态转换验证
    if (!this.isValidTransition(order.status, OrderStatus.DISPUTED)) {
      throw new Error(`Invalid status transition from ${order.status} to disputed`);
    }

    order.disputeId = disputeId;
    order.status = OrderStatus.DISPUTED;
    order.version++;
    order.updatedAt = new Date();

    return order;
  }

  /**
   * 创建争议
   */
  createDispute(params: {
    orderId: string;
    raisedBy: string;
    reason: string;
    description: string;
    evidence?: string[];
  }): Dispute {
    const disputeId = `dispute_${Date.now()}_${randomUUID()}`;

    const order = this.getOrder(params.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const dispute: Dispute = {
      id: disputeId,
      orderId: params.orderId,
      raisedBy: params.raisedBy,
      reason: params.reason,
      description: params.description,
      evidence: params.evidence,
      status: DisputeStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.disputes.set(disputeId, dispute);

    // 更新订单状态（带乐观锁）
    this.setDisputeId(params.orderId, disputeId, order.version);

    return dispute;
  }

  /**
   * 获取争议
   */
  getDispute(disputeId: string): Dispute | undefined {
    return this.disputes.get(disputeId);
  }

  /**
   * 根据订单ID获取争议
   */
  getDisputeByOrderId(orderId: string): Dispute | undefined {
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
  updateDisputeStatus(disputeId: string, status: DisputeStatus): Dispute {
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
  resolveDispute(disputeId: string, resolution: string, resolvedBy: string): Dispute {
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
  getAllDisputes(): Dispute[] {
    return Array.from(this.disputes.values());
  }

  /**
   * 获取用户的争议
   */
  getUserDisputes(userId: string): Dispute[] {
    const disputes: Dispute[] = [];
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
