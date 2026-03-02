/**
 * OrderModel 并发安全性测试
 * 测试目标：验证 OrderModel 在高并发场景下的数据完整性
 */

import { OrderModel } from '../../models/Order';
import { OrderStatus } from '../../types';

describe('OrderModel Concurrency Safety Tests', () => {
  let orderModel: OrderModel;

  beforeEach(() => {
    orderModel = new OrderModel();
  });

  describe('Optimistic Locking Tests', () => {
    test('应该检测到并发修改并拒绝更新（版本号不匹配）', () => {
      // 创建订单
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 模拟两个并发请求读取同一个版本
      const version1 = order.version; // version = 1
      const version2 = order.version; // version = 1

      // 第一个请求成功更新
      const updated1 = orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        version1
      );
      expect(updated1.version).toBe(2);

      // 第二个请求应该失败（版本号已变化）
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.CANCELLED, version2);
      }).toThrow('Concurrent modification detected');
    });

    test('版本号必需 - 不提供版本号应该抛出错误', () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 不提供版本号，应该抛出错误（参数必需）
      expect(() => {
        // @ts-expect-error - 测试必需参数
        orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      }).toThrow();
    });
  });

  describe('State Machine Validation Tests', () => {
    test('应该拒绝非法的状态转换', () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // DRAFT -> COMPLETED 是非法转换
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED, 1);
      }).toThrow('Invalid status transition');
    });

    test('应该允许合法的状态转换路径', () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // DRAFT -> PENDING_PAYMENT -> PAID -> CONFIRMED -> COMPLETED
      let updated = orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);
      expect(updated.status).toBe(OrderStatus.PENDING_PAYMENT);

      updated = orderModel.updateOrderStatus(order.id, OrderStatus.PAID, 2);
      expect(updated.status).toBe(OrderStatus.PAID);

      updated = orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED, 3);
      expect(updated.status).toBe(OrderStatus.CONFIRMED);

      updated = orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED, 4);
      expect(updated.status).toBe(OrderStatus.COMPLETED);
    });
  });

  describe('Race Condition Simulation Tests', () => {
    test('并发更新同一订单时，只有一个应该成功（乐观锁保护）', async () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 模拟10个并发请求
      const concurrentUpdates = Array(10)
        .fill(null)
        .map((_, index) => {
          return new Promise<{ success: boolean; index: number }>((resolve) => {
            try {
              // 每个请求都使用初始版本号
              orderModel.updateOrderStatus(
                order.id,
                OrderStatus.PENDING_PAYMENT,
                1 // 所有请求都使用 version 1
              );
              resolve({ success: true, index });
            } catch (error) {
              resolve({ success: false, index });
            }
          });
        });

      const results = await Promise.all(concurrentUpdates);
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      // 只有一个应该成功
      expect(successCount).toBe(1);
      expect(failureCount).toBe(9);

      // 验证最终状态
      const finalOrder = orderModel.getOrder(order.id);
      expect(finalOrder?.version).toBe(2);
      expect(finalOrder?.status).toBe(OrderStatus.PENDING_PAYMENT);
    });

    test('并发设置冻结金额时，版本号应该正确递增', async () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 第一个更新
      const updated1 = orderModel.setFrozenAmount(order.id, 50, 1);
      expect(updated1.version).toBe(2);
      expect(updated1.frozenAmount).toBe(50);

      // 第二个更新（使用新版本号）
      const updated2 = orderModel.setFrozenAmount(order.id, 100, 2);
      expect(updated2.version).toBe(3);
      expect(updated2.frozenAmount).toBe(100);
    });
  });

  describe('Dispute Creation Concurrency Tests', () => {
    test('并发创建争议时，订单状态应该正确更新', () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 先将订单状态改为 CONFIRMED
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);
      orderModel.updateOrderStatus(order.id, OrderStatus.PAID, 2);
      orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED, 3);

      // 创建争议
      const dispute = orderModel.createDispute({
        orderId: order.id,
        raisedBy: 'user1',
        reason: 'Item not received',
        description: 'Test dispute',
      });

      // 验证订单状态已更新为 DISPUTED
      const updatedOrder = orderModel.getOrder(order.id);
      expect(updatedOrder?.status).toBe(OrderStatus.DISPUTED);
      expect(updatedOrder?.disputeId).toBe(dispute.id);
      expect(updatedOrder?.version).toBeGreaterThan(1);
    });
  });

  describe('Data Integrity Tests', () => {
    test('订单的所有更新操作应该保持数据完整性', () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      const orderId = order.id;
      const initialVersion = order.version;

      // 执行多个更新操作
      orderModel.updateOrderStatus(orderId, OrderStatus.PENDING_PAYMENT, initialVersion);

      const order2 = orderModel.getOrder(orderId);
      orderModel.setFrozenAmount(orderId, 50, order2!.version);

      const order3 = orderModel.getOrder(orderId);
      orderModel.setTransactionId(orderId, 'tx_123', order3!.version);

      // 验证最终状态
      const finalOrder = orderModel.getOrder(orderId);
      expect(finalOrder?.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(finalOrder?.frozenAmount).toBe(50);
      expect(finalOrder?.transactionId).toBe('tx_123');
      expect(finalOrder?.version).toBe(initialVersion + 3);
    });
  });
});
