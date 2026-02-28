# AccountController 实施指南

## 📋 任务概述

**目标：** 修复 `src/controllers/account.controller.ts`，添加缺失的关键方法

**当前状态：**
- 文件大小：976 bytes（严重不足）
- 现有方法：getBalance, getTransactions
- 缺失方法：createAccount, deposit, withdraw, transfer, freezeAccount, unfreezeAccount

---

## 🔧 实施步骤

### 步骤 1：备份现有文件

```bash
cp src/controllers/account.controller.ts src/controllers/account.controller.ts.backup
```

### 步骤 2：添加缺失的方法

在 `AccountController` 类中添加以下方法：

#### 2.1 创建账户

```typescript
/**
 * 创建账户
 * POST /api/account/create
 * Body: { userId: string, initialBalance?: number }
 */
async createAccount(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { userId, initialBalance = 0 } = body;
    
    // 输入验证
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: '无效的用户ID' };
    }
    
    if (typeof initialBalance !== 'number' || initialBalance < 0) {
      return { success: false, error: '无效的初始余额' };
    }
    
    // 调用服务层
    return accountService.createAccount(userId, initialBalance);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '创建账户失败' 
    };
  }
}
```

#### 2.2 充值

```typescript
/**
 * 充值
 * POST /api/account/deposit
 * Body: { userId: string, amount: number, reason?: string }
 */
async deposit(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { userId, amount, reason } = body;
    
    // 输入验证
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: '无效的用户ID' };
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return { success: false, error: '无效的充值金额' };
    }
    
    // 调用服务层
    return accountService.deposit(userId, amount, reason);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '充值失败' 
    };
  }
}
```

#### 2.3 提现

```typescript
/**
 * 提现
 * POST /api/account/withdraw
 * Body: { userId: string, amount: number, reason?: string }
 */
async withdraw(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { userId, amount, reason } = body;
    
    // 输入验证
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: '无效的用户ID' };
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return { success: false, error: '无效的提现金额' };
    }
    
    // 调用服务层
    return accountService.withdraw(userId, amount, reason);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '提现失败' 
    };
  }
}
```

#### 2.4 转账

```typescript
/**
 * 转账
 * POST /api/account/transfer
 * Body: { fromUserId: string, toUserId: string, amount: number, reason?: string }
 */
async transfer(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { fromUserId, toUserId, amount, reason } = body;
    
    // 输入验证
    if (!fromUserId || !toUserId || typeof fromUserId !== 'string' || typeof toUserId !== 'string') {
      return { success: false, error: '无效的用户ID' };
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return { success: false, error: '无效的转账金额' };
    }
    
    if (fromUserId === toUserId) {
      return { success: false, error: '不能转账给自己' };
    }
    
    // 调用服务层
    return accountService.transfer(fromUserId, toUserId, amount, reason);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '转账失败' 
    };
  }
}
```

#### 2.5 冻结账户

```typescript
/**
 * 冻结账户
 * POST /api/account/freeze
 * Body: { userId: string, reason: string }
 */
async freezeAccount(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { userId, reason } = body;
    
    // 输入验证
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: '无效的用户ID' };
    }
    
    if (!reason || typeof reason !== 'string') {
      return { success: false, error: '冻结原因不能为空' };
    }
    
    // 调用服务层
    return accountService.freezeAccount(userId, reason);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '冻结账户失败' 
    };
  }
}
```

#### 2.6 解冻账户

```typescript
/**
 * 解冻账户
 * POST /api/account/unfreeze
 * Body: { userId: string, reason: string }
 */
async unfreezeAccount(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { userId, reason } = body;
    
    // 输入验证
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: '无效的用户ID' };
    }
    
    if (!reason || typeof reason !== 'string') {
      return { success: false, error: '解冻原因不能为空' };
    }
    
    // 调用服务层
    return accountService.unfreezeAccount(userId, reason);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '解冻账户失败' 
    };
  }
}
```

---

## ✅ 验收标准

完成后，文件应满足以下标准：

1. **文件大小：** > 3000 bytes
2. **方法数量：** 8 个（原有 2 个 + 新增 6 个）
3. **每个方法都有：**
   - JSDoc 注释
   - 输入验证
   - 错误处理（try-catch）
   - 返回 ApiResponse 类型
4. **所有方法都调用 accountService**

---

## 🧪 测试方法

### 手动测试

```bash
# 1. 创建账户
curl -X POST http://localhost:3000/api/account/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "initialBalance": 100}'

# 2. 查询余额
curl http://localhost:3000/api/account/balance/user001

# 3. 充值
curl -X POST http://localhost:3000/api/account/deposit \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "amount": 50}'

# 4. 提现
curl -X POST http://localhost:3000/api/account/withdraw \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "amount": 30}'

# 5. 转账
curl -X POST http://localhost:3000/api/account/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromUserId": "user001", "toUserId": "user002", "amount": 20}'

# 6. 冻结账户
curl -X POST http://localhost:3000/api/account/freeze \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "reason": "可疑活动"}'

# 7. 解冻账户
curl -X POST http://localhost:3000/api/account/unfreeze \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "reason": "审核通过"}'
```

---

## 📝 提交代码

```bash
# 1. 查看修改
git diff src/controllers/account.controller.ts

# 2. 提交代码
git add src/controllers/account.controller.ts
git commit -m "feat: 完善 AccountController - 添加缺失的关键方法

- 添加 createAccount 方法
- 添加 deposit 方法
- 添加 withdraw 方法
- 添加 transfer 方法
- 添加 freezeAccount 方法
- 添加 unfreezeAccount 方法
- 所有方法都有输入验证和错误处理"

# 3. 推送到远程
git push origin feature/your-branch-name
```

---

## ❓ 常见问题

### Q1: accountService 没有这些方法怎么办？

**A:** 检查 `src/services/account.service.ts`，如果缺失方法，需要先在 Service 层添加。

### Q2: 如何使用输入验证工具？

**A:** 可以使用 `src/utils/validation.ts` 中的验证函数：

```typescript
import { validateUserId, validateAmount } from '../utils/validation';

// 使用示例
if (!validateUserId(userId)) {
  return { success: false, error: '无效的用户ID' };
}
```

### Q3: 如何使用并发保护？

**A:** 可以使用 `src/utils/lock.ts` 中的锁机制：

```typescript
import { withLock } from '../utils/lock';

// 在转账等关键操作中使用
return withLock([fromUserId, toUserId], async () => {
  return accountService.transfer(fromUserId, toUserId, amount, reason);
});
```

---

## 🎯 完成标志

当您完成此任务后，请确认：

- [ ] 文件大小 > 3000 bytes
- [ ] 所有 6 个方法都已添加
- [ ] 代码已提交到 Git
- [ ] 代码已推送到远程分支
- [ ] 已创建 Pull Request

---

**预计完成时间：** 10-15 分钟
