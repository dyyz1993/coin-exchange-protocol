# 任务完成次数并发问题分析报告

**Issue**: #238 (重复 #235)  
**优先级**: P1 - 并发安全  
**日期**: 2026-03-01  
**作者**: 质量工程师

---

## 📋 执行摘要

在高并发场景下，多个用户同时完成任务时，`TaskModel.createCompletion()` 方法存在严重的竞态条件（Race Condition），可能导致任务完成次数超过 `maxCompletions` 限制，造成奖励超发。

**风险等级**: 🔴 **严重**  
**影响范围**: 任务系统核心功能  
**修复优先级**: 立即修复

---

## 🔍 问题分析

### 1. 并发风险代码定位

**文件**: `src/models/Task.ts`  
**方法**: `createCompletion()`  
**代码行**: 83-130

```typescript
// ⚠️ 问题代码段
createCompletion(taskId: string, userId: string): TaskCompletion {
  const task = this.getTask(taskId);
  
  // 检查完成次数 (第111行)
  if (task.currentCompletions >= task.maxCompletions) {
    throw new Error('Task has reached maximum completions');
  }
  
  // ... 其他检查和创建记录代码 ...
  
  // 更新任务完成次数 (第129行)
  task.currentCompletions++;  // ⚠️ 非原子操作
  
  return completion;
}
```

### 2. 竞态条件详细分析

#### 时间线演示

假设任务 `maxCompletions = 10`，当前 `currentCompletions = 9`

| 时间 | 线程 A (用户1) | 线程 B (用户2) | currentCompletions |
|------|----------------|----------------|-------------------|
| T1 | 读取 currentCompletions = 9 | - | 9 |
| T2 | 检查 9 >= 10? ❌ 通过 | - | 9 |
| T3 | - | 读取 currentCompletions = 9 | 9 |
| T4 | - | 检查 9 >= 10? ❌ 通过 | 9 |
| T5 | 创建完成记录 | - | 9 |
| T6 | currentCompletions++ | - | 10 |
| T7 | - | 创建完成记录 | 10 |
| T8 | - | currentCompletions++ | **11** ⚠️ |

**结果**: 任务完成次数变为 11，超过了限制 10，第11个用户获得了不应该发放的奖励。

#### 并发场景

1. **读-读-写-写模式**: 多个请求同时读取相同的 currentCompletions 值
2. **检查-执行非原子性**: 检查和更新操作之间存在时间窗口
3. **缺少同步机制**: 没有使用锁、信号量或原子操作

### 3. 代码层面的问题

#### 3.1 缺少并发控制机制

```typescript
// ❌ 当前实现：无任何并发保护
createCompletion(taskId: string, userId: string): TaskCompletion {
  const task = this.getTask(taskId);
  if (task.currentCompletions >= task.maxCompletions) {
    throw new Error('Task has reached maximum completions');
  }
  // ... 中间可能有其他线程插入 ...
  task.currentCompletions++;
  return completion;
}
```

#### 3.2 非原子性操作

- 读取 `currentCompletions`
- 检查条件
- 创建完成记录
- 增加 `currentCompletions`

这4个步骤不是原子操作，可能被其他线程打断。

#### 3.3 TaskService 同样存在风险

**文件**: `src/services/task.service.ts`  
**方法**: `completeTask()`  
**代码行**: 83-130

```typescript
// ⚠️ 在 service 层也做了检查，但同样不是原子的
if (task.currentCompletions >= task.maxCompletions) {
  throw new Error('任务已完成次数已达上限');
}

// 创建完成记录（内部还会再次检查）
const completion = taskModel.createCompletion(taskId, userId);
```

即使在 service 层做了检查，但由于检查和调用 `createCompletion` 不是原子的，仍然存在竞态条件。

---

## ✅ 参考实现：AccountModel 的并发控制

**文件**: `src/models/Account.ts`

AccountModel 已经实现了完整的并发控制机制，我们可以参考其实现：

### 1. 使用 Mutex 锁

```typescript
// ✅ AccountModel 使用 async-mutex 库
import { Mutex } from 'async-mutex';

private accountMutexes: Map<string, Mutex> = new Map();

private getMutex(userId: string): Mutex {
  if (!this.accountMutexes.has(userId)) {
    this.accountMutexes.set(userId, new Mutex());
  }
  return this.accountMutexes.get(userId)!;
}
```

### 2. 使用 withLock 包装器

```typescript
// ✅ 使用锁包装异步操作
private async withLock<T>(userId: string, operation: () => T | Promise<T>): Promise<T> {
  const mutex = this.getMutex(userId);
  const release = await mutex.acquire();
  try {
    return await operation();
  } finally {
    release();
  }
}
```

### 3. 使用版本号实现乐观锁

```typescript
// ✅ 版本号验证（CAS 操作）
private validateAndUpdateBalance(
  account: Account,
  expectedVersion: number,
  updateFn: () => void
): void {
  if (account.version !== expectedVersion) {
    throw new Error(`Concurrent modification detected`);
  }
  updateFn();
  account.version = (account.version || 0) + 1;
}
```

---

## 🧪 并发测试用例设计

### 测试场景 1: 基础并发测试

**目标**: 验证 maxCompletions 限制在并发场景下是否生效

```typescript
describe('Task Concurrency Tests', () => {
  it('should not exceed maxCompletions under concurrent access', async () => {
    // 创建任务：maxCompletions = 10
    const task = await taskModel.createTask({
      title: 'Concurrent Test Task',
      description: 'Test',
      reward: 100,
      maxCompletions: 10,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000)
    });

    // 激活任务
    await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 并发执行：100个用户同时尝试完成任务
    const userIds = Array.from({ length: 100 }, (_, i) => `user_${i}`);
    
    const promises = userIds.map(userId => 
      taskService.completeTask(task.id, userId).catch(err => err)
    );

    const results = await Promise.all(promises);

    // 统计成功和失败的数量
    const successes = results.filter(r => !(r instanceof Error));
    const failures = results.filter(r => r instanceof Error);

    // ✅ 期望：只有10个成功，90个失败
    expect(successes.length).toBe(10);
    expect(failures.length).toBe(90);
    
    // ✅ 期望：currentCompletions 正好是 10
    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBe(10);
  });
});
```

### 测试场景 2: 高并发压力测试

**目标**: 在极高并发下验证系统稳定性

```typescript
it('should handle high concurrency pressure', async () => {
  const task = await createTestTask({ maxCompletions: 5 });
  
  // 使用更激进的并发策略
  const concurrentBatches = 20;
  const usersPerBatch = 50;
  
  const allPromises = [];
  
  for (let batch = 0; batch < concurrentBatches; batch++) {
    const batchPromises = Array.from({ length: usersPerBatch }, (_, i) => {
      const userId = `batch_${batch}_user_${i}`;
      return taskService.completeTask(task.id, userId).catch(err => err);
    });
    allPromises.push(...batchPromises);
  }

  const results = await Promise.all(allPromises);
  const successes = results.filter(r => !(r instanceof Error));

  // ✅ 即使1000个请求并发，也不应该超过5个成功
  expect(successes.length).toBeLessThanOrEqual(5);
});
```

### 测试场景 3: 边界条件测试

```typescript
it('should handle boundary conditions correctly', async () => {
  // 测试 maxCompletions = 1 的极端情况
  const task = await createTestTask({ maxCompletions: 1 });
  
  const [result1, result2] = await Promise.all([
    taskService.completeTask(task.id, 'user_1').catch(err => err),
    taskService.completeTask(task.id, 'user_2').catch(err => err)
  ]);

  // ✅ 只有一个应该成功
  const successCount = [result1, result2].filter(r => !(r instanceof Error)).length;
  expect(successCount).toBe(1);
});
```

### 测试场景 4: 时序测试

```typescript
it('should detect race condition in timing attack', async () => {
  const task = await createTestTask({ maxCompletions: 10 });
  
  // 故意创建延迟来放大竞态条件
  const delayedComplete = async (userId: string, delayMs: number) => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return taskService.completeTask(task.id, userId).catch(err => err);
  };

  // 所有请求几乎同时到达
  const promises = Array.from({ length: 20 }, (_, i) => 
    delayedComplete(`user_${i}`, Math.random() * 10)
  );

  const results = await Promise.all(promises);
  const successes = results.filter(r => !(r instanceof Error));

  // ✅ 即使有随机延迟，也不应该超过限制
  expect(successes.length).toBeLessThanOrEqual(10);
});
```

---

## 🔧 修复方案建议

### 方案 1: 使用 Mutex 锁（推荐）✅

**优点**: 
- 实现简单，易于理解
- 完全消除竞态条件
- 与 AccountModel 实现一致

**缺点**:
- 可能影响性能（但对于任务完成操作，性能影响可接受）

**实现步骤**:

```typescript
// 1. 安装 async-mutex
// npm install async-mutex

// 2. 在 TaskModel 中添加 Mutex
import { Mutex } from 'async-mutex';

export class TaskModel {
  private taskMutexes: Map<string, Mutex> = new Map();

  private getMutex(taskId: string): Mutex {
    if (!this.taskMutexes.has(taskId)) {
      this.taskMutexes.set(taskId, new Mutex());
    }
    return this.taskMutexes.get(taskId)!;
  }

  private async withLock<T>(taskId: string, operation: () => T | Promise<T>): Promise<T> {
    const mutex = this.getMutex(taskId);
    const release = await mutex.acquire();
    try {
      return await operation();
    } finally {
      release();
    }
  }

  // 3. 修改 createCompletion 方法
  async createCompletion(taskId: string, userId: string): Promise<TaskCompletion> {
    return this.withLock(taskId, () => {
      const task = this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // 检查任务状态
      if (task.status !== TaskStatus.ACTIVE) {
        throw new Error('Task is not active');
      }

      // 检查时间
      const now = new Date();
      if (now < task.startTime || now > task.endTime) {
        throw new Error('Task is not within the valid time range');
      }

      // ✅ 原子操作：检查 + 创建 + 更新
      if (task.currentCompletions >= task.maxCompletions) {
        throw new Error('Task has reached maximum completions');
      }

      if (this.hasUserCompleted(userId, taskId)) {
        throw new Error('User has already completed this task');
      }

      const completionId = `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const completion: TaskCompletion = {
        id: completionId,
        taskId,
        userId,
        reward: task.reward,
        status: TaskCompletionStatus.APPROVED,
        completedAt: new Date()
      };

      this.completions.set(completionId, completion);

      if (!this.userTaskCompletions.has(userId)) {
        this.userTaskCompletions.set(userId, new Set());
      }
      this.userTaskCompletions.get(userId)!.add(taskId);

      // ✅ 在锁保护下更新
      task.currentCompletions++;

      return completion;
    });
  }
}
```

### 方案 2: 使用乐观锁（替代方案）

**优点**:
- 性能更好（在低冲突场景下）
- 不需要等待锁

**缺点**:
- 实现更复杂
- 需要重试机制
- 需要添加版本号字段

**实现步骤**:

```typescript
// 1. 在 Task 接口中添加版本号
export interface Task {
  // ... 其他字段
  version: number;  // ✅ 添加版本号
}

// 2. 创建任务时初始化版本号
createTask(params: { /* ... */ }): Task {
  const task: Task = {
    // ... 其他字段
    version: 0,  // ✅ 初始版本号
  };
  return task;
}

// 3. 实现乐观锁更新
createCompletion(taskId: string, userId: string): TaskCompletion {
  // 最多重试3次
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const expectedVersion = task.version;

    // 检查条件
    if (task.currentCompletions >= task.maxCompletions) {
      throw new Error('Task has reached maximum completions');
    }

    if (this.hasUserCompleted(userId, taskId)) {
      throw new Error('User has already completed this task');
    }

    // ✅ CAS 操作：验证版本号并更新
    if (task.version !== expectedVersion) {
      retries++;
      continue;  // 重试
    }

    // 创建完成记录
    const completion = this.doCreateCompletion(taskId, userId, task);
    
    // ✅ 原子更新版本号
    task.version++;
    task.currentCompletions++;

    return completion;
  }

  throw new Error('Failed to create completion after retries');
}
```

### 方案 3: 使用数据库事务（如果使用数据库）

如果未来迁移到数据库（PostgreSQL、MySQL等），应该使用数据库事务：

```sql
BEGIN TRANSACTION;

-- 检查并锁定任务行
SELECT current_completions, max_completions 
FROM tasks 
WHERE id = ? 
FOR UPDATE;  -- ✅ 行级锁

-- 检查是否超限
-- 创建完成记录
INSERT INTO task_completions ...;

-- 更新任务完成次数
UPDATE tasks SET current_completions = current_completions + 1 WHERE id = ?;

COMMIT;
```

---

## 📊 性能影响评估

### 方案对比

| 方案 | 性能影响 | 实现复杂度 | 可靠性 | 推荐度 |
|------|---------|-----------|--------|--------|
| Mutex 锁 | ⚠️ 中等（串行化） | ✅ 低 | ✅ 高 | ⭐⭐⭐⭐⭐ |
| 乐观锁 | ✅ 低（重试成本低） | ⚠️ 中 | ✅ 高 | ⭐⭐⭐⭐ |
| 数据库事务 | ⚠️ 中等 | ⚠️ 高 | ✅ 最高 | ⭐⭐⭐ |

### 性能测试建议

```typescript
// 性能测试：1000个并发请求
it('performance test with mutex', async () => {
  const start = Date.now();
  
  const promises = Array.from({ length: 1000 }, (_, i) =>
    taskService.completeTask(taskId, `user_${i}`).catch(() => {})
  );
  
  await Promise.all(promises);
  
  const duration = Date.now() - start;
  console.log(`1000 concurrent completions took ${duration}ms`);
  
  // ✅ 期望：即使有锁，1000个请求也应该在合理时间内完成
  expect(duration).toBeLessThan(5000);  // 5秒
});
```

---

## 🎯 推荐行动计划

### 立即执行（P0）

1. ✅ **实现 Mutex 锁机制**
   - 参考 AccountModel 实现
   - 为每个任务添加独立的 Mutex
   - 将 createCompletion 改为异步方法

2. ✅ **添加版本号字段**
   - 在 Task 接口添加 version 字段
   - 作为额外的安全措施

3. ✅ **编写并发测试**
   - 实现上述所有测试用例
   - 确保测试覆盖各种并发场景

### 短期执行（P1）

4. ✅ **代码审查**
   - 检查其他类似的并发问题
   - 审查所有涉及计数器的操作

5. ✅ **性能测试**
   - 在生产环境进行压力测试
   - 监控锁等待时间

### 长期执行（P2）

6. ✅ **监控和告警**
   - 添加 currentCompletions 超限告警
   - 记录并发冲突事件

7. ✅ **文档更新**
   - 更新开发者文档
   - 添加并发编程最佳实践指南

---

## 📝 总结

### 关键发现

1. ⚠️ **严重并发漏洞**: TaskModel.createCompletion() 存在竞态条件
2. ✅ **参考实现可用**: AccountModel 提供了成熟的并发控制方案
3. ⚠️ **影响范围广**: 所有限量任务都受影响

### 修复优先级

- 🔴 **立即修复**: 添加 Mutex 锁机制
- 🟡 **尽快完成**: 编写并发测试用例
- 🟢 **持续改进**: 监控和性能优化

### 预期效果

修复后：
- ✅ 完全消除竞态条件
- ✅ 保证 maxCompletions 限制严格生效
- ✅ 系统在高并发场景下稳定运行
- ✅ 代码质量与 AccountModel 保持一致

---

## 📚 参考资料

- [MDN: Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [async-mutex 库文档](https://github.com/DirtyHairy/async-mutex)
- [Node.js 并发编程最佳实践](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- [数据库事务隔离级别](https://www.postgresql.org/docs/current/transaction-iso.html)

---

**报告状态**: ✅ 完成  
**下一步**: 等待开发团队评审并实施修复方案
