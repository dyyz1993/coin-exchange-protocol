# 🔴 [P0-资金安全] FreezeService.getAvailableBalance 余额计算错误

**Issue**: #290  
**优先级**: P0 - 资金安全  
**严重程度**: 严重 - 余额虚高可能导致资金损失  
**发现时间**: 2026-03-02  
**发现人**: 测试工程师  

---

## 🚨 问题描述

`FreezeService.getAvailableBalance()` 方法返回的可用余额**未扣除冻结金额**，导致用户看到的可用余额虚高，可能触发资金安全问题。

### 影响范围
- ❌ **资金安全**：用户可能使用超出实际可用余额的资金
- ❌ **余额显示错误**：用户界面显示的可用余额不正确
- ❌ **冻结检查失效**：`canFreeze()` 方法判断错误

---

## 🔍 根本原因分析

### AccountModel 的实现（正确）

位置：`src/models/Account.ts:166-187`

```typescript
/**
 * 修复说明（Issue #200）：
 * - balance 字段存储总余额（包括可用余额 + 冻结余额）
 * - frozenBalance 字段存储冻结金额
 * - availableBalance = balance - frozenBalance
 * - 冻结时只增加 frozenBalance，不扣减 balance
 * - 解冻时只减少 frozenBalance，不增加 balance
 */
async freezeBalance(userId: string, amount: number): Promise<Transaction> {
  return this.withLock(userId, async () => {
    const account = this.getAccountByUserId(userId);
    
    this.validateAndUpdateBalance(account, currentVersion, () => {
      // ✅ 检查可用余额（balance - frozenBalance）
      const availableBalance = account.balance - account.frozenBalance;
      if (availableBalance < amount) {
        throw new Error('Insufficient available balance');
      }
      // ✅ 只增加 frozenBalance，不扣减 balance
      account.frozenBalance += amount;
    });
    
    return transaction;
  });
}
```

**正确的余额模型**：
- `account.balance` = **总余额**（不变）
- `account.frozenBalance` = **冻结金额**
- **可用余额** = `balance - frozenBalance`

### FreezeService 的实现（错误）

位置：`src/services/freeze.service.ts:276-284`

```typescript
/**
 * 获取用户可用余额（考虑冻结金额）
 *
 * 修复说明：
 * - account.balance 在 freezeBalance() 时已经扣除了冻结金额
 * - 因此直接返回 account.balance 即可，无需再次减去冻结金额
 * - 之前重复减去冻结金额导致可用余额计算错误
 */
getAvailableBalance(userId: string): number {
  const account = accountModel.getAccountByUserId(userId);
  if (!account) {
    return 0;
  }

  // ✅ 修复：直接返回 account.balance（已扣除冻结金额）
  // 避免重复扣除冻结金额
  return account.balance;  // ❌ 错误！
}
```

**注释错误**：
- ❌ 注释说 `account.balance` 已扣除冻结金额（错误）
- ✅ 实际上 `account.balance` 是总余额（正确）
- ❌ 直接返回 `balance` 会导致余额虚高

---

## 💥 问题复现

### 场景1：单次冻结

```
初始状态：
  balance = 1000
  frozenBalance = 0
  
冻结 500 后：
  balance = 1000        (总余额不变)
  frozenBalance = 500   (冻结金额增加)
  
调用 getAvailableBalance()：
  当前实现：return 1000  ❌ 错误！
  正确应该：return 1000 - 500 = 500  ✅
```

### 场景2：多次冻结

```
初始状态：
  balance = 1000
  frozenBalance = 0
  
冻结 200：
  balance = 1000
  frozenBalance = 200
  
冻结 300：
  balance = 1000
  frozenBalance = 500
  
调用 getAvailableBalance()：
  当前实现：return 1000  ❌ 错误！
  正确应该：return 1000 - 500 = 500  ✅
```

### 场景3：解冻后

```
初始状态：
  balance = 1000
  frozenBalance = 500
  
解冻 200：
  balance = 1000        (总余额不变)
  frozenBalance = 300   (冻结金额减少)
  
调用 getAvailableBalance()：
  当前实现：return 1000  ❌ 错误！
  正确应该：return 1000 - 300 = 700  ✅
```

---

## ⚠️ 安全风险

### 风险1：资金超支
用户可能认为有 1000 可用余额，但实际只有 500，导致：
- 超额转账
- 超额消费
- 资金损失

### 风险2：并发安全问题
在高并发场景下，错误的余额计算可能导致：
- 竞态条件
- 双重支付
- 数据不一致

### 风险3：用户体验问题
- 用户看到的余额与实际不符
- 交易失败率增加
- 用户信任度下降

---

## ✅ 修复方案

### 修改 FreezeService.getAvailableBalance()

```typescript
/**
 * 获取用户可用余额（考虑冻结金额）
 *
 * 修复说明（Issue #290）：
 * - account.balance 存储总余额（包括可用余额 + 冻结余额）
 * - account.frozenBalance 存储冻结金额
 * - 可用余额 = balance - frozenBalance
 */
getAvailableBalance(userId: string): number {
  const account = accountModel.getAccountByUserId(userId);
  if (!account) {
    return 0;
  }

  // ✅ 修复：计算可用余额 = 总余额 - 冻结金额
  return account.balance - account.frozenBalance;
}
```

### 修改理由
1. **符合 AccountModel 的设计**：balance 是总余额，frozenBalance 是冻结金额
2. **逻辑正确**：可用余额 = 总余额 - 冻结金额
3. **避免余额虚高**：确保返回的余额是实际可用的

---

## 🧪 测试验证

### 单元测试

```typescript
describe('FreezeService - getAvailableBalance 修复验证', () => {
  test('应该在冻结后返回正确的可用余额', async () => {
    const userId = 'test-user';
    await accountModel.createAccount(userId, 1000);
    
    // 冻结 500
    await freezeService.createInitialFreeze({
      userId,
      amount: 500,
      transactionId: 'tx-001'
    });
    
    const account = accountModel.getAccountByUserId(userId);
    expect(account.balance).toBe(1000);        // 总余额不变
    expect(account.frozenBalance).toBe(500);   // 冻结金额增加
    
    const available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(500);  // 可用余额 = 1000 - 500
  });
  
  test('应该在多次冻结后返回正确的可用余额', async () => {
    const userId = 'test-user';
    await accountModel.createAccount(userId, 1000);
    
    // 冻结 200
    await freezeService.createInitialFreeze({
      userId,
      amount: 200,
      transactionId: 'tx-001'
    });
    
    // 冻结 300
    await freezeService.createInitialFreeze({
      userId,
      amount: 300,
      transactionId: 'tx-002'
    });
    
    const available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(500);  // 可用余额 = 1000 - 500
  });
  
  test('应该在解冻后返回正确的可用余额', async () => {
    const userId = 'test-user';
    await accountModel.createAccount(userId, 1000);
    
    const freeze = await freezeService.createInitialFreeze({
      userId,
      amount: 500,
      transactionId: 'tx-001'
    });
    
    // 解冻
    await freezeService.unfreeze(freeze.id, '解冻');
    
    const available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(1000);  // 可用余额恢复
  });
  
  test('应该在部分解冻后返回正确的可用余额', async () => {
    const userId = 'test-user';
    await accountModel.createAccount(userId, 1000);
    
    const freeze1 = await freezeService.createInitialFreeze({
      userId,
      amount: 300,
      transactionId: 'tx-001'
    });
    
    await freezeService.createInitialFreeze({
      userId,
      amount: 200,
      transactionId: 'tx-002'
    });
    
    // 解冻第一笔
    await freezeService.unfreeze(freeze1.id, '部分解冻');
    
    const account = accountModel.getAccountByUserId(userId);
    expect(account.frozenBalance).toBe(200);   // 剩余冻结 200
    
    const available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(800);  // 可用余额 = 1000 - 200
  });
});
```

### 边界条件测试

```typescript
test('应该处理全部冻结的情况', async () => {
  const userId = 'test-user';
  await accountModel.createAccount(userId, 1000);
  
  await freezeService.createInitialFreeze({
    userId,
    amount: 1000,
    transactionId: 'tx-001'
  });
  
  const available = freezeService.getAvailableBalance(userId);
  expect(available).toBe(0);  // 可用余额为 0
});

test('应该处理无冻结的情况', async () => {
  const userId = 'test-user';
  await accountModel.createAccount(userId, 1000);
  
  const available = freezeService.getAvailableBalance(userId);
  expect(available).toBe(1000);  // 可用余额 = 总余额
});
```

---

## 📊 影响评估

### 修复前
- ❌ getAvailableBalance() 返回错误的余额（虚高）
- ❌ canFreeze() 判断错误
- ❌ 用户界面显示错误的可用余额

### 修复后
- ✅ getAvailableBalance() 返回正确的余额
- ✅ canFreeze() 判断正确
- ✅ 用户界面显示正确的可用余额
- ✅ 资金安全得到保障

---

## 🔧 修复步骤

1. ✅ **修改代码** (1分钟)
   - 修改 `src/services/freeze.service.ts`
   - 修改 `getAvailableBalance()` 方法

2. ✅ **运行测试** (2分钟)
   - 运行单元测试验证修复
   - 确保所有测试通过

3. ✅ **代码审查** (5分钟)
   - 创建 PR
   - 等待审查
   - 合并代码

4. ✅ **部署验证** (10分钟)
   - 部署到测试环境
   - 验证修复效果
   - 部署到生产环境

---

## 📝 预防措施

### 1. 明确字段语义
在 `Account` 类型定义中添加注释：

```typescript
interface Account {
  balance: number;           // 总余额（可用余额 + 冻结余额）
  frozenBalance: number;     // 冻结余额
  // 可用余额 = balance - frozenBalance
}
```

### 2. 添加单元测试
- 为 `getAvailableBalance()` 添加完整的单元测试
- 覆盖多种场景（单次冻结、多次冻结、解冻、部分解冻）

### 3. 代码审查清单
- [ ] 余额计算逻辑是否正确？
- [ ] 是否正确扣除冻结金额？
- [ ] 字段语义是否清晰？
- [ ] 测试用例是否覆盖所有场景？

---

## 📌 总结

**问题**：`getAvailableBalance()` 未扣除冻结金额，导致余额虚高  
**原因**：注释错误 + 实现错误  
**方案**：返回 `balance - frozenBalance`  
**风险**：高（资金安全问题）  
**优先级**：P0（立即修复）  

---

**分析完成时间**: 2026-03-02 07:48  
**预计修复时间**: 10分钟  
**建议优先级**: 🔴 P0 - 立即修复
