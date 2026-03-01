# 任务完成次数并发安全问题分析报告

**Issue**: #238 (重复 #235)  
**优先级**: P1 - 高危  
**创建时间**: 2026-03-01  
**负责人**: 质量工程师

---

## 📋 执行摘要

在高并发场景下，多个用户同时完成任务时，`TaskModel.createCompletion()` 方法存在竞态条件（Race Condition），可能导致任务完成次数超过 `maxCompletions` 限制，造成超发奖励。

**风险等级**: 🔴 **严重** - 可能导致资金损失和系统不一致

---

## 🔍 问题详细分析

### 1. 并发风险代码位置

**文件**: `src/models/Task.ts`  
**方法**: `createCompletion()` (第 88-133 行)

### 2. 风险代码片段

```typescript
createCompletion(taskId: string, userId: string): TaskCompletion {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // ⚠️ 风险点1: 检查完成次数
    if (task.currentCompletions >= task.maxCompletions) {
      throw new Error('Task has reached maximum completions');
    }

    // ... 创建完成记录 ...

    // ⚠️ 风险点2: 增加完成次数
    task.currentCompletions++;

    return completion;
}
```

### 3. 并发场景复现

**假设条件**:
- 任务最大完成次数: `maxCompletions = 10`
- 当前完成次数: `currentCompletions = 9`
- 同时有 3 个用户（A、B、C）提交完成请求

**时间线分析**:

| 时间 | 线程A (用户A) | 线程B (用户B) | 线程C (用户C) | currentCompletions |
|------|---------------|---------------|---------------|---------------------|
| T1 | 读取 task | - | - | 9 |
| T2 | 检查 9 < 10 ✅ | 读取 task | - | 9 |
| T3 | 创建记录 | 检查 9 < 10 ✅ | 读取 task | 9 |
| T4 | currentCompletions++ (10) | 创建记录 | 检查 9 < 10 ✅ | 10 |
| T5 | 返回成功 | currentCompletions++ (11) | 创建记录 | 11 ❌ |
| T6 | - | 返回成功 | currentCompletions++ (12) | 12 ❌ |

**结果**: 
- ❌ 最终完成次数: 12（超过限制 10）
- ❌ 超发奖励: 2 个用户获得了不应该发放的奖励

### 4. 根本原因

1. **检查-执行非原子性**: 检查（`if`）和增加（`++`）操作之间存在时间窗口
2. **缺少并发控制**: 没有使用锁机制保护共享资源（`task.currentCompletions`）
3. **共享状态竞争**: 多个线程同时读写同一个 `task` 对象

---

## 🔬 代码审查发现

### TaskModel 的问题

**src/models/Task.ts**

```typescript
export class TaskModel {
  private tasks: Map<string, Task> = new Map();
  private completions: Map<string, TaskCompletion> = new Map();
  private userTaskCompletions: Map<string, Set<string>> = new Map();

  // ❌ 缺少并发控制机制
  // ❌ 没有 Mutex 或锁
  // ❌ 没有版本号（乐观锁）
}
```

### AccountModel 的正确实现（参考）

**src/models/Account.ts**

```typescript
export class AccountModel {
  // ✅ 使用 async-mutex 保护并发
  private accountMutexes: Map<string, Mutex> = new Map();

  // ✅ 使用版本号实现乐观锁
  private validateAndUpdateBalance(
    account: Account,
    expectedVersion: number,
    updateFn: () => void
  ): void {
    if (account.version !== expectedVersion) {
      throw new Error('Concurrent modification detected');
    }
    updateFn();
    account.version++;
  }

  // ✅ 使用锁包装器
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

---

## 🎯 修复方案

### 方案1: 使用 Mutex（推荐）

**优点**:
- 简单直接，易于实现
- 完全避免竞态条件
- 与现有 AccountModel 实现一致

**缺点**:
- 需要引入 `async-mutex` 依赖（已存在）
- 并发性能略有降低（但任务完成操作不需要高并发）

**实现步骤**:

```typescript
import { Mutex } from 'async-mutex';

export class TaskModel {
  private tasks: Map<string, Task> = new Map();
  private completions: Map<string, TaskCompletion> = new Map();
  private userTaskCompletions: Map<string, Set<string>> = new Map();
  
  // ✅ 添加任务级别的锁
  private taskMutexes: Map<string, Mutex> = new Map();

  private getTaskMutex(taskId: string): Mutex {
    if (!this.taskMutexes.has(taskId)) {
      this.taskMutexes.set(taskId, new Mutex());
    }
    return this.taskMutexes.get(taskId)!;
  }

  private async withTaskLock<T>(taskId: string, operation: () => T | Promise<T>): Promise<T> {
    const mutex = this.getTaskMutex(taskId);
    const release = await mutex.acquire();
    try {
      return await operation();
    } finally {
      release();
    }
  }

  // ✅ 修改 createCompletion 为异步方法
  async createCompletion(taskId: string, userId: string): Promise<TaskCompletion> {
    return this.withTaskLock(taskId, () => {
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

      // 检查用户是否已完成
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

      // 记录用户完成
      if (!this.userTaskCompletions.has(userId)) {
        this.userTaskCompletions.set(userId, new Set());
      }
      this.userTaskCompletions.get(userId)!.add(taskId);

      // ✅ 在锁保护下更新完成次数
      task.currentCompletions++;

      return completion;
    });
  }
}
```

### 方案2: 使用乐观锁（版本号）

**优点**:
- 并发性能更好（无锁等待）
- 适合读多写少场景

**缺点**:
- 需要处理版本冲突重试
- 实现复杂度较高

**实现步骤**:

```typescript
// 1. 修改 Task 接口（src/types/index.ts）
export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  maxCompletions: number;
  currentCompletions: number;
  status: TaskStatus;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  version?: number; // ✅ 添加版本号
}

// 2. 修改 TaskModel
export class TaskModel {
  createTask(params: { ... }): Task {
    const task: Task = {
      // ...
      version: 0, // ✅ 初始版本号
    };
    this.tasks.set(taskId, task);
    return task;
  }

  async createCompletion(taskId: string, userId: string): Promise<TaskCompletion> {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const currentVersion = task.version || 0;

    // ✅ 验证版本号
    if (task.version !== currentVersion) {
      throw new Error('Concurrent modification detected. Please retry.');
    }

    // 检查完成次数
    if (task.currentCompletions >= task.maxCompletions) {
      throw new Error('Task has reached maximum completions');
    }

    // ... 创建完成记录 ...

    // ✅ 更新版本号
    task.currentCompletions++;
    task.version = currentVersion + 1;

    return completion;
  }
}
```

### 方案3: 使用数据库事务（长期方案）

**优点**:
- 数据一致性最强
- 支持分布式场景

**缺点**:
- 需要引入数据库
- 架构改动较大

---

## 🧪 并发测试用例设计

### 测试1: 基础并发测试

**目的**: 验证多个用户同时完成任务不会超过限制

**测试代码**:

```typescript
describe('Task Completion Concurrency', () => {
  it('should not exceed maxCompletions under concurrent access', async () => {
    // 1. 创建任务，最大完成次数=5
    const task = taskModel.createTask({
      title: 'Test Task',
      description: 'Test',
      reward: 100,
      maxCompletions: 5,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000)
    });

    // 2. 激活任务
    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 3. 模拟10个用户同时完成
    const userIds = Array.from({ length: 10 }, (_, i) => `user_${i}`);
    const promises = userIds.map(userId => 
      taskModel.createCompletion(task.id, userId)
        .then(() => ({ success: true, userId }))
        .catch(err => ({ success: false, userId, error: err.message }))
    );

    const results = await Promise.all(promises);

    // 4. 统计结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // 5. 验证
    expect(successCount).toBe(5); // ✅ 只有5个成功
    expect(failCount).toBe(5);    // ✅ 5个失败
    
    const updatedTask = taskModel.getTask(task.id);
    expect(updatedTask!.currentCompletions).toBe(5); // ✅ 不超过限制
  });
});
```

### 测试2: 压力测试

**目的**: 验证高并发场景下的稳定性

```typescript
it('should handle high concurrency (100 users)', async () => {
  const task = taskModel.createTask({
    title: 'Stress Test Task',
    description: 'Test',
    reward: 100,
    maxCompletions: 10,
    startTime: new Date(),
    endTime: new Date(Date.now() + 86400000)
  });

  taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

  // 100个用户同时完成
  const promises = Array.from({ length: 100 }, (_, i) =>
    taskModel.createCompletion(task.id, `user_${i}`)
      .then(() => 1)
      .catch(() => 0)
  );

  const results = await Promise.all(promises);
  const successCount = results.reduce((sum, r) => sum + r, 0);

  expect(successCount).toBeLessThanOrEqual(10);
  
  const updatedTask = taskModel.getTask(task.id);
  expect(updatedTask!.currentCompletions).toBeLessThanOrEqual(10);
});
```

### 测试3: 重复完成测试

**目的**: 验证同一用户不能重复完成

```typescript
it('should prevent duplicate completions', async () => {
  const task = taskModel.createTask({
    title: 'Test Task',
    description: 'Test',
    reward: 100,
    maxCompletions: 10,
    startTime: new Date(),
    endTime: new Date(Date.now() + 86400000)
  });

  taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

  // 同一用户尝试完成10次
  const promises = Array.from({ length: 10 }, () =>
    taskModel.createCompletion(task.id, 'user_1')
      .then(() => 1)
      .catch(() => 0)
  );

  const results = await Promise.all(promises);
  const successCount = results.reduce((sum, r) => sum + r, 0);

  expect(successCount).toBe(1); // ✅ 只成功一次
});
```

---

## 📊 影响范围评估

### 受影响功能

1. ✅ **任务完成接口** - `POST /api/tasks/:taskId/complete`
2. ✅ **任务奖励发放** - 可能超发奖励
3. ✅ **任务统计** - 数据不准确

### 受影响文件

- `src/models/Task.ts` - 主要修复文件
- `src/services/task.service.ts` - 需要改为异步调用
- `src/types/index.ts` - 可能需要添加版本号字段
- `src/__tests__/task.test.ts` - 需要添加并发测试

---

## 📝 修复检查清单

### 立即修复（P1）

- [ ] 在 TaskModel 中添加 Mutex 机制
- [ ] 将 `createCompletion` 改为异步方法
- [ ] 更新 task.service.ts 的调用代码
- [ ] 添加并发测试用例
- [ ] 运行测试验证修复

### 中期优化（P2）

- [ ] 考虑添加版本号（乐观锁）
- [ ] 添加监控和告警
- [ ] 优化锁粒度（如果性能有问题）

### 长期规划（P3）

- [ ] 评估引入数据库事务
- [ ] 考虑分布式锁方案（如需要）

---

## 🔗 相关资源

- **相关 Issue**: #238, #235
- **参考实现**: `src/models/Account.ts` (Mutex + 乐观锁)
- **依赖库**: `async-mutex` (已安装)
- **测试框架**: Jest

---

## 📅 时间线

- **2026-03-01**: 创建分析报告
- **待定**: 开始修复实施
- **待定**: 代码审查
- **待定**: 测试验证
- **待定**: 部署上线

---

## 👥 审批

- [ ] 开发工程师确认修复方案
- [ ] 质量工程师确认测试用例
- [ ] 开发总监审批上线

---

**报告人**: 质量工程师  
**最后更新**: 2026-03-01
