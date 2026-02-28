# 代码审查检查清单

> **版本**: v1.0  
> **创建时间**: 2026-02-28  
> **适用范围**: 控制器代码审查  
> **审查标准**: 参考 implementation-guide-*.md

---

## 📋 检查项总览

| 类别 | 检查项数量 | 重要性 |
|------|-----------|--------|
| 1. 输入验证检查 | 5 | ⭐⭐⭐⭐⭐ |
| 2. 并发安全检查 | 5 | ⭐⭐⭐⭐⭐ |
| 3. 错误处理检查 | 5 | ⭐⭐⭐⭐⭐ |
| 4. 事务保护检查 | 3 | ⭐⭐⭐⭐ |
| 5. API 规范检查 | 2 | ⭐⭐⭐⭐ |
| **总计** | **20** | - |

---

## 1️⃣ 输入验证检查（5项）

### ✅ 1.1 所有用户输入都经过验证
**检查内容**:
- [ ] 所有来自 `req.body`、`req.params`、`req.query` 的参数都经过验证
- [ ] 使用 `src/utils/validation.ts` 中的验证函数
- [ ] 不信任任何来自客户端的数据

**审查要点**:
```typescript
// ❌ 错误示例
const { userId } = req.body; // 未验证

// ✅ 正确示例
const { userId } = validateRequiredFields(req.body, ['userId']);
const userIdValidation = validateUserId(userId);
if (!userIdValidation.valid) {
  return error('INVALID_USER_ID', userIdValidation.message);
}
```

**相关文件**: `src/utils/validation.ts`

---

### ✅ 1.2 使用 validation.ts 中的验证函数
**检查内容**:
- [ ] 使用 `validateRequiredFields()` 验证必填字段
- [ ] 使用 `validateUserId()` 验证用户ID格式
- [ ] 使用 `validateAmount()` 验证金额（正数、精度）
- [ ] 使用 `validateReason()` 验证原因文本（长度、格式）

**审查要点**:
```typescript
// 必须使用的验证函数
- validateRequiredFields(data, fields)
- validateUserId(userId)
- validateAmount(amount)
- validateReason(reason)
```

---

### ✅ 1.3 处理空值和边界情况
**检查内容**:
- [ ] 验证空字符串 `''`
- [ ] 验证 `null` 和 `undefined`
- [ ] 验证数值边界（负数、零、最大值）
- [ ] 验证字符串长度（最小、最大）

**审查要点**:
```typescript
// 边界情况测试
- userId: '', null, undefined, '   '
- amount: -100, 0, 0.001, Number.MAX_VALUE
- reason: '', 'a', 'a'.repeat(501)
```

---

### ✅ 1.4 类型验证
**检查内容**:
- [ ] 验证数值类型（`typeof amount === 'number'`）
- [ ] 验证字符串类型
- [ ] 验证布尔类型
- [ ] 验证枚举值

**审查要点**:
```typescript
// 类型检查
if (typeof req.body.amount !== 'number') {
  return error('INVALID_TYPE', '金额必须是数字');
}
```

---

### ✅ 1.5 业务逻辑验证
**检查内容**:
- [ ] 验证账户是否存在
- [ ] 验证余额是否充足
- [ ] 验证冻结金额是否合法
- [ ] 验证操作权限

**审查要点**:
```typescript
// 业务逻辑验证
if (account.balance < amount) {
  return error('INSUFFICIENT_BALANCE', '余额不足');
}
```

---

## 2️⃣ 并发安全检查（5项）

### ✅ 2.1 余额操作使用锁机制
**检查内容**:
- [ ] 所有余额修改操作都使用 `withAccountLock()`
- [ ] 锁的范围覆盖整个事务
- [ ] 避免死锁（按固定顺序获取锁）

**审查要点**:
```typescript
// ❌ 错误示例
account.balance -= amount; // 直接修改，无锁保护

// ✅ 正确示例
return withAccountLock(userId, async () => {
  const account = await getAccount(userId);
  account.balance -= amount;
  await saveAccount(account);
});
```

**相关文件**: `src/utils/lock.ts`

---

### ✅ 2.2 使用 lock.ts 中的锁函数
**检查内容**:
- [ ] 使用 `withAccountLock(userId, callback)` 保护账户操作
- [ ] 锁的超时时间合理（默认 5 秒）
- [ ] 锁的正确释放（即使在异常情况下）

**审查要点**:
```typescript
// 锁的使用
await withAccountLock(userId, async () => {
  // 所有账户操作在这里进行
  // 确保事务完整性
});
```

---

### ✅ 2.3 避免竞态条件
**检查内容**:
- [ ] 检查和修改在同一个锁范围内
- [ ] 避免 TOCTOU（Time-of-check to Time-of-use）漏洞
- [ ] 避免双重支付

**审查要点**:
```typescript
// ❌ 错误示例（TOCTOU）
const balance = await getBalance(userId);
if (balance >= amount) { // 检查
  // ... 其他操作
  await deduct(userId, amount); // 使用时余额可能已变化
}

// ✅ 正确示例
await withAccountLock(userId, async () => {
  const balance = await getBalance(userId);
  if (balance < amount) throw new Error('余额不足');
  await deduct(userId, amount);
});
```

---

### ✅ 2.4 转账操作的锁顺序
**检查内容**:
- [ ] 转账时按固定顺序获取锁（如按 userId 排序）
- [ ] 避免循环等待
- [ ] 使用 `withTransferLock()` 函数

**审查要点**:
```typescript
// 转账锁顺序
const [lock1, lock2] = fromUserId < toUserId 
  ? [fromUserId, toUserId] 
  : [toUserId, fromUserId];

await withAccountLock(lock1, async () => {
  await withAccountLock(lock2, async () => {
    // 转账操作
  });
});
```

---

### ✅ 2.5 并发测试验证
**检查内容**:
- [ ] 测试并发余额修改
- [ ] 测试并发转账
- [ ] 测试并发冻结/解冻
- [ ] 验证最终一致性

**审查要点**:
- 运行并发测试脚本
- 验证数据一致性
- 检查日志中的锁等待情况

---

## 3️⃣ 错误处理检查（5项）

### ✅ 3.1 所有方法都有 try-catch
**检查内容**:
- [ ] 控制器的每个方法都包含 try-catch
- [ ] 捕获所有可能的异常
- [ ] 错误日志记录完整

**审查要点**:
```typescript
// 每个控制器方法的结构
async methodName(req: Request, res: Response): Promise<ApiResponse> {
  try {
    // 业务逻辑
    return success(data);
  } catch (error) {
    console.error('方法名错误:', error);
    return error('ERROR_CODE', '用户友好的错误信息');
  }
}
```

---

### ✅ 3.2 返回正确的错误码
**检查内容**:
- [ ] 使用标准的错误码（见 API 规范）
- [ ] 错误码具有描述性
- [ ] 区分客户端错误（4xx）和服务端错误（5xx）

**审查要点**:
```typescript
// 标准错误码
- INVALID_USER_ID: 无效的用户ID
- INSUFFICIENT_BALANCE: 余额不足
- ACCOUNT_NOT_FOUND: 账户不存在
- AMOUNT_MUST_BE_POSITIVE: 金额必须为正数
- INTERNAL_ERROR: 内部服务器错误
```

**参考**: `docs/api-guide/README.md`

---

### ✅ 3.3 错误信息清晰明确
**检查内容**:
- [ ] 错误信息对用户友好
- [ ] 错误信息包含足够的调试信息
- [ ] 避免暴露敏感信息（如堆栈跟踪）

**审查要点**:
```typescript
// ❌ 错误示例
return error('DB_ERROR', err.message); // 可能暴露数据库信息

// ✅ 正确示例
console.error('数据库错误:', err); // 记录详细日志
return error('INTERNAL_ERROR', '操作失败，请稍后重试'); // 用户友好
```

---

### ✅ 3.4 特定错误场景处理
**检查内容**:
- [ ] 账户不存在
- [ ] 余额不足
- [ ] 冻结金额超过可用余额
- [ ] 重复操作
- [ ] 无效的操作

**审查要点**:
```typescript
// 特定错误场景
if (!account) {
  return error('ACCOUNT_NOT_FOUND', '账户不存在');
}

if (account.balance < amount) {
  return error('INSUFFICIENT_BALANCE', `余额不足，当前余额: ${account.balance}`);
}

if (account.frozenBalance + freezeAmount > account.balance) {
  return error('EXCEED_BALANCE', '冻结金额不能超过可用余额');
}
```

---

### ✅ 3.5 错误日志记录
**检查内容**:
- [ ] 记录错误发生的时间
- [ ] 记录错误上下文（用户ID、操作类型）
- [ ] 记录错误堆栈（仅服务端日志）
- [ ] 日志格式统一

**审查要点**:
```typescript
// 错误日志
console.error({
  timestamp: new Date().toISOString(),
  operation: 'transfer',
  userId: req.body.fromUserId,
  error: error.message,
  stack: error.stack
});
```

---

## 4️⃣ 事务保护检查（3项）

### ✅ 4.1 关键操作使用事务
**检查内容**:
- [ ] 转账操作使用事务
- [ ] 冻结/解冻操作使用事务
- [ ] 多步骤操作使用事务

**审查要点**:
```typescript
// 事务的使用
await db.transaction(async (trx) => {
  await trx('accounts').where({ userId }).update({ balance });
  await trx('transactions').insert(transaction);
});
```

---

### ✅ 4.2 事务正确提交/回滚
**检查内容**:
- [ ] 成功时提交事务
- [ ] 失败时回滚事务
- [ ] 异常时自动回滚

**审查要点**:
```typescript
// 事务的提交和回滚
try {
  await db.transaction(async (trx) => {
    // 多个操作
    await operation1(trx);
    await operation2(trx);
    // 自动提交
  });
} catch (error) {
  // 自动回滚
  throw error;
}
```

---

### ✅ 4.3 事务隔离级别
**检查内容**:
- [ ] 使用合适的隔离级别
- [ ] 避免脏读、不可重复读、幻读
- [ ] 性能与一致性平衡

**审查要点**:
```typescript
// Knex 事务配置
await db.transaction(async (trx) => {
  // 默认隔离级别通常足够
}, { isolationLevel: 'read committed' });
```

---

## 5️⃣ API 规范检查（2项）

### ✅ 5.1 返回格式符合 ApiResponse
**检查内容**:
- [ ] 成功响应使用 `success(data)` 格式
- [ ] 错误响应使用 `error(code, message)` 格式
- [ ] 响应包含 `success`、`code`、`message`、`data` 字段

**审查要点**:
```typescript
// ApiResponse 接口
interface ApiResponse {
  success: boolean;
  code: string;
  message: string;
  data?: any;
  timestamp: string;
}

// 成功响应
return success({ balance: 100 });

// 错误响应
return error('INVALID_INPUT', '参数错误');
```

**参考**: `src/types/api.ts`

---

### ✅ 5.2 HTTP 状态码正确
**检查内容**:
- [ ] 成功: 200 OK
- [ ] 创建成功: 201 Created
- [ ] 客户端错误: 400 Bad Request
- [ ] 未授权: 401 Unauthorized
- [ ] 服务端错误: 500 Internal Server Error

**审查要点**:
```typescript
// Express 路由中的状态码
res.status(200).json(success(data));
res.status(400).json(error('INVALID_INPUT', '参数错误'));
res.status(500).json(error('INTERNAL_ERROR', '服务器错误'));
```

---

## 📝 审查流程

### 步骤 1: 代码静态分析
- 使用工具：ESLint, TypeScript Compiler
- 检查类型错误、语法错误
- 检查代码风格

### 步骤 2: 代码逻辑审查
- 使用本检查清单逐项检查
- 重点关注并发安全、事务保护
- 检查错误处理完整性

### 步骤 3: 测试验证
- 运行单元测试
- 运行集成测试
- 运行并发测试

### 步骤 4: 安全审查
- SQL 注入检查
- XSS 检查
- 权限验证检查

---

## 🚨 常见问题

### Q1: 如何处理并发转账？
**A**: 使用 `withAccountLock()` 按固定顺序获取锁，避免死锁。

### Q2: 如何验证金额？
**A**: 使用 `validateAmount()` 验证金额为正数、精度正确。

### Q3: 事务失败了怎么办？
**A**: 事务会自动回滚，确保返回友好的错误信息。

---

## 📚 参考文档

- [实施指南 - AccountController](./implementation-guide-account-controller.md)
- [实施指南 - FreezeController](./implementation-guide-freeze-controller.md)
- [API 规范](./api-guide/README.md)
- [测试指南](./testing.md)

---

## ✅ 审查签名

审查人: ________________  
审查日期: ________________  
审查结果: [ ] 通过  [ ] 需修改  [ ] 不通过  
备注: ________________________________
