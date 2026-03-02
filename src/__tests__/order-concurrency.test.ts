/**
 * OrderModel 并发测试
 * 验证 createDispute 方法的并发安全性
 */

import { OrderModel } from '../models/Order';
import { OrderStatus } from '../types';

describe('OrderModel Concurrency Tests', () => {
  let orderModel: OrderModel;

  beforeEach(() => {
    orderModel = new OrderModel();
  });

  describe('createDispute 并发测试', () => {
    it('应该防止并发创建多个 Dispute', async () => {
      // 创建一个订单
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'Buyer 1',
          contact: 'buyer1@test.com',
        },
      });

      // 更新订单状态为 CONFIRMED（允许创建 Dispute）
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, order.version);
      const paidOrder = orderModel.updateOrderStatus(order.id, OrderStatus.PAID, 2);
      orderModel.updateOrderStatus(paidOrder.id, OrderStatus.CONFIRMED, 3);

      // 并发创建 10 个 Dispute
      const promises = Array.from({ length: 10 }, (_, i) =>
        orderModel
          .createDispute({
            orderId: order.id,
            raisedBy: i % 2 === 0 ? 'buyer1' : 'seller1',
            reason: `Dispute reason ${i}`,
            description: `Dispute description ${i}`,
          })
          .catch((err) => ({ error: err.message }))
      );

      const results = await Promise.all(promises);

      // 只有一个应该成功
      const successes = results.filter((r) => !(r instanceof Object && 'error' in r));
      const failures = results.filter((r) => r instanceof Object && 'error' in r);

      console.log('Successes:', successes.length);
      console.log('Failures:', failures.length);
      console.log(
        'Failure messages:',
        failures.map((f) => (f as any).error)
      );

      // 应该只有 1 个成功
      expect(successes.length).toBe(1);
      expect(failures.length).toBe(9);

      // 验证失败的原因
      failures.forEach((f) => {
        expect((f as any).error).toContain('Order already has a dispute');
      });

      // 验证订单只有一个 disputeId
      const finalOrder = orderModel.getOrder(order.id);
      expect(finalOrder?.disputeId).toBeDefined();
      expect(finalOrder?.status).toBe(OrderStatus.DISPUTED);
    });

    it('应该保证数据一致性：Dispute 和 Order 同时创建/更新', async () => {
      // 创建一个订单
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'Buyer 1',
          contact: 'buyer1@test.com',
        },
      });

      // 更新订单状态为 CONFIRMED
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, order.version);
      const paidOrder = orderModel.updateOrderStatus(order.id, OrderStatus.PAID, 2);
      orderModel.updateOrderStatus(paidOrder.id, OrderStatus.CONFIRMED, 3);

      // 创建 Dispute
      const dispute = await orderModel.createDispute({
        orderId: order.id,
        raisedBy: 'buyer1',
        reason: 'Test dispute',
        description: 'Test dispute description',
      });

      // 验证数据一致性
      const finalOrder = orderModel.getOrder(order.id);
      expect(finalOrder?.disputeId).toBe(dispute.id);
      expect(finalOrder?.status).toBe(OrderStatus.DISPUTED);
      expect(finalOrder?.version).toBe(5); // version 应该增加（1->2->3->4->5）

      // 验证 Dispute 存在
      const savedDispute = orderModel.getDispute(dispute.id);
      expect(savedDispute).toBeDefined();
      expect(savedDispute?.orderId).toBe(order.id);
    });

    it('应该防止重复创建 Dispute（幂等性）', async () => {
      // 创建一个订单
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'Buyer 1',
          contact: 'buyer1@test.com',
        },
      });

      // 更新订单状态为 CONFIRMED
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, order.version);
      const paidOrder = orderModel.updateOrderStatus(order.id, OrderStatus.PAID, 2);
      orderModel.updateOrderStatus(paidOrder.id, OrderStatus.CONFIRMED, 3);

      // 第一次创建应该成功
      await orderModel.createDispute({
        orderId: order.id,
        raisedBy: 'buyer1',
        reason: 'First dispute',
        description: 'First dispute description',
      });

      // 第二次创建应该失败
      await expect(
        orderModel.createDispute({
          orderId: order.id,
          raisedBy: 'buyer1',
          reason: 'Second dispute',
          description: 'Second dispute description',
        })
      ).rejects.toThrow('Order already has a dispute');
    });

    it('应该拒绝在非法状态下创建 Dispute', async () => {
      // 创建一个订单（状态为 DRAFT）
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'Buyer 1',
          contact: 'buyer1@test.com',
        },
      });

      // 在 DRAFT 状态下尝试创建 Dispute 应该失败
      await expect(
        orderModel.createDispute({
          orderId: order.id,
          raisedBy: 'buyer1',
          reason: 'Test dispute',
          description: 'Test dispute description',
        })
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('订单级别锁测试', () => {
    it('不同订单的操作应该可以并发执行', async () => {
      // 创建两个订单
      const order1 = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order 1',
        buyerInfo: {
          name: 'Buyer 1',
          contact: 'buyer1@test.com',
        },
      });

      const order2 = orderModel.createOrder({
        buyerId: 'buyer2',
        sellerId: 'seller2',
        amount: 200,
        price: 20,
        currency: 'USD',
        description: 'Test order 2',
        buyerInfo: {
          name: 'Buyer 2',
          contact: 'buyer2@test.com',
        },
      });

      // 更新订单状态为 CONFIRMED
      orderModel.updateOrderStatus(order1.id, OrderStatus.PENDING_PAYMENT, order1.version);
      const paidOrder1 = orderModel.updateOrderStatus(order1.id, OrderStatus.PAID, 2);
      orderModel.updateOrderStatus(paidOrder1.id, OrderStatus.CONFIRMED, 3);

      orderModel.updateOrderStatus(order2.id, OrderStatus.PENDING_PAYMENT, order2.version);
      const paidOrder2 = orderModel.updateOrderStatus(order2.id, OrderStatus.PAID, 2);
      orderModel.updateOrderStatus(paidOrder2.id, OrderStatus.CONFIRMED, 3);

      // 并发为两个订单创建 Dispute，应该都成功
      const [dispute1, dispute2] = await Promise.all([
        orderModel.createDispute({
          orderId: order1.id,
          raisedBy: 'buyer1',
          reason: 'Dispute 1',
          description: 'Description 1',
        }),
        orderModel.createDispute({
          orderId: order2.id,
          raisedBy: 'buyer2',
          reason: 'Dispute 2',
          description: 'Description 2',
        }),
      ]);

      // 两个 Dispute 都应该创建成功
      expect(dispute1).toBeDefined();
      expect(dispute2).toBeDefined();
      expect(dispute1.orderId).toBe(order1.id);
      expect(dispute2.orderId).toBe(order2.id);
    });
  });
});
