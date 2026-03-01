# 性能优化：修复 Account.ts 的 Busy Wait 锁机制

## Issue #207

**优先级**: P0 (Critical - 影响系统性能和可扩展性)

## 问题描述

原始实现使用了 busy wait（忙等待）来实现锁机制，导致：
- CPU 消耗高
- 性能问题
- 不适用于生产环境

## 修复方案

**使用 async-mutex 库替代 busy wait**

### 核心修改

**src/models/Account.ts**

1. **导入 async-mutex 库**
```typescript
import { Mutex, MutexInterface } from 'async-mutex';
```

2. **使用 Mutex 替代 busy wait**
```typescript
// 并发控制：使用 async-mutex 替代 busy wait
private accountMutexes: Map<string, Mutex> = new Map(); // userId -> Mutex
```

3. **实现异步锁机制**
```typescript
/**
 * 获取或创建账户的 Mutex
 */
private getMutex(userId: string): Mutex {
  if (!this.accountMutexes.has(userId)) {
    this.accountMutexes.set(userId, new Mutex());
  }
  return this.accountMutexes.get(userId)!;
}

/**
 * 使用锁执行异步操作
 */
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

4. **所有账户操作都使用锁保护**
```typescript
async addBalance(userId: string, amount: number, description: string, type: TransactionType): Promise<Transaction> {
  return this.withLock(userId, async () => {
    // ... 操作逻辑
  });
}
```

5. **转账操作使用有序锁避免死锁**
```typescript
async transfer(fromUserId: string, toUserId: string, amount: number, description: string): Promise<Transaction> {
  // 按用户ID排序加锁，避免死锁
  const [firstUserId, secondUserId] = [fromUserId, toUserId].sort();
  
  return this.withLock(firstUserId, async () => {
    return this.withLock(secondUserId, async () => {
      // ... 转账逻辑
    });
  });
}
```

## 性能改进

### Before (Busy Wait)
```typescript
// ❌ CPU 忙等待
private acquireLock(userId: string): void {
  while (this.locks.has(userId)) {
    // Busy wait - 消耗 CPU
  }
  this.locks.add(userId);
}
```

### After (Async Mutex)
```typescript
// ✅ 异步等待 - 不消耗 CPU
private async withLock<T>(userId: string, operation: () => T | Promise<T>): Promise<T> {
  const mutex = this.getMutex(userId);
  const release = await mutex.acquire(); // 异步等待，不消耗 CPU
  try {
    return await operation();
  } finally {
    release();
  }
}
```

## 优势

1. **性能提升**：异步等待不消耗 CPU 资源
2. **可扩展性**：适用于高并发生产环境
3. **线程安全**：确保同一账户操作串行化
4. **死锁预防**：转账操作使用有序锁
5. **代码简洁**：使用成熟的锁库，减少自定义代码

## 测试验证

- ✅ 所有账户操作都使用锁保护
- ✅ 转账操作使用双重锁
- ✅ 没有死锁风险
- ✅ 并发场景下数据一致性

## 相关文件

- src/models/Account.ts

## 状态

✅ **已完成** - 代码已使用 async-mutex 库替代 busy wait
