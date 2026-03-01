# 【P1 - 并发安全】任务完成次数并发问题分析报告

**Issue**: #238 (重复 #235)  
**优先级**: P1 - 高  
**分析日期**: 2026-03-01  
**分析人员**: 质量工程师

---

## 📋 执行摘要

在高并发场景下，`TaskModel.createCompletion()` 方法存在严重的竞态条件（Race Condition），可能导致任务完成次数超过 `maxCompletions` 限制，从而多发放奖励。

**风险等级**: 🔴 **严重（Critical）**
**影响范围**: 所有活跃任务的完成逻辑
**修复优先级**: P0（立即修复）

---

## 🔍 问题详细分析

### 1. 问题代码定位

**文件**: `src/models/Task.ts`  
**方法**: `createCompletion()`  
**行数**: 第 85-125 行

```typescript
// 第 88 行：检查完成次数
if (task.currentCompletions >= task.maxCompletions) {
  throw new Error('Task has reached maximum completions');
}

// ... 其他验证逻辑 ...

// 第 123 行：更新任务完成次数
task.currentCompletions++;

return completion;
```

### 2. 并发风险详解

#### ⚠️ 核心问题：检查-执行（Check-Then-Act）不是原子操作

```typescript
// 步骤 1: 检查（第 88 行）
if (task.currentCompletions >= task.maxCompletions) {
  throw new Error('...');
}

// ⚠️ 危险窗口：在这两步之间，其他线程可能修改 currentCompletions

// 步骤 2: 执行（第 123 行）
task.currentCompletions++;
```

#### 🔄 竞态条件时间线

假设 `maxCompletions = 100`，`currentCompletions = 99`：

| 时间 | 线程 A | 线程 B | currentCompletions | 结果 |
|------|--------|--------|-------------------|------|
| T1 | 检查: 99 < 100 ✅ | - | 99 | 通过检查 |
| T2 | - | 检查: 99 < 100 ✅ | 99 | 通过检查 |
| T3 | currentCompletions++ | - | 100 | 正常 |
| T4 | - | currentCompletions++ | 101 | ❌ **超过限制！** |
| T5 | 发放奖励 | - | - | ✅ |
| T6 | - | 发放奖励 | - | ❌ **多发放一次奖励** |

**最终结果**：
- ❌ 实际完成次数：101（超过限制 1 次）
- ❌ 多发放奖励：1 次
- ❌ 数据一致性被破坏

### 3. 其他并发风险点

#### 3.1 用户重复完成检查（第 100-102 行）

```typescript
// 检查用户是否已完成（每个用户只能完成一次）
if (this.hasUserCompleted(userId, taskId)) {
  throw new Error('User has already completed this task');
}
```

**风险**：同一用户可能在极短时间内发起两次请求，都通过此检查。

#### 3.2 服务层检查（task.service.ts 第 99-101 行）

```typescript
// 检查完成次数
if (task.currentCompletions >= task.maxCompletions) {
  throw new Error('任务已完成次数已达上限');
}
```

**风险**：服务层的检查和模型的检查之间也存在时间窗口。

---

## ✅ 参考实现：Account.ts 的并发控制机制

`Account.ts` 已经实现了完善的并发控制，可作为参考：

### 1. 使用 Mutex 锁（第 18-32 行）

```typescript
import { Mutex } from 'async-mutex';

export class AccountModel {
  private accountMutexes: Map<string, Mutex> = new Map();

  private getMutex(userId: string): Mutex {
    if (!this.accountMutexes.has(userId)) {
      this.accountMutexes.set(userId, new Mutex());
    }
    return this.accountMutexes.get(userId)!;
  }

  private async withLock<T>(userId: string, operation: () => T | Promise<T>): Promise<T> {
    const mutex = this.getMutex(userId);
    const release = await mutex.acquire();
    try {
      return await operation();
    } finally {
      release();
    }
  }
}
```

**优点**：
- ✅ 确保同一资源的操作串行化
- ✅ 使用成熟的 `async-mutex` 库，避免 busy wait
- ✅ 自动释放锁（try-finally）

### 2. 版本号乐观锁（第 34-47 行）

```typescript
private validateAndUpdateBalance(
  account: Account,
  expectedVersion: number,
  updateFn: () => void
): void {
  if (account.version !== expectedVersion) {
    throw new Error(
      `Concurrent modification detected for account ${account.userId}. ` +
      `Expected version ${expectedVersion}, but got ${account.version}`
    );
  }
  updateFn();
  account.version = (account.version || 0) + 1;
  account.updatedAt = new Date();
}
```

**优点**：
- ✅ 检测并发修改
- ✅ 抛出明确的错误信息
- ✅ 数据一致性保障

### 3. 原子操作示例（第 148-159 行）

```typescript
async addBalance(userId: string, amount: number, ...): Promise<Transaction> {
  return this.withLock(userId, async () => {
    const account = await this.getOrCreateAccount(userId);
    const currentVersion = account.version || 0;

    this.validateAndUpdateBalance(account, currentVersion, () => {
      account.balance += amount;  // 原子操作
      if (type !== TransactionType.PENALTY) {
        account.totalEarned = (account.totalEarned || 0) + amount;
      }
    });

    // ... 创建交易记录 ...
  });
}
```

**关键点**：
- ✅ 锁 + 版本号双重保障
- ✅ 检查和更新在同一个临界区内

---

## 🛠️ 修复方案

### 方案一：添加 Mutex 锁（推荐）

**优点**：
- ✅ 简单直接，与 Account.ts 保持一致
- ✅ 性能开销小（每个任务一个锁）
- ✅ 完全避免竞态条件

**缺点**：
- ⚠️ 需要引入 `async-mutex` 库（已存在）
- ⚠️ 需要将方法改为异步

**实现代码**：

```typescript
import { Mutex } from 'async-mutex';

export class TaskModel {
  private tasks: Map<string, Task> = new Map();
  private completions: Map<string, TaskCompletion> = new Map();
  private userTaskCompletions: Map<string, Set<string>> = new Map();
  
  // ✅ 添加任务级别的锁
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

  /**
   * 创建任务完成记录（带锁）
   */
  async createCompletion(taskId: string, userId: string): Promise<TaskCompletion> {
    return this.withLock(taskId, async () => {
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

      // ✅ 原子操作：检查 + 增加
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

      // ✅ 在锁内更新，确保原子性
      task.currentCompletions++;

      return completion;
    });
  }
}
```

### 方案二：使用版本号乐观锁

**优点**：
- ✅ 无需等待锁，性能更好
- ✅ 自动检测并发冲突

**缺点**：
- ⚠️ 冲突时需要重试逻辑
- ⚠️ 实现相对复杂

**实现代码**：

```typescript
export class TaskModel {
  private tasks: Map<string, Task> = new Map();
  
  /**
   * 创建任务完成记录（带版本控制）
   */
  async createCompletion(taskId: string, userId: string): Promise<TaskCompletion> {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      const task = this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const currentVersion = task.version || 0;

      // 检查条件
      if (task.status !== TaskStatus.ACTIVE) {
        throw new Error('Task is not active');
      }

      const now = new Date();
      if (now < task.startTime || now > task.endTime) {
        throw new Error('Task is not within the valid time range');
      }

      if (task.currentCompletions >= task.maxCompletions) {
        throw new Error('Task has reached maximum completions');
      }

      if (this.hasUserCompleted(userId, taskId)) {
        throw new Error('User has already completed this task');
      }

      // 尝试更新（CAS 操作）
      if (this.updateTaskCompletion(taskId, currentVersion, task.currentCompletions + 1)) {
        // 更新成功，创建完成记录
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

        return completion;
      }

      // 更新失败，重试
      retries++;
      await new Promise(resolve => setTimeout(resolve, 10)); // 短暂延迟
    }

    throw new Error('Failed to create completion after maximum retries');
  }

  /**
   * CAS 操作：更新任务完成次数
   */
  private updateTaskCompletion(taskId: string, expectedVersion: number, newCompletions: number): boolean {
    const task = this.getTask(taskId);
    if (!task) return false;

    if (task.version !== expectedVersion) {
      return false; // 版本不匹配，说明已被其他线程修改
    }

    task.currentCompletions = newCompletions;
    task.version = (task.version || 0) + 1;
    task.updatedAt = new Date();
    
    return true;
  }
}
```

### 方案三：双重检查（Mutex + 版本号）

**优点**：
- ✅ 最高级别的并发安全保障
- ✅ 锁 + 版本号双重验证

**缺点**：
- ⚠️ 实现最复杂
- ⚠️ 可能过度设计（对于当前场景）

---

## 🧪 并发测试用例设计

### 测试 1：并发完成次数限制测试

**目标**：验证在并发场景下，任务完成次数不会超过 `maxCompletions`

**测试代码**：

```typescript
import { taskModel } from '../models/Task';
import { TaskStatus } from '../types';

describe('Task Concurrency Tests', () => {
  it('should not exceed maxCompletions under concurrent access', async () => {
    // 创建任务，maxCompletions = 10
    const task = taskModel.createTask({
      title: '并发测试任务',
      description: '测试并发完成',
      reward: 100,
      maxCompletions: 10,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000)
    });

    // 激活任务
    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 模拟 20 个用户并发完成
    const userIds = Array.from({ length: 20 }, (_, i) => `user_${i}`);
    
    const promises = userIds.map(userId => 
      taskModel.createCompletion(task.id, userId).catch(err => err)
    );

    const results = await Promise.all(promises);

    // 统计成功和失败的数量
    const successes = results.filter(r => !(r instanceof Error)).length;
    const failures = results.filter(r => r instanceof Error).length;

    console.log('成功:', successes);
    console.log('失败:', failures);

    // 验证：成功次数应该等于 maxCompletions
    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBe(10);
    expect(successes).toBe(10);
    expect(failures).toBe(10);
  });

  it('should prevent duplicate completions from same user', async () => {
    const task = taskModel.createTask({
      title: '重复完成测试',
      description: '测试用户重复完成',
      reward: 50,
      maxCompletions: 100,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000)
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    const userId = 'test_user_123';

    // 第一次完成应该成功
    const completion1 = await taskModel.createCompletion(task.id, userId);
    expect(completion1).toBeDefined();

    // 第二次完成应该失败
    await expect(
      taskModel.createCompletion(task.id, userId)
    ).rejects.toThrow('User has already completed this task');
  });

  it('should handle high concurrency with 1000 simultaneous requests', async () => {
    const task = taskModel.createTask({
      title: '高并发测试',
      description: '测试 1000 个并发请求',
      reward: 10,
      maxCompletions: 100,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000)
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 1000 个并发请求
    const promises = Array.from({ length: 1000 }, (_, i) => 
      taskModel.createCompletion(task.id, `user_${i}`).catch(err => err)
    );

    const results = await Promise.all(promises);
    const successes = results.filter(r => !(r instanceof Error)).length;

    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBeLessThanOrEqual(100);
    expect(successes).toBeLessThanOrEqual(100);

    console.log(`并发测试结果: ${successes}/1000 成功`);
  });
});
```

### 测试 2：压力测试

**目标**：验证在高负载下的稳定性

```typescript
describe('Task Stress Tests', () => {
  it('should maintain consistency under stress', async () => {
    const task = taskModel.createTask({
      title: '压力测试',
      description: '持续压力测试',
      reward: 1,
      maxCompletions: 1000,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000)
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 分批执行，每批 100 个
    const batches = 10;
    const batchSize = 100;
    let totalSuccess = 0;

    for (let batch = 0; batch < batches; batch++) {
      const promises = Array.from({ length: batchSize }, (_, i) => 
        taskModel.createCompletion(task.id, `batch_${batch}_user_${i}`).catch(err => err)
      );

      const results = await Promise.all(promises);
      totalSuccess += results.filter(r => !(r instanceof Error)).length;
    }

    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBe(totalSuccess);
    expect(finalTask!.currentCompletions).toBeLessThanOrEqual(1000);

    console.log(`压力测试结果: ${totalSuccess} 次成功完成`);
  });
});
```

---

## 📊 风险评估

### 影响范围
- ✅ **直接影响**: 所有使用 `taskModel.createCompletion()` 的代码
- ✅ **间接影响**: 任务奖励发放、账户余额、交易记录

### 严重程度
| 维度 | 评分 | 说明 |
|------|------|------|
| **数据一致性** | 🔴 严重 | 可能导致超额发放奖励 |
| **财务影响** | 🔴 严重 | 直接影响代币发行量 |
| **用户体验** | 🟡 中等 | 极少数用户可能受益（多拿奖励） |
| **系统稳定性** | 🟢 低 | 不会导致系统崩溃 |

### 触发概率
- **低并发场景**: < 0.01%（几乎不可能）
- **中并发场景**: ~1-5%（可能发生）
- **高并发场景**: > 50%（极可能发生）

### 业务影响
```
假设场景：
- 任务奖励: 100 金币
- maxCompletions: 100
- 并发用户: 200 人

最坏情况：
- 实际完成: 101-110 次（超额 1-10%）
- 多发放奖励: 100-1000 金币
- 财务损失: 取决于代币价值
```

---

## 🎯 修复优先级与时间估算

### 优先级: P0（立即修复）

**原因**：
1. 直接影响财务数据
2. 可能被恶意利用（刷奖励）
3. 修复方案明确且可行

### 时间估算

| 任务 | 预计时间 | 说明 |
|------|---------|------|
| 实现修复代码 | 2 小时 | 添加 Mutex 锁 |
| 编写单元测试 | 2 小时 | 并发测试用例 |
| 代码审查 | 1 小时 | 团队审查 |
| 测试环境验证 | 2 小时 | 压力测试 |
| **总计** | **7 小时** | 1 个工作日 |

---

## 📝 修复检查清单

- [ ] 在 `TaskModel` 中添加 `taskMutexes` Map
- [ ] 实现 `getMutex()` 和 `withLock()` 方法
- [ ] 修改 `createCompletion()` 为异步方法
- [ ] 更新 `task.service.ts` 中的调用（添加 await）
- [ ] 添加版本号字段到 Task 类型定义
- [ ] 编写并发测试用例
- [ ] 执行压力测试验证
- [ ] 更新 API 文档
- [ ] Code Review
- [ ] 部署到测试环境
- [ ] 监控生产环境

---

## 🔄 后续改进建议

### 1. 统一并发控制机制
- 考虑创建通用的 `ConcurrencyManager` 类
- 所有模型使用相同的并发控制策略

### 2. 添加监控和告警
```typescript
// 监控并发冲突
if (task.currentCompletions > task.maxCompletions) {
  logger.error('Concurrency control failed', {
    taskId: task.id,
    currentCompletions: task.currentCompletions,
    maxCompletions: task.maxCompletions
  });
  // 触发告警
  alertService.sendAlert('critical', 'Task completion overflow detected');
}
```

### 3. 数据库层面约束
如果未来迁移到数据库，添加唯一约束：
```sql
ALTER TABLE task_completions 
ADD CONSTRAINT unique_user_task 
UNIQUE (user_id, task_id);
```

### 4. 定期审计
- 每日检查任务完成次数是否超过限制
- 定期对账任务奖励发放记录

---

## 📚 参考资料

1. **async-mutex 库文档**: https://github.com/DirtyHairy/async-mutex
2. **并发控制模式**: https://martinfowler.com/articles/patterns-of-distributed-systems/
3. **Account.ts 实现**: `src/models/Account.ts` (第 18-32 行)
4. **Issue #200**: 账户余额并发修复案例

---

## ✅ 总结

**问题**: 任务完成次数检查和增加不是原子操作，存在竞态条件  
**风险**: 可能导致任务超额完成，多发放奖励  
**修复方案**: 参考 Account.ts，添加 Mutex 锁确保原子性  
**优先级**: P0（立即修复）  
**预计时间**: 1 个工作日  

**下一步行动**:
1. 创建修复分支
2. 实现 Mutex 锁机制
3. 编写并发测试
4. 提交 PR 并进行代码审查
5. 部署到测试环境验证
6. 合并到主分支

---

**分析完成时间**: 2026-03-01 02:15  
**文档版本**: v1.0  
**审核状态**: 待审核
