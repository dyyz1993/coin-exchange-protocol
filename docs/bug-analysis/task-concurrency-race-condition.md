# 🔴 Bug 分析报告：TaskModel 并发竞态条件

**Issue**: #302  
**优先级**: P1 - 高  
**严重性**: 高（可能导致资金损失）  
**分析日期**: 2026-03-01  
**分析人员**: 质量工程师

---

## 📋 问题描述

### 问题位置
- **文件**: `src/models/Task.ts`
- **方法**: `createCompletion()` (第 104-147 行)
- **关键代码**: 第 121 行（检查）和第 145 行（更新）

### 竞态条件分析

```typescript
// 第 121 行：读取检查
if (task.currentCompletions >= task.maxCompletions) {
  throw new Error('Task has reached maximum completions');
}

// ... 其他操作 ...

// 第 145 行：修改写入
task.currentCompletions++;
```

**问题**：检查和更新操作之间存在时间窗口，不是原子操作。

---

## 🔍 竞态条件场景

### 场景 1: 超额完成

假设 `maxCompletions = 10`，当前 `currentCompletions = 9`

```
时间线：
T1: 用户A 读取 currentCompletions (9) < maxCompletions (10) ✓
T2: 用户B 读取 currentCompletions (9) < maxCompletions (10) ✓
T3: 用户A 执行 currentCompletions++ → 10
T4: 用户B 执行 currentCompletions++ → 11 ❌
```

**结果**: 任务被完成了 11 次，超额发放 1 次奖励

### 场景 2: 多用户并发

假设 10 个用户同时完成一个 `maxCompletions = 5` 的任务：

```
预期：5 个成功，5 个失败
实际：可能 6-8 个成功（取决于并发程度）
```

**结果**: 超额发放 100-300 金币（假设每个任务奖励 100 金币）

---

## 🎯 影响评估

### 1. 资金风险 🔴 高
- **超额发放奖励**: 每次竞态可能导致多发放 `reward` 数量的金币
- **累计风险**: 高并发场景下，可能同时触发多次，造成批量资金损失
- **示例**: 100 个并发请求，maxCompletions=10，可能实际完成 15-20 次

### 2. 数据不一致 🟡 中
- `currentCompletions` 超过 `maxCompletions`
- 任务状态与实际完成次数不匹配
- 统计数据错误

### 3. 业务逻辑失效 🔴 高
- 限量任务不再限量
- 奖励预算超支
- 公平性受损（应该失败的请求成功了）

### 4. 发生概率 🟡 中-高
- **单进程单线程**: 较低（JS 事件循环特性）
- **多进程/集群**: 高（Node.js cluster 模式）
- **分布式系统**: 极高（微服务架构）

---

## ✅ 验证结果

### 测试用例
已创建并发测试用例：`src/tests/concurrency/taskConcurrency.test.ts`

### 测试方法
```bash
npm test -- taskConcurrency.test.ts
```

### 预期结果（存在 Bug）
```
🔴 BUG CONFIRMED: Task completions exceeded maxCompletions!
  Expected max: 5, Actual: 6-8
  Over-issued rewards: 100-300 coins
```

---

## 🛠️ 修复方案

### 方案 1: 使用 Mutex 锁 ⭐ 推荐

**优点**: 
- 简单直接
- 100% 避免竞态
- 适用于单进程

**缺点**:
- 多进程需要分布式锁
- 性能有轻微影响

**实现**:
```typescript
import { Mutex } from 'async-mutex';

export class TaskModel {
  private taskMutexes: Map<string, Mutex> = new Map();

  async createCompletion(taskId: string, userId: string): Promise<TaskCompletion> {
    // 为每个任务获取独立的锁
    if (!this.taskMutexes.has(taskId)) {
      this.taskMutexes.set(taskId, new Mutex());
    }
    
    const mutex = this.taskMutexes.get(taskId)!;
    const release = await mutex.acquire();
    
    try {
      // 原有的业务逻辑
      const task = this.getTask(taskId);
      if (!task) throw new Error('Task not found');
      
      if (task.currentCompletions >= task.maxCompletions) {
        throw new Error('Task has reached maximum completions');
      }
      
      // ... 其他检查 ...
      
      task.currentCompletions++;
      // ... 创建完成记录 ...
      
      return completion;
    } finally {
      release();
    }
  }
}
```

### 方案 2: 使用乐观锁

**优点**:
- 无锁设计，性能好
- 适用于读多写少场景

**缺点**:
- 需要重试机制
- 高并发时重试次数多

**实现**:
```typescript
createCompletion(taskId: string, userId: string): TaskCompletion {
  const task = this.getTask(taskId);
  if (!task) throw new Error('Task not found');
  
  // 使用版本号或 CAS (Compare-And-Swap)
  const expectedVersion = task.version;
  
  // 检查条件
  if (task.currentCompletions >= task.maxCompletions) {
    throw new Error('Task has reached maximum completions');
  }
  
  // 原子更新（需要底层支持）
  const updated = this.atomicUpdateTask(taskId, {
    currentCompletions: task.currentCompletions + 1,
    version: expectedVersion + 1
  }, expectedVersion);
  
  if (!updated) {
    // 版本不匹配，说明被其他请求修改了
    throw new Error('Task was modified, please retry');
  }
  
  // ... 创建完成记录 ...
}
```

### 方案 3: 使用数据库原子操作 ⭐⭐ 最佳（如果有数据库）

**优点**:
- 原生支持事务和锁
- 分布式安全
- 可靠性高

**实现**:
```sql
-- 使用数据库事务和行锁
BEGIN TRANSACTION;

SELECT * FROM tasks WHERE id = ? FOR UPDATE; -- 行锁

-- 检查并更新
UPDATE tasks 
SET current_completions = current_completions + 1 
WHERE id = ? 
  AND current_completions < max_completions;

-- 如果影响行数为 0，说明超限
COMMIT;
```

---

## 📊 方案对比

| 方案 | 复杂度 | 性能 | 单进程 | 多进程 | 分布式 | 推荐度 |
|------|--------|------|--------|--------|--------|--------|
| Mutex 锁 | 低 | 中 | ✅ | ❌ | ❌ | ⭐⭐⭐ |
| 乐观锁 | 中 | 高 | ✅ | ✅ | ⚠️ | ⭐⭐ |
| 数据库锁 | 中 | 中 | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| 分布式锁 | 高 | 低 | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ |

---

## 🎯 推荐方案

### 短期修复（立即实施）
**方案 1: Mutex 锁** 
- 适合当前单进程架构
- 快速上线，风险低
- 修改文件: `src/models/Task.ts`

### 长期方案（架构优化）
**方案 3: 数据库事务**
- 如果未来引入数据库（PostgreSQL/MySQL）
- 使用 `SELECT ... FOR UPDATE` 行锁
- 完全避免竞态，支持分布式

---

## 📝 实施步骤

### 1. 添加依赖
```bash
npm install async-mutex
npm install --save-dev @types/async-mutex
```

### 2. 修改代码
- 文件: `src/models/Task.ts`
- 添加 `taskMutexes: Map<string, Mutex>`
- 修改 `createCompletion()` 为异步方法
- 在方法开头获取锁，结束时释放

### 3. 更新调用方
- 所有调用 `createCompletion()` 的地方
- 改为 `await taskModel.createCompletion(...)`

### 4. 测试验证
```bash
# 运行并发测试
npm test -- taskConcurrency.test.ts

# 确认修复后，完成次数不会超过 maxCompletions
```

### 5. 部署监控
- 监控 `currentCompletions > maxCompletions` 的情况
- 添加告警规则

---

## 🔒 预防措施

### 1. 代码审查清单
- [ ] 所有读-改-写操作是否原子化？
- [ ] 是否使用了适当的锁机制？
- [ ] 并发测试是否覆盖？

### 2. 架构建议
- 优先使用数据库事务处理关键业务
- 避免在内存中进行关键状态管理
- 考虑引入消息队列串行化请求

### 3. 测试要求
- 所有涉及状态修改的方法必须有并发测试
- 使用压力测试工具（如 Artillery）模拟高并发

---

## 📌 相关资源

- Issue #302: 任务完成并发竞态条件
- 测试文件: `src/tests/concurrency/taskConcurrency.test.ts`
- 参考实现: `src/models/Account.ts` (已使用 Mutex)

---

## ✍️ 签名

**质量工程师**  
*专注于发现和修复代码缺陷*  
📅 2026-03-01
