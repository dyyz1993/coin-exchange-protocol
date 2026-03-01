/**
 * OrderModel 并发控制机制测试
 * 验证乐观锁、版本号和状态转换
 */

import { OrderModel } from '../../src/models/Order';
import { OrderStatus } from '../../src/types';

describe('OrderModel 并发控制测试', () => {
  let orderModel: OrderModel;

  beforeEach(() => {
    orderModel = new OrderModel();
  });

  describe('版本号机制', () => {
    it('创建订单时应初始化版本号为 1', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      expect(order.version).toBe(1);
    });

    it('更新订单状态时应递增版本号', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      const updated = orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        order.version
      );

      expect(updated.version).toBe(2);
    });

    it('版本号不匹配时应抛出错误', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 999);
      }).toThrow('Concurrent modification detected');
    });
  });

  describe('乐观锁验证', () => {
    it('不提供版本号时应允许更新（向后兼容）', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      const updated = orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      expect(updated.status).toBe(OrderStatus.PENDING_PAYMENT);
    });

    it('setFrozenAmount 应验证版本号', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      expect(() => {
        orderModel.setFrozenAmount(order.id, 50, 999);
      }).toThrow('Concurrent modification detected');
    });

    it('setTransactionId 应验证版本号', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      expect(() => {
        orderModel.setTransactionId(order.id, 'tx123', 999);
      }).toThrow('Concurrent modification detected');
    });

    it('setExternalPaymentId 应验证版本号', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      expect(() => {
        orderModel.setExternalPaymentId(order.id, 'pay123', 999);
      }).toThrow('Concurrent modification detected');
    });
  });

  describe('状态转换验证', () => {
    it('允许 DRAFT → PENDING_PAYMENT 转换', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      const updated = orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      expect(updated.status).toBe(OrderStatus.PENDING_PAYMENT);
    });

    it('允许 PENDING_PAYMENT → PAID 转换', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      const updated = orderModel.updateOrderStatus(order.id, OrderStatus.PAID);
      expect(updated.status).toBe(OrderStatus.PAID);
    });

    it('允许 PAID → CONFIRMED 转换', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      orderModel.updateOrderStatus(order.id, OrderStatus.PAID);
      const updated = orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED);
      expect(updated.status).toBe(OrderStatus.CONFIRMED);
    });

    it('允许 CONFIRMED → COMPLETED 转换', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      orderModel.updateOrderStatus(order.id, OrderStatus.PAID);
      orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED);
      const updated = orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED);
      expect(updated.status).toBe(OrderStatus.COMPLETED);
    });

    it('禁止 COMPLETED → 其他状态转换', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      orderModel.updateOrderStatus(order.id, OrderStatus.PAID);
      orderModel.updateOrderStatus(order.id, OrderStatus.CONFIRMED);
      orderModel.updateOrderStatus(order.id, OrderStatus.COMPLETED);

      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.CANCELLED);
      }).toThrow('Invalid status transition');
    });

    it('禁止非法状态转换 DRAFT → PAID', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.PAID);
      }).toThrow('Invalid status transition');
    });
  });

  describe('并发场景测试', () => {
    it('模拟并发修改检测', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      // 第一次更新成功
      const updated1 = orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        order.version
      );
      expect(updated1.version).toBe(2);

      // 第二次更新使用旧版本号，应失败
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.PAID, order.version);
      }).toThrow('Concurrent modification detected');

      // 使用新版本号，应成功
      const updated2 = orderModel.updateOrderStatus(order.id, OrderStatus.PAID, updated1.version);
      expect(updated2.version).toBe(3);
    });
  });

  describe('订单号生成', () => {
    it('应生成唯一订单号', () => {
      const order1 = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: '测试订单1',
        buyerInfo: { name: '买家1', contact: 'buyer@test.com' },
      });

      const order2 = orderModel.createOrder({
        buyerId: 'buyer2',
        sellerId: 'seller2',
        amount: 200,
        price: 20,
        currency: 'USD',
        description: '测试订单2',
        buyerInfo: { name: '买家2', contact: 'buyer2@test.com' },
      });

      expect(order1.orderNo).not.toBe(order2.orderNo);
      expect(order1.orderNo).toMatch(/^ORD-/);
      expect(order2.orderNo).toMatch(/^ORD-/);
    });
  });
});
