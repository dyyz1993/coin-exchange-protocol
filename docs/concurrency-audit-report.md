# 并发安全审查报告

**审查日期**: 2026-03-02  
**审查范围**: OrderModel 和 TaskModel  
**优先级**: P1 - 安全  
**Issue**: #312  

---

## 📋 执行摘要

审查发现了 **8 个高危并发安全问题**，可能导致资金损失、数据不一致和系统崩溃。需要立即修复。

---

## 🔴 OrderModel 并发安全问题

### 1. ❌ **createDispute 方法存在严重的竞态条件**

**位置**: `src/models/Order.ts` - `createDispute()` 方法

**问题描述**:
```typescript
createDispute(params) {
  const order = this.getOrder(params.orderId);  // 步骤 1: 获取 order
  // ... 创建 dispute ...
  this.disputes.set(disputeId, dispute);        // 步骤 2: 添加 dispute
  this.setDisputeId(params.orderId, disputeId, order.version); // 步骤 3: 更新 order
}
```

**风险**:
- **TOCTOU (Time-of-Check-Time-of-Use)**: 步骤 1 获取 order 后，步骤 3 更新前，order 可能已被其他线程修改
- **非原子性**: 步骤 2 和 3 不是原子操作，如果步骤 3 失败，dispute 已经创建
- **数据不一致**: 可能创建多个 dispute，但只更新一个

**修复建议**:
```typescript
createDispute(params) {
  const disputeId = `dispute_${Date.now()}_${randomUUID()}`;
  
  // 使用事务性操作
  const order = this.orders.get(params.orderId);
  if (!order) throw new Error('Order not found');
  
  // 原子性检查和更新
  const currentVersion = order.version;
  
  // 创建 dispute
  const dispute = { /* ... */ };
  
  // 一次性原子更新
  this.orders.set(params.orderId, {
    ...order,
    disputeId,
    status: OrderStatus.DISPUTED,
    version: order.version + 1,
    updatedAt: new Date()
  });
  
  this.disputes.set(disputeId, dispute);
  
  return dispute;
}
```

---

### 2. ⚠️ **Map 操作不是原子的**

**位置**: 所有使用 `this.orders.set()` 的方法

**问题描述**:
JavaScript 的 Map 在 Node.js 单线程环境下看似安全，但在以下场景有问题:
- 异步操作期间的并发修改
- 使用 worker_threads 的多线程环境
- 集群模式下的共享状态问题

**风险**:
- 数据覆盖
- 丢失更新
- 读取到不一致的数据

**修复建议**:
```typescript
// 方案 1: 使用 Mutex 锁
import { Mutex } from 'async-mutex';

export class OrderModel {
  private mutex = new Mutex();
  
  async updateOrderStatus(orderId: string, status: OrderStatus, expectedVersion?: number): Promise<Order> {
    const release = await this.mutex.acquire();
    try {
      // ... 原有逻辑 ...
    } finally {
      release();
    }
  }
}

// 方案 2: 使用数据库事务（推荐生产环境）
```

---

### 3. ❌ **单例模式的并发风险**

**位置**: `export const orderModel = new OrderModel();`

**问题描述**:
- 所有请求共享同一个实例
- 在高并发场景下，多个请求同时修改 Map
- 没有隔离机制

**修复建议**:
```typescript
// 方案 1: 工厂模式（每次创建新实例）
export class OrderModelFactory {
  static create(): OrderModel {
    return new OrderModel();
  }
}

// 方案 2: 使用数据库连接池（推荐）
// 每个请求使用独立的数据库事务
```

---

## 🔴 TaskModel 并发安全问题

### 4. ❌ **createCompletion 方法存在竞态条件**

**位置**: `src/models/Task.ts` - `createCompletion()` 方法

**问题描述**:
```typescript
createCompletion(taskId: string, userId: string): TaskCompletion {
  const task = this.getTask(taskId);
  
  // 检查 1: 完成次数
  if (task.currentCompletions >= task.maxCompletions) {
    throw new Error('Task has reached maximum completions');
  }
  
  // 检查 2: 用户是否已完成
  if (this.hasUserCompleted(userId, taskId)) {
    throw new Error('User has already completed this task');
  }
  
  // 创建完成记录
  this.completions.set(completionId, completion);
  this.userTaskCompletions.get(userId)!.add(taskId);
  
  // 更新完成次数
  task.currentCompletions++;  // ⚠️ 非原子操作！
}
```

**风险场景**:
1. 用户 A 和 B 同时完成任务（剩余 1 次）
2. 两个请求同时通过检查（都看到 currentCompletions < maxCompletions）
3. 两个请求都创建完成记录
4. 最终完成次数超过 maxCompletions

**修复建议**:
```typescript
createCompletion(taskId: string, userId: string): TaskCompletion {
  // 使用原子性检查和更新
  const task = this.tasks.get(taskId);
  if (!task) throw new Error('Task not found');
  
  // 原子性更新
  if (task.currentCompletions >= task.maxCompletions) {
    throw new Error('Task has reached maximum completions');
  }
  
  // 先增加计数，再创建记录
  task.currentCompletions++;
  
  try {
    // 创建完成记录
    // ...
  } catch (error) {
    // 回滚
    task.currentCompletions--;
    throw error;
  }
  
  return completion;
}
```

---

### 5. ❌ **缺少乐观锁机制**

**位置**: TaskModel 所有更新方法

**问题描述**:
- TaskModel 没有版本号字段
- 更新操作没有版本检查
- 无法检测并发修改

**修复建议**:
```typescript
export interface Task {
  id: string;
  // ... 其他字段 ...
  version: number;  // 添加版本号
}

updateTaskStatus(taskId: string, status: TaskStatus, expectedVersion?: number): Task {
  const task = this.tasks.get(taskId);
  if (!task) throw new Error('Task not found');
  
  // 乐观锁验证
  if (expectedVersion !== undefined && task.version !== expectedVersion) {
    throw new Error(`Concurrent modification detected`);
  }
  
  task.status = status;
  task.version++;
  task.updatedAt = new Date();
  
  return task;
}
```

---

### 6. ❌ **userTaskCompletions 的并发访问风险**

**位置**: `src/models/Task.ts` - `userTaskCompletions` Map

**问题描述**:
```typescript
if (!this.userTaskCompletions.has(userId)) {
  this.userTaskCompletions.set(userId, new Set());
}
this.userTaskCompletions.get(userId)!.add(taskId);
```

**风险**:
- 两个线程同时检查 `has(userId)` 都返回 false
- 两个线程都创建新的 Set
- 导致数据丢失

**修复建议**:
```typescript
// 使用原子性操作
if (!this.userTaskCompletions.has(userId)) {
  this.userTaskCompletions.set(userId, new Set());
}
const userSet = this.userTaskCompletions.get(userId);
if (userSet) {
  userSet.add(taskId);
}
```

---

## 🟡 通用问题

### 7. ⚠️ **缺少并发测试**

**位置**: `src/__tests__/models/`

**问题描述**:
- 没有针对并发场景的测试用例
- 无法验证并发安全性

**修复建议**:
- 创建 `OrderModel.concurrency.test.ts`
- 创建 `TaskModel.concurrency.test.ts`
- 模拟高并发场景

---

### 8. ⚠️ **缺少数据库事务支持**

**位置**: 整个 Model 层

**问题描述**:
- 当前使用内存 Map，无法支持事务
- 生产环境必须使用数据库

**修复建议**:
- 迁移到 PostgreSQL/MySQL
- 使用事务包裹关键操作
- 添加数据库连接池

---

## 📊 风险评级

| 问题 | 严重程度 | 影响范围 | 修复优先级 |
|------|---------|---------|-----------|
| 1. createDispute 竞态条件 | 🔴 高 | 资金安全 | P0 |
| 2. Map 操作非原子 | 🔴 高 | 数据一致性 | P0 |
| 3. 单例模式风险 | 🟡 中 | 可扩展性 | P1 |
| 4. createCompletion 竞态条件 | 🔴 高 | 资金安全 | P0 |
| 5. 缺少乐观锁 | 🔴 高 | 数据完整性 | P0 |
| 6. userTaskCompletions 并发 | 🟡 中 | 数据一致性 | P1 |
| 7. 缺少并发测试 | 🟡 中 | 质量保证 | P1 |
| 8. 缺少数据库事务 | 🔴 高 | 生产环境 | P0 |

---

## ✅ 修复建议总结

### 短期修复（1-2 天）:
1. 为 TaskModel 添加 version 字段和乐观锁
2. 修复 createDispute 和 createCompletion 的竞态条件
3. 添加 Mutex 锁保护关键操作

### 中期修复（1 周）:
4. 创建完整的并发测试套件
5. 重构为工厂模式或依赖注入

### 长期修复（2-4 周）:
6. 迁移到数据库（PostgreSQL）
7. 实现数据库事务
8. 添加分布式锁（Redis）

---

## 🧪 建议的测试场景

1. **并发创建测试**: 100 个并发请求创建订单
2. **并发更新测试**: 50 个并发请求更新同一个订单
3. **边界条件测试**: maxCompletions=1，10 个并发完成请求
4. **压力测试**: 1000 RPS 持续 1 分钟
5. **竞态条件测试**: 模拟 TOCTOU 场景

---

**审查人**: 质量工程师  
**审查时间**: 2026-03-02 08:41  
**下一步**: 创建并发测试用例，验证修复方案
