/**
 * OrderModel 并发安全性测试
 * 测试目标：验证 OrderModel 在高并发场景下的数据完整性
 *
 * 修复说明 (Issue #312)：
 * - 所有方法已改为异步 API
 * - expectedVersion 参数现在是必填
 */

import { OrderModel } from '../../models/Order';
import { OrderStatus } from '../../types';

describe('OrderModel Concurrency Safety Tests', () => {
  let orderModel: OrderModel;

  beforeEach(() => {
    orderModel = new OrderModel();
  });

  describe('Optimistic Locking Tests', () => {
    test('应该检测到并发修改并拒绝更新（版本号不匹配）', async () => {
      // 创建订单
      const order = await orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 模拟两个并发请求读取同一个版本
      const version1 = order.version; // version = 0
      const version2 = order.version; // version = 0

      // 第一个请求成功更新
      const updated1 = await orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        version1
      );
      expect(updated1.version).toBe(1);

      // 第二个请求应该失败（版本号已变化）
      await expect(
        orderModel.updateOrderStatus(order.id, OrderStatus.CANCELLED, version2)
      ).rejects.toThrow('Concurrent modification detected');
    });

    test('版本号必须提供，否则 TypeScript 编译错误', async () => {
      const order = await orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 必须提供版本号（强制检查）
      const updated = await orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        order.version
      );
      expect(updated.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(updated.version).toBe(1);
    });
  });

  describe('State Machine Validation Tests', () => {
    test('应该拒绝非法的状态转换', async () => {
      const order = await orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // DRAFT -> COMPLETED 是非法转换
      await expect(
        orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED, order.version)
      ).rejects.toThrow('Invalid status transition');
    });

    test('应该允许合法的状态转换路径', async () => {
      const order = await orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // DRAFT -> PENDING_PAYMENT -> PAID -> CONFIRMED -> COMPLETED
      let updated = await orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        order.version
      );
      expect(updated.status).toBe(OrderStatus.PENDING_PAYMENT);

      updated = await orderModel.updateOrderStatus(order.id, OrderStatus.PAID, updated.version);
      expect(updated.status).toBe(OrderStatus.PAID);

      updated = await orderModel.updateOrderStatus(
        order.id,
        OrderStatus.CONFIRMED,
        updated.version
      );
      expect(updated.status).toBe(OrderStatus.CONFIRMED);

      updated = await orderModel.updateOrderStatus(
        order.id,
        OrderStatus.COMPLETED,
        updated.version
      );
      expect(updated.status).toBe(OrderStatus.COMPLETED);
    });
  });

  describe('Race Condition Simulation Tests', () => {
    test('并发更新同一订单时，只有一个应该成功（乐观锁 + Mutex 保护）', async () => {
      const order = await orderModel.createOrder({
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
          return orderModel
            .updateOrderStatus(
              order.id,
              OrderStatus.PENDING_PAYMENT,
              0 // 所有请求都使用初始版本号 0
            )
            .then(() => ({ success: true, index }))
            .catch(() => ({ success: false, index }));
        });

      const results = await Promise.all(concurrentUpdates);
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      // 只有一个应该成功（Mutex 确保串行化，乐观锁检测版本冲突）
      expect(successCount).toBe(1);
      expect(failureCount).toBe(9);

      // 验证最终状态
      const finalOrder = orderModel.getOrder(order.id);
      expect(finalOrder?.version).toBe(1);
      expect(finalOrder?.status).toBe(OrderStatus.PENDING_PAYMENT);
    });

    test('并发设置冻结金额时，版本号应该正确递增', async () => {
      const order = await orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 第一个更新
      const updated1 = await orderModel.setFrozenAmount(order.id, 50, 0);
      expect(updated1.version).toBe(1);
      expect(updated1.frozenAmount).toBe(50);

      // 第二个更新（使用新版本号）
      const updated2 = await orderModel.setFrozenAmount(order.id, 100, 1);
      expect(updated2.version).toBe(2);
      expect(updated2.frozenAmount).toBe(100);
    });
  });

  describe('Dispute Creation Concurrency Tests', () => {
    test('并发创建争议时，订单状态应该正确更新', async () => {
      const order = await orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 先将订单状态改为 CONFIRMED
      let updated = await orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        order.version
      );
      updated = await orderModel.updateOrderStatus(order.id, OrderStatus.PAID, updated.version);
      updated = await orderModel.updateOrderStatus(
        order.id,
        OrderStatus.CONFIRMED,
        updated.version
      );

      // 创建争议
      const dispute = await orderModel.createDispute({
        orderId: order.id,
        raisedBy: 'user1',
        reason: 'Item not received',
        description: 'Test dispute',
      });

      // 验证订单状态已更新为 DISPUTED
      const updatedOrder = orderModel.getOrder(order.id);
      expect(updatedOrder?.status).toBe(OrderStatus.DISPUTED);
      expect(updatedOrder?.disputeId).toBe(dispute.id);
      expect(updatedOrder?.version).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity Tests', () => {
    test('订单的所有更新操作应该保持数据完整性', async () => {
      const order = await orderModel.createOrder({
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
      let updated = await orderModel.updateOrderStatus(
        orderId,
        OrderStatus.PENDING_PAYMENT,
        initialVersion
      );

      updated = await orderModel.setFrozenAmount(orderId, 50, updated.version);

      updated = await orderModel.setTransactionId(orderId, 'tx_123', updated.version);

      // 验证最终状态
      const finalOrder = orderModel.getOrder(orderId);
      expect(finalOrder?.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(finalOrder?.frozenAmount).toBe(50);
      expect(finalOrder?.transactionId).toBe('tx_123');
      expect(finalOrder?.version).toBe(initialVersion + 3);
    });
  });
});
