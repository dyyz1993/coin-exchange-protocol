# Issue #336 - OrderModel 乐观锁迁移指南

## 📋 变更摘要

**优先级**: P1 - 安全改进  
**影响范围**: 所有使用 OrderModel 更新方法的代码  
**向后兼容性**: ❌ 破坏性变更

## 🔧 变更内容

### 修改的方法

以下方法的 `expectedVersion` 参数从**可选**变为**必需**：

1. `updateOrderStatus(orderId, status, expectedVersion)` ✅ 必需
2. `setFrozenAmount(orderId, frozenAmount, expectedVersion)` ✅ 必需
3. `setTransactionId(orderId, transactionId, expectedVersion)` ✅ 必需
4. `setExternalPaymentId(orderId, externalPaymentId, expectedVersion)` ✅ 必需
5. `setDisputeId(orderId, disputeId, expectedVersion)` ✅ 必需

### 修改前后对比

#### ❌ 修改前（不安全）

```typescript
// 允许不提供版本号 - 可能导致并发问题
orderModel.updateOrderStatus(orderId, OrderStatus.PAID);

// 允许提供版本号 - 但不强制
orderModel.updateOrderStatus(orderId, OrderStatus.PAID, 1);
```

#### ✅ 修改后（安全）

```typescript
// 必须提供版本号 - 编译时检查
const order = orderModel.getOrder(orderId);
orderModel.updateOrderStatus(orderId, OrderStatus.PAID, order.version);
```

## 🚀 迁移步骤

### 1. 识别所有调用方

```bash
grep -r "updateOrderStatus\|setFrozenAmount\|setTransactionId\|setExternalPaymentId\|setDisputeId" src/ --include="*.ts"
```

### 2. 更新调用代码

**模式1：单次更新**

```typescript
// ❌ 修改前
orderModel.updateOrderStatus(orderId, OrderStatus.PAID);

// ✅ 修改后
const order = orderModel.getOrder(orderId);
if (!order) throw new Error('Order not found');
orderModel.updateOrderStatus(orderId, OrderStatus.PAID, order.version);
```

**模式2：链式更新**

```typescript
// ❌ 修改前
orderModel.updateOrderStatus(orderId, OrderStatus.PENDING_PAYMENT);
orderModel.updateOrderStatus(orderId, OrderStatus.PAID);

// ✅ 修改后
let order = orderModel.getOrder(orderId);
if (!order) throw new Error('Order not found');

order = orderModel.updateOrderStatus(orderId, OrderStatus.PENDING_PAYMENT, order.version);
order = orderModel.updateOrderStatus(orderId, OrderStatus.PAID, order.version);
```

**模式3：并发场景**

```typescript
// ✅ 正确处理并发
try {
  const order = orderModel.getOrder(orderId);
  if (!order) throw new Error('Order not found');
  
  const updated = orderModel.updateOrderStatus(orderId, OrderStatus.PAID, order.version);
  console.log('Update successful:', updated.version);
} catch (error) {
  if (error.message.includes('Concurrent modification detected')) {
    // 处理并发冲突
    console.warn('Order was modified by another process, please retry');
  } else {
    throw error;
  }
}
```

## 🧪 测试验证

### 运行测试

```bash
npm test -- src/__tests__/concurrency/order-model.concurrency.test.ts
```

### 测试覆盖

- ✅ 并发修改检测
- ✅ 版本号必需验证
- ✅ 状态机转换验证
- ✅ 竞态条件模拟
- ✅ 数据完整性验证

## ⚠️ 注意事项

### 1. 向后兼容性

**此变更不向后兼容**，所有调用方必须更新代码。

### 2. 错误处理

建议添加重试逻辑处理并发冲突：

```typescript
async function updateOrderWithRetry(orderId: string, status: OrderStatus, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const order = orderModel.getOrder(orderId);
      if (!order) throw new Error('Order not found');
      
      return orderModel.updateOrderStatus(orderId, status, order.version);
    } catch (error) {
      if (error.message.includes('Concurrent modification detected')) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 100)); // 等待后重试
        continue;
      }
      throw error;
    }
  }
}
```

### 3. 性能影响

- ✅ 每次更新前需要调用 `getOrder()` 获取当前版本号
- ✅ 增加了一次读取操作，但避免了并发问题带来的数据损坏
- ✅ 整体性能影响可忽略不计

## 📊 影响评估

### 受影响的文件

- ✅ `src/models/Order.ts` - 已更新
- ✅ `src/__tests__/concurrency/order-model.concurrency.test.ts` - 已更新
- ⚠️ 其他调用方需要检查并更新

### 风险等级

- **低风险**: 测试环境
- **中风险**: 生产环境（需要仔细检查所有调用方）

## 📅 时间表

- **2026-03-02**: 完成代码修改和测试
- **2026-03-03**: PR 提交和审查
- **2026-03-05**: 合并到主分支
- **2026-03-11**: 生产环境部署（截止时间）

## 🔗 相关链接

- Issue: #336
- PR: 待创建
- 相关 Issues: #332, #333, #335, #337
- 参考文档: `docs/issue-analysis-332-337.md`
