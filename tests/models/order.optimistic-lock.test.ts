/**
 * 测试 OrderModel 乐观锁机制
 * 验证 Issue #362 修复：getOrder() 返回深拷贝，确保乐观锁有效
 */

import { OrderModel } from '../../src/models/Order';
import { OrderStatus } from '../../src/types';

describe('OrderModel 乐观锁机制', () => {
  let orderModel: OrderModel;

  beforeEach(() => {
    orderModel = new OrderModel();
  });

  describe('并发场景模拟', () => {
    it('应该检测到并发修改并阻止', () => {
      // 创建订单
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'John Doe',
          contact: 'john@example.com',
        },
      });

      expect(order.version).toBe(1);

      // 两个调用者同时获取订单（应该返回不同的深拷贝）
      const order1 = orderModel.getOrder(order.id);
      const order2 = orderModel.getOrder(order.id);

      // 验证返回的是不同的对象（深拷贝）
      expect(order1).not.toBe(order2);
      expect(order1?.version).toBe(1);
      expect(order2?.version).toBe(1);

      // 第一个请求成功更新
      const updated1 = orderModel.updateOrderStatus(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        order1!.version // version = 1
      );
      expect(updated1.version).toBe(2);

      // 验证 order1 和 order2 的版本号没有改变（因为它们是深拷贝）
      expect(order1?.version).toBe(1);
      expect(order2?.version).toBe(1);

      // 第二个请求应该失败，因为版本号已经改变
      expect(() => {
        orderModel.updateOrderStatus(
          order.id,
          OrderStatus.CANCELLED,
          order2!.version // order2.version 仍然是 1
        );
      }).toThrow('Concurrent modification detected');
    });

    it('多个 getter 方法应该返回独立的深拷贝', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'John Doe',
          contact: 'john@example.com',
        },
      });

      // 通过不同的 getter 获取订单
      const order1 = orderModel.getOrder(order.id);
      const order2 = orderModel.getOrderByOrderNo(order.orderNo);
      const allOrders = orderModel.getAllOrders();
      const buyerOrders = orderModel.getBuyerOrders('buyer1');

      // 验证所有返回的都是不同的对象
      expect(order1).not.toBe(order2);
      expect(allOrders[0]).not.toBe(order1);
      expect(buyerOrders[0]).not.toBe(order1);

      // 修改其中一个不应该影响其他的
      if (order1) {
        (order1 as any).version = 999;
        expect(order2?.version).toBe(1);
        expect(allOrders[0].version).toBe(1);
        expect(buyerOrders[0].version).toBe(1);
      }
    });

    it('争议相关的 getter 也应该返回深拷贝', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'John Doe',
          contact: 'john@example.com',
        },
      });

      // 先更新订单状态到 PAID，这样才能创建争议
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);
      orderModel.updateOrderStatus(order.id, OrderStatus.PAID, 2);

      const dispute = orderModel.createDispute({
        orderId: order.id,
        raisedBy: 'buyer1',
        reason: 'Item not received',
        description: 'I did not receive the item',
      });

      // 通过不同的 getter 获取争议
      const dispute1 = orderModel.getDispute(dispute.id);
      const dispute2 = orderModel.getDisputeByOrderId(order.id);
      const allDisputes = orderModel.getAllDisputes();
      const userDisputes = orderModel.getUserDisputes('buyer1');

      // 验证所有返回的都是不同的对象
      expect(dispute1).not.toBe(dispute2);
      expect(allDisputes[0]).not.toBe(dispute1);
      expect(userDisputes[0]).not.toBe(dispute1);
    });
  });

  describe('乐观锁边界情况', () => {
    it('不提供版本号时应该允许更新（向后兼容）', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'John Doe',
          contact: 'john@example.com',
        },
      });

      // 不提供版本号，应该成功
      const updated = orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT);
      expect(updated.version).toBe(2);
    });

    it('提供正确的版本号时应该成功更新', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'John Doe',
          contact: 'john@example.com',
        },
      });

      // 提供正确的版本号
      const updated = orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);
      expect(updated.version).toBe(2);
    });

    it('提供错误的版本号时应该抛出异常', () => {
      const order = orderModel.createOrder({
        buyerId: 'buyer1',
        sellerId: 'seller1',
        amount: 100,
        price: 10,
        currency: 'USD',
        description: 'Test order',
        buyerInfo: {
          name: 'John Doe',
          contact: 'john@example.com',
        },
      });

      // 先更新一次
      orderModel.updateOrderStatus(order.id, OrderStatus.PENDING_PAYMENT, 1);

      // 使用过期的版本号应该失败
      expect(() => {
        orderModel.updateOrderStatus(order.id, OrderStatus.CANCELLED, 1);
      }).toThrow('Concurrent modification detected');
    });
  });
});
