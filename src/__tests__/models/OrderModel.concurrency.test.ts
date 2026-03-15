/**
 * OrderModel 并发安全测试
 * 验证 Issue #312: OrderModel 和 TaskModel 存在并发安全问题
 */

import { OrderModel } from '../../models/Order';
import { OrderStatus } from '../../types';

describe('OrderModel 并发安全测试', () => {
  let orderModel: OrderModel;

  beforeEach(() => {
    orderModel = new OrderModel();
  });

  describe('🔴 竞态条件测试', () => {
    test('并发更新订单状态应该检测到冲突', async () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      const initialVersion = order.version;

      // 模拟并发更新
      const update1 = orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        initialVersion
      );

      // 第二次更新应该失败（版本号已改变）
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.CANCELLED, initialVersion);
      }).toThrow('Concurrent modification detected');

      expect(update1.version).toBe(initialVersion + 1);
    });

    test('并发创建争议应该防止重复', async () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 先更新为 PAID 状态
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, order.version);
      orderModel.updateOrderStatus(order.id, OrderStatus.PAID, order.version + 1);
      orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED, order.version + 2);

      // 并发创建争议（这应该会失败）
      const dispute1 = orderModel.createDispute({
        orderId: order.id,
        raisedBy: 'user1',
        reason: 'Test dispute 1',
        description: 'Description 1',
      });

      // 第二个争议应该失败（订单已经在 DISPUTED 状态）
      expect(() => {
        orderModel.createDispute({
          orderId: order.id,
          raisedBy: 'user2',
          reason: 'Test dispute 2',
          description: 'Description 2',
        });
      }).toThrow();
    });
  });

  describe('⚠️ 高并发压力测试', () => {
    test('100 个并发订单创建应该全部成功', async () => {
      const promises: Promise<any>[] = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve(
            orderModel.createOrder({
              buyerId: `buyer${i}`,
              sellerId: 'seller1',
              amount: 10,
              price: 1,
              currency: 'USD',
              description: `Order ${i}`,
              buyerInfo: { name: `Buyer ${i}`, contact: `buyer${i}@test.com` },
            })
          )
        );
      }

      const orders = await Promise.all(promises);

      expect(orders.length).toBe(100);
      expect(new Set(orders.map((o) => o.id)).size).toBe(100); // 所有 ID 唯一
    });

    test('并发读取和更新应该保持数据一致性', async () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 更新到 PAID 状态
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);
      orderModel.updateOrderStatus(order.id, OrderStatus.PAID, 2);

      // 并发读取
      const reads = await Promise.all([
        Promise.resolve(orderModel.getOrder(order.id)),
        Promise.resolve(orderModel.getOrder(order.id)),
        Promise.resolve(orderModel.getOrder(order.id)),
      ]);

      // 所有读取应该返回相同的状态
      reads.forEach((read) => {
        expect(read?.status).toBe(OrderStatus.PAID);
        expect(read?.version).toBe(3);
      });
    });
  });

  describe('🔒 乐观锁验证测试', () => {
    test('乐观锁应该防止并发修改', () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 第一次更新（成功）
      const updated1 = orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);
      expect(updated1.version).toBe(2);

      // 第二次更新（使用旧版本号，应该失败）
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.CANCELLED, 1);
      }).toThrow('Concurrent modification detected');

      // 第三次更新（使用新版本号，应该成功）
      const updated2 = orderModel.updateOrderStatus(order.id, OrderStatus.CANCELLED, 2);
      expect(updated2.version).toBe(3);
    });

    test('所有更新方法都应该验证版本号', () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 测试 setFrozenAmount
      expect(() => {
        orderModel.setFrozenAmount(order.id, 50, 999);
      }).toThrow('Concurrent modification detected');

      // 测试 setTransactionId
      expect(() => {
        orderModel.setTransactionId(order.id, 'tx123', 999);
      }).toThrow('Concurrent modification detected');

      // 测试 setExternalPaymentId
      expect(() => {
        orderModel.setExternalPaymentId(order.id, 'ext123', 999);
      }).toThrow('Concurrent modification detected');
    });
  });

  describe('📊 状态机验证测试', () => {
    test('非法状态转换应该被拒绝', () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // DRAFT -> COMPLETED (非法)
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED, 1);
      }).toThrow('Invalid status transition');
    });

    test('并发状态转换应该遵循状态机', () => {
      const order = orderModel.createOrder({
        buyerId: 'user1',
        sellerId: 'user2',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // DRAFT -> PENDING_PAYMENT (合法)
      const step1 = orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);
      expect(step1.status).toBe(OrderStatus.PENDING_PAYMENT);

      // PENDING_PAYMENT -> PAID (合法)
      const step2 = orderModel.updateOrderStatus(order.id, OrderStatus.PAID, 2);
      expect(step2.status).toBe(OrderStatus.PAID);

      // PAID -> CONFIRMED (合法)
      const step3 = orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED, 3);
      expect(step3.status).toBe(OrderStatus.CONFIRMED);

      // CONFIRMED -> COMPLETED (合法)
      const step4 = orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED, 4);
      expect(step4.status).toBe(OrderStatus.COMPLETED);

      // COMPLETED -> DISPUTED (非法)
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.DISPUTED, 5);
      }).toThrow('Invalid status transition');
    });
  });
});
