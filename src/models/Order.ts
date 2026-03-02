/**
 * 订单模型 - 管理订单和争议记录
 *
 * 修复并发安全问题 (Issue #312)：
 * 1. 添加 Mutex 锁确保同一订单操作串行化
 * 2. 强制版本号检查（expectedVersion 改为必填）
 * 3. 为 Dispute 操作添加并发控制
 * 4. 转换为异步 API
 */

import { Order, Dispute, OrderStatus, DisputeStatus } from '../types';
import { randomUUID } from 'crypto';
import { Mutex } from 'async-mutex';

export class OrderModel {
  private orders: Map<string, Order> = new Map();
  private disputes: Map<string, Dispute> = new Map();

  // 并发控制：使用 async-mutex 替代 busy wait
  private orderMutexes: Map<string, Mutex> = new Map(); // orderId -> Mutex
  private disputeMutexes: Map<string, Mutex> = new Map(); // disputeId -> Mutex

  /**
   * 获取或创建订单的 Mutex
   */
  private getOrderMutex(orderId: string): Mutex {
    if (!this.orderMutexes.has(orderId)) {
      this.orderMutexes.set(orderId, new Mutex());
    }
    return this.orderMutexes.get(orderId)!;
  }

  /**
   * 获取或创建争议的 Mutex
   */
  private getDisputeMutex(disputeId: string): Mutex {
    if (!this.disputeMutexes.has(disputeId)) {
      this.disputeMutexes.set(disputeId, new Mutex());
    }
    return this.disputeMutexes.get(disputeId)!;
  }

  /**
   * 使用锁执行订单操作
   */
  private async withOrderLock<T>(orderId: string, operation: () => T | Promise<T>): Promise<T> {
    const mutex = this.getOrderMutex(orderId);
    const release = await mutex.acquire();
    try {
      return await operation();
    } finally {
      release();
    }
  }

  /**
   * 使用锁执行争议操作
   */
  private async withDisputeLock<T>(disputeId: string, operation: () => T | Promise<T>): Promise<T> {
    const mutex = this.getDisputeMutex(disputeId);
    const release = await mutex.acquire();
    try {
      return await operation();
    } finally {
      release();
    }
  }

  /**
   * 验证订单版本号并更新（CAS 操作）
   */
  private validateAndUpdateOrder(
    order: Order,
    expectedVersion: number,
    updateFn: () => void
  ): void {
    if (order.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected for order ${order.id}. ` +
          `Expected version ${expectedVersion}, but got ${order.version}`
      );
    }
    updateFn();
    order.version++;
    order.updatedAt = new Date();
  }

  /**
   * 验证争议版本号并更新（CAS 操作）
   */
  private validateAndUpdateDispute(
    dispute: Dispute,
    expectedVersion: number,
    updateFn: () => void
  ): void {
    if (dispute.version !== expectedVersion) {
      throw new Error(
        `Concurrent modification detected for dispute ${dispute.id}. ` +
          `Expected version ${expectedVersion}, but got ${dispute.version}`
      );
    }
    updateFn();
    dispute.version++;
    dispute.updatedAt = new Date();
  }

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
  async createOrder(params: {
    buyerId: string;
    sellerId: string;
    amount: number;
    price: number;
    currency: string;
    description: string;
    buyerInfo: Order['buyerInfo'];
  }): Promise<Order> {
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
      version: 0, // 初始版本号
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
   * 更新订单状态（带乐观锁，强制版本号检查）
   * @param orderId 订单ID
   * @param status 新状态
   * @param expectedVersion 预期版本号（必填，乐观锁）
   * @returns 更新后的订单
   * @throws 如果订单不存在、版本号不匹配或状态转换非法
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    expectedVersion: number
  ): Promise<Order> {
    return this.withOrderLock(orderId, () => {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // 乐观锁验证（强制检查）
      this.validateAndUpdateOrder(order, expectedVersion, () => {
        // 状态转换验证
        if (!this.isValidTransition(order.status, status)) {
          throw new Error(`Invalid status transition from ${order.status} to ${status}`);
        }

        order.status = status;

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
      });

      return order;
    });
  }

  /**
   * 设置冻结金额（带乐观锁，强制版本号检查）
   */
  async setFrozenAmount(
    orderId: string,
    frozenAmount: number,
    expectedVersion: number
  ): Promise<Order> {
    return this.withOrderLock(orderId, () => {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      this.validateAndUpdateOrder(order, expectedVersion, () => {
        order.frozenAmount = frozenAmount;
      });

      return order;
    });
  }

  /**
   * 设置代币交易ID（带乐观锁，强制版本号检查）
   */
  async setTransactionId(
    orderId: string,
    transactionId: string,
    expectedVersion: number
  ): Promise<Order> {
    return this.withOrderLock(orderId, () => {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      this.validateAndUpdateOrder(order, expectedVersion, () => {
        order.transactionId = transactionId;
      });

      return order;
    });
  }

  /**
   * 设置外部支付ID（带乐观锁，强制版本号检查）
   */
  async setExternalPaymentId(
    orderId: string,
    externalPaymentId: string,
    expectedVersion: number
  ): Promise<Order> {
    return this.withOrderLock(orderId, () => {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      this.validateAndUpdateOrder(order, expectedVersion, () => {
        order.externalPaymentId = externalPaymentId;
      });

      return order;
    });
  }

  /**
   * 设置争议ID（带乐观锁，强制版本号检查）
   */
  async setDisputeId(orderId: string, disputeId: string, expectedVersion: number): Promise<Order> {
    return this.withOrderLock(orderId, () => {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      this.validateAndUpdateOrder(order, expectedVersion, () => {
        // 状态转换验证
        if (!this.isValidTransition(order.status, OrderStatus.DISPUTED)) {
          throw new Error(`Invalid status transition from ${order.status} to disputed`);
        }

        order.disputeId = disputeId;
        order.status = OrderStatus.DISPUTED;
      });

      return order;
    });
  }

  /**
   * 创建争议
   */
  async createDispute(params: {
    orderId: string;
    raisedBy: string;
    reason: string;
    description: string;
    evidence?: string[];
  }): Promise<Dispute> {
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
      version: 0, // 初始版本号
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.disputes.set(disputeId, dispute);

    // 更新订单状态（带乐观锁）
    await this.setDisputeId(params.orderId, disputeId, order.version);

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
   * 更新争议状态（带乐观锁，强制版本号检查）
   */
  async updateDisputeStatus(
    disputeId: string,
    status: DisputeStatus,
    expectedVersion: number
  ): Promise<Dispute> {
    return this.withDisputeLock(disputeId, () => {
      const dispute = this.disputes.get(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      this.validateAndUpdateDispute(dispute, expectedVersion, () => {
        dispute.status = status;
      });

      return dispute;
    });
  }

  /**
   * 解决争议（带乐观锁，强制版本号检查）
   */
  async resolveDispute(
    disputeId: string,
    resolution: string,
    resolvedBy: string,
    expectedVersion: number
  ): Promise<Dispute> {
    return this.withDisputeLock(disputeId, () => {
      const dispute = this.disputes.get(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      this.validateAndUpdateDispute(dispute, expectedVersion, () => {
        dispute.status = DisputeStatus.RESOLVED;
        dispute.resolution = resolution;
        dispute.resolvedBy = resolvedBy;
        dispute.resolvedAt = new Date();
      });

      return dispute;
    });
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
