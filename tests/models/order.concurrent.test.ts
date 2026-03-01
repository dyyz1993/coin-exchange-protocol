/**
 * OrderModel 并发控制机制测试
 * 测试乐观锁、状态转换验证、订单号唯一性
 */

import { OrderModel } from '../../src/models/Order';
import { OrderStatus } from '../../src/types';

describe('OrderModel 并发控制机制', () => {
  let orderModel: OrderModel;

  beforeEach(() => {
    orderModel = new OrderModel();
  });

  describe('乐观锁机制', () => {
    it('应该成功更新订单状态（版本号匹配）', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      expect(order.version).toBe(1);

      // 使用正确的版本号更新
      const updated = orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        1 // expectedVersion
      );

      expect(updated.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(updated.version).toBe(2); // 版本号递增
    });

    it('应该在版本号不匹配时抛出异常（检测并发修改）', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      expect(order.version).toBe(1);

      // 第一次更新成功，版本号变为 2
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);

      // 第二次更新使用旧的版本号，应该失败
      expect(() => {
        orderModel.updateOrderStatus(
          order.id,
          OrderStatus.PAID,
          1 // 错误的版本号，当前应该是 2
        );
      }).toThrow('Concurrent modification detected');
    });

    it('应该在多次更新后正确递增版本号', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      expect(order.version).toBe(1);

      // 第一次更新
      let updated = orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);
      expect(updated.version).toBe(2);

      // 第二次更新
      updated = orderModel.updateOrderStatus(order.id, OrderStatus.PAID, 2);
      expect(updated.version).toBe(3);

      // 第三次更新
      updated = orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED, 3);
      expect(updated.version).toBe(4);

      // 第四次更新
      updated = orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED, 4);
      expect(updated.version).toBe(5);
    });

    it('应该在不提供版本号时允许更新（向后兼容）', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 不提供版本号，应该成功
      const updated = orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      expect(updated.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(updated.version).toBe(2);
    });
  });

  describe('状态转换验证', () => {
    it('应该允许合法的状态转换', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // DRAFT -> PENDING_PAYMENT
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      }).not.toThrow();

      // PENDING_PAYMENT -> PAID
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.PAID);
      }).not.toThrow();

      // PAID -> CONFIRMED
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED);
      }).not.toThrow();

      // CONFIRMED -> COMPLETED
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED);
      }).not.toThrow();
    });

    it('应该在非法状态转换时抛出异常', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // DRAFT -> COMPLETED (非法)
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED);
      }).toThrow('Invalid status transition');

      // DRAFT -> CONFIRMED (非法)
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED);
      }).toThrow('Invalid status transition');
    });

    it('应该阻止已完成订单的状态转换', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 先完成订单
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      orderModel.updateOrderStatus(order.id, OrderStatus.PAID);
      orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED);
      orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED);

      // 尝试从 COMPLETED 转换到其他状态（应该失败）
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.CANCELLED);
      }).toThrow('Invalid status transition');
    });

    it('应该允许从多个状态转换到争议状态', () => {
      // 从 PAID -> DISPUTED
      const order1 = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });
      orderModel.updateOrderStatus(order1.id, OrderStatus.PENDING_PAYMENT);
      orderModel.updateOrderStatus(order1.id, OrderStatus.PAID);

      expect(() => {
        orderModel.updateOrderStatus(order1.id, OrderStatus.DISPUTED);
      }).not.toThrow();

      // 从 CONFIRMED -> DISPUTED
      const order2 = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });
      orderModel.updateOrderStatus(order2.id, OrderStatus.PENDING_PAYMENT);
      orderModel.updateOrderStatus(order2.id, OrderStatus.PAID);
      orderModel.updateOrderStatus(order2.id, OrderStatus.CONFIRMED);

      expect(() => {
        orderModel.updateOrderStatus(order2.id, OrderStatus.DISPUTED);
      }).not.toThrow();
    });
  });

  describe('订单号生成策略', () => {
    it('应该生成唯一的订单号', () => {
      const orderNos = new Set<string>();

      // 生成 100 个订单，确保订单号唯一
      for (let i = 0; i < 100; i++) {
        const order = orderModel.createOrder({
          buyerId: `buyer${i}`,
          sellerId: `seller${i}`,
          amount: 100,
          price: 10,
          currency: 'USD',
          description: 'Test order',
          buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
        });

        expect(orderNos.has(order.orderNo)).toBe(false);
        orderNos.add(order.orderNo);
      }

      expect(orderNos.size).toBe(100);
    });

    it('应该生成符合格式的订单号', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 格式: ORD-{timestamp}-{uuid8}
      expect(order.orderNo).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]{8}$/);
    });
  });

  describe('其他方法的乐观锁支持', () => {
    it('setFrozenAmount 应该支持乐观锁', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 使用正确的版本号
      const updated = orderModel.setFrozenAmount(order.id, 50, 1);
      expect(updated.frozenAmount).toBe(50);
      expect(updated.version).toBe(2);

      // 使用错误的版本号
      expect(() => {
        orderModel.setFrozenAmount(order.id, 60, 1);
      }).toThrow('Concurrent modification detected');
    });

    it('setTransactionId 应该支持乐观锁', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      const updated = orderModel.setTransactionId(order.id, 'tx123', 1);
      expect(updated.transactionId).toBe('tx123');
      expect(updated.version).toBe(2);
    });

    it('setExternalPaymentId 应该支持乐观锁', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      const updated = orderModel.setExternalPaymentId(order.id, 'ext123', 1);
      expect(updated.externalPaymentId).toBe('ext123');
      expect(updated.version).toBe(2);
    });

    it('setDisputeId 应该支持乐观锁并验证状态转换', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 先将订单设置为 PAID 状态
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      orderModel.updateOrderStatus(order.id, OrderStatus.PAID);

      // 获取最新版本
      const latestOrder = orderModel.getOrder(order.id);
      expect(latestOrder).toBeDefined();

      // 设置争议ID（应该成功）
      const updated = orderModel.setDisputeId(order.id!, 'dispute123', latestOrder!.version);
      expect(updated.disputeId).toBe('dispute123');
      expect(updated.status).toBe(OrderStatus.DISPUTED);
    });
  });

  describe('并发场景模拟', () => {
    it('应该检测到并发修改并阻止', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: { name: 'Buyer', contact: 'buyer@test.com' },
      });

      // 模拟两个并发请求同时读取订单（version = 1）
      const order1 = orderModel.getOrder(order.id);
      const order2 = orderModel.getOrder(order.id);

      expect(order1?.version).toBe(1);
      expect(order2?.version).toBe(1);

      // 第一个请求成功更新
      const updated1 = orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        order1!.version
      );
      expect(updated1.version).toBe(2);

      // 第二个请求失败（版本号不匹配）
      expect(() => {
        orderModel.updateOrderStatus(
          order.id,
          OrderStatus.CANCELLED,
          order2!.version // 使用旧的版本号 1
        );
      }).toThrow('Concurrent modification detected');
    });
  });
});
