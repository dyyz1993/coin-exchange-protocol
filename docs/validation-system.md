# 输入数据验证系统

## 概述

本文档描述了代币系统的输入数据验证机制，确保数据完整性和安全性。

## 验证工具类

位置：`src/utils/validators.ts`

### 核心验证函数

#### 1. `validateAmount(amount, fieldName)`
验证金额参数，确保：
- 是数字类型
- 是有限数（非 NaN 或 Infinity）
- 是正数（> 0）
- 最多2位小数
- 不超过最大安全值

**使用场景**：
- `addBalance()` - 增加余额
- `deductBalance()` - 扣减余额
- `freezeBalance()` - 冻结余额
- `unfreezeBalance()` - 解冻余额
- `transfer()` - 转账金额

#### 2. `validateNonNegativeAmount(amount, fieldName)`
验证非负金额（允许为0），确保：
- 是数字类型
- 是有限数
- 是非负数（>= 0）
- 最多2位小数
- 不超过最大安全值

**使用场景**：
- 查询余额时的可选验证

#### 3. `validateUserId(userId)`
验证用户ID，确保：
- 是字符串类型
- 非空
- 长度不超过256个字符
- 只包含字母、数字、下划线和短横线

**使用场景**：
- 所有涉及用户ID的操作

#### 4. `validateAccountId(accountId)`
验证账户ID，确保：
- 是字符串类型
- 非空
- 长度不超过256个字符

**使用场景**：
- TokenAccount 模型中的所有操作

#### 5. `validateCurrency(currency)`
验证货币类型，确保：
- 是字符串类型
- 非空
- 符合 ISO 4217 标准（3位大写字母）

**使用场景**：
- 订单创建
- 支付处理

#### 6. `validateOrderParams(params)`
验证订单参数，包括：
- 买家ID和卖家ID（使用 `validateUserId`）
- 买家和卖家不能是同一用户
- 订单金额和价格（使用 `validateAmount`）
- 货币类型（使用 `validateCurrency`）
- 描述长度（最多1000个字符）

**使用场景**：
- `OrderModel.createOrder()`

#### 7. `validateFreezeParams(params)`
验证冻结参数，包括：
- 用户ID（使用 `validateUserId`）
- 冻结金额（使用 `validateAmount`）
- 冻结类型（必须是 'initial' 或 'dispute'）
- 交易ID（可选，最多256个字符）
- 备注（可选，最多500个字符）

**使用场景**：
- `FreezeModel.createFreeze()`

#### 8. `validateTransferParams(params)`
验证转账参数，包括：
- 转出用户ID和转入用户ID（使用 `validateUserId`）
- 转出和转入用户不能是同一用户
- 转账金额（使用 `validateAmount`）
- 描述（可选，最多500个字符）

**使用场景**：
- `AccountModel.transfer()`

## 已添加验证的模型方法

### Account.ts
- ✅ `addBalance()` - 验证用户ID和金额
- ✅ `deductBalance()` - 验证用户ID和金额
- ✅ `freezeBalance()` - 验证用户ID和金额
- ✅ `unfreezeBalance()` - 验证用户ID和金额
- ✅ `transfer()` - 验证所有转账参数

### TokenAccount.ts
- ✅ `createAccount()` - 验证用户ID
- ✅ `addBalance()` - 验证账户ID和金额
- ✅ `deductBalance()` - 验证账户ID和金额

### Order.ts
- ✅ `createOrder()` - 验证所有订单参数

### Freeze.ts
- ✅ `createFreeze()` - 验证所有冻结参数

## 错误处理

所有验证函数在验证失败时会抛出 `ValidationError` 异常，包含清晰的错误信息：

```typescript
try {
  validateAmount(-100, '金额');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message); // "金额 必须是正数"
  }
}
```

## 单元测试

位置：`src/__tests__/validators.test.ts`

测试覆盖：
- ✅ 有效输入的接受测试
- ✅ 无效输入的拒绝测试
- ✅ 边界条件测试
- ✅ 错误信息验证

运行测试：
```bash
npm test src/__tests__/validators.test.ts
```

## 最佳实践

1. **在模型层进行验证**：所有数据修改操作都应在模型层进行验证
2. **使用明确的错误信息**：ValidationError 提供清晰的错误描述
3. **验证可选参数**：使用 `validateOptional()` 辅助函数
4. **保持验证逻辑一致**：使用统一的验证工具类

## 安全考虑

- 防止负数金额导致的逻辑错误
- 防止超大数值导致的溢出
- 防止SQL注入（通过严格的字符串格式验证）
- 防止XSS攻击（通过字符白名单验证）

## 未来改进

1. 添加更多类型的验证（如邮箱、手机号等）
2. 添加自定义验证规则支持
3. 添加验证性能监控
4. 添加验证日志记录
