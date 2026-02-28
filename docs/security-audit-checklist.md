# 安全审查检查清单

**版本：** v1.0  
**创建日期：** 2026-02-28  
**创建人：** 质量工程师  
**安全等级：** 高（涉及资金交易）

---

## 🔐 1. SQL 注入检查

### 1.1 输入验证
- [ ] 所有用户输入都经过验证和清理
- [ ] 使用参数化查询（不使用字符串拼接）
- [ ] 使用 ORM 的查询构建器
- [ ] 特殊字符正确转义

### 1.2 数据库查询检查

#### ✅ 安全示例
```typescript
// 使用参数化查询
const user = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// 使用 ORM 查询构建器
const account = await AccountModel.query()
  .where('userId', userId)
  .first();
```

#### ❌ 不安全示例
```typescript
// 直接拼接 SQL - 危险！
const user = await db.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

### 1.3 检查点

#### AccountController
- [ ] `transfer()` - userId 参数安全
- [ ] `getTransactionHistory()` - 查询参数安全
- [ ] `getBalance()` - userId 参数安全

#### FreezeController
- [ ] `freezeAccount()` - 所有参数安全
- [ ] `unfreezeAccount()` - freezeId 参数安全
- [ ] `getFreezeStatus()` - freezeId 参数安全

---

## 🛡️ 2. 权限验证检查

### 2.1 身份认证
- [ ] 所有 API 端点都要求认证
- [ ] JWT Token 验证正确
- [ ] Token 过期处理正确
- [ ] Token 刷新机制安全

### 2.2 授权检查

#### 用户权限
- [ ] 用户只能查看自己的账户信息
- [ ] 用户只能操作自己的账户
- [ ] 用户不能查看其他用户的敏感信息

#### 管理员权限
- [ ] 管理员权限范围明确
- [ ] 敏感操作需要超级管理员权限
- [ ] 权限验证在控制器层完成

### 2.3 具体检查项

#### 转账权限
```typescript
// ✅ 正确：验证用户只能操作自己的账户
async transfer(req: Request): Promise<ApiResponse> {
  const fromUserId = req.user.id; // 从 Token 获取
  const { toUserId, amount } = req.body;
  
  // 不能自己转给自己
  if (fromUserId === toUserId) {
    throw new ValidationError('不能向自己转账');
  }
  
  return await accountService.transfer(fromUserId, toUserId, amount);
}
```

#### 冻结权限
```typescript
// ✅ 正确：验证管理员权限
async freezeAccount(req: Request): Promise<ApiResponse> {
  // 检查是否为管理员
  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('无权限执行此操作');
  }
  
  return await freezeService.freezeAccount(req.body);
}
```

### 2.4 权限矩阵

| 操作 | 普通用户 | 管理员 | 超级管理员 |
|------|---------|--------|-----------|
| 查看自己账户 | ✅ | ✅ | ✅ |
| 查看他人账户 | ❌ | ✅ | ✅ |
| 转账 | ✅ | ✅ | ✅ |
| 冻结账户 | ❌ | ✅ | ✅ |
| 解冻账户 | ❌ | ✅ | ✅ |
| 删除账户 | ❌ | ❌ | ✅ |

---

## 🔒 3. 敏感数据处理检查

### 3.1 数据加密

#### 传输加密
- [ ] 所有 API 使用 HTTPS
- [ ] TLS 版本 >= 1.2
- [ ] 证书有效且未过期

#### 存储加密
- [ ] 密码使用 bcrypt 加密
- [ ] 敏感字段加密存储（如身份证号）
- [ ] 数据库连接使用 SSL

### 3.2 数据脱敏

#### 日志脱敏
```typescript
// ✅ 正确：敏感信息脱敏
logger.info('转账请求', {
  fromUserId: userId,
  toUserId: maskUserId(toUserId), // 脱敏
  amount: amount,
  // 不记录密码、Token 等
});

// ❌ 错误：记录敏感信息
logger.info('用户登录', {
  username: username,
  password: password // 危险！
});
```

#### API 响应脱敏
```typescript
// ✅ 正确：返回脱敏后的数据
{
  "userId": "user_****1234",
  "phone": "138****8888",
  "email": "t***@example.com",
  "balance": 1000
}

// ❌ 错误：返回完整敏感信息
{
  "userId": "user_abc123456789",
  "phone": "13812345678",
  "email": "test@example.com",
  "idCard": "310101199001011234" // 危险！
}
```

### 3.3 敏感字段清单

| 字段 | 存储加密 | 日志脱敏 | API脱敏 |
|------|---------|---------|---------|
| 密码 | ✅ | ✅ | ✅ |
| 身份证号 | ✅ | ✅ | ✅ |
| 手机号 | ❌ | ✅ | ✅ |
| 邮箱 | ❌ | ✅ | ✅ |
| 银行卡号 | ✅ | ✅ | ✅ |
| JWT Token | ❌ | ✅ | ❌ |

---

## 🚨 4. 业务安全检查

### 4.1 转账安全

#### 金额限制
- [ ] 单笔转账上限（如 100,000）
- [ ] 单日转账总额限制
- [ ] 单日转账次数限制
- [ ] 大额转账需要二次验证

#### 防刷机制
- [ ] 请求频率限制（Rate Limiting）
- [ ] IP 黑名单机制
- [ ] 异常行为检测
- [ ] 验证码机制

```typescript
// ✅ 正确：转账限制
async transfer(fromUserId: string, toUserId: string, amount: number) {
  // 1. 单笔金额限制
  if (amount > MAX_TRANSFER_AMOUNT) {
    throw new ValidationError('单笔转账金额超过上限');
  }
  
  // 2. 每日转账总额限制
  const todayTotal = await getTodayTransferTotal(fromUserId);
  if (todayTotal + amount > DAILY_TRANSFER_LIMIT) {
    throw new ValidationError('已超过每日转账限额');
  }
  
  // 3. 大额转账需要二次验证
  if (amount > LARGE_TRANSFER_THRESHOLD) {
    await requireSecondFactor(fromUserId);
  }
  
  // 执行转账
  return await accountService.transfer(fromUserId, toUserId, amount);
}
```

### 4.2 冻结安全

#### 权限控制
- [ ] 只有管理员可以冻结账户
- [ ] 冻结操作需要审计日志
- [ ] 冻结原因必填
- [ ] 冻结期限合理性检查

#### 防止滥用
```typescript
// ✅ 正确：冻结审计
async freezeAccount(userId: string, amount: number, reason: string, adminId: string) {
  // 记录审计日志
  await auditLog.create({
    action: 'FREEZE_ACCOUNT',
    operator: adminId,
    target: userId,
    amount: amount,
    reason: reason,
    timestamp: new Date()
  });
  
  // 执行冻结
  return await freezeService.freezeAccount(userId, amount, reason);
}
```

### 4.3 防重放攻击

```typescript
// ✅ 正确：使用 requestId 防止重放
async transfer(req: Request): Promise<ApiResponse> {
  const { requestId, toUserId, amount } = req.body;
  
  // 检查 requestId 是否已使用
  const exists = await redis.get(`transfer:${requestId}`);
  if (exists) {
    throw new ValidationError('重复的转账请求');
  }
  
  // 设置 requestId 有效期（如 5 分钟）
  await redis.setex(`transfer:${requestId}`, 300, '1');
  
  // 执行转账
  return await accountService.transfer(req.user.id, toUserId, amount);
}
```

---

## 🕵️ 5. 审计日志检查

### 5.1 关键操作日志

#### 必须记录的操作
- [ ] 用户登录/登出
- [ ] 转账操作（成功/失败）
- [ ] 冻结/解冻操作
- [ ] 余额变更
- [ ] 权限变更
- [ ] 敏感信息查询

#### 日志内容要求
```typescript
// ✅ 正确：完整的审计日志
{
  "timestamp": "2026-02-28T10:30:00Z",
  "action": "TRANSFER",
  "operator": {
    "userId": "user_123",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  "target": {
    "toUserId": "user_456"
  },
  "details": {
    "amount": 1000,
    "description": "测试转账"
  },
  "result": "SUCCESS",
  "transactionId": "tx_789"
}
```

### 5.2 日志安全

- [ ] 日志不可篡改
- [ ] 日志存储安全（加密）
- [ ] 日志保留期限合规（如 6 个月）
- [ ] 日志访问权限控制
- [ ] 敏感信息脱敏

---

## 🌐 6. API 安全检查

### 6.1 请求验证

#### Headers 检查
- [ ] Content-Type 验证
- [ ] User-Agent 验证
- [ ] Origin/Referer 验证
- [ ] 自定义 Header 验证

#### Body 检查
- [ ] JSON 格式验证
- [ ] 字段类型验证
- [ ] 字段长度限制
- [ ] 必填字段检查

### 6.2 响应安全

#### 错误处理
```typescript
// ✅ 正确：不泄露敏感信息
try {
  await transferService.execute(data);
} catch (error) {
  if (error instanceof DatabaseError) {
    // 不暴露数据库错误细节
    throw new InternalServerError('操作失败，请稍后重试');
  }
  throw error;
}

// ❌ 错误：泄露系统信息
try {
  await transferService.execute(data);
} catch (error) {
  throw new Error(error.stack); // 危险！
}
```

#### CORS 配置
```typescript
// ✅ 正确：严格的 CORS 配置
app.use(cors({
  origin: ['https://example.com', 'https://admin.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ❌ 错误：宽松的 CORS 配置
app.use(cors({ origin: '*' })); // 危险！
```

### 6.3 Rate Limiting

```typescript
// ✅ 正确：接口限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 次请求
  message: '请求过于频繁，请稍后重试'
});

app.use('/api/', limiter);

// 转账接口更严格的限制
const transferLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 10 // 最多 10 次转账
});

app.use('/api/account/transfer', transferLimiter);
```

---

## 📊 7. 依赖安全检查

### 7.1 第三方库检查
- [ ] 所有依赖都有安全审计
- [ ] 没有已知漏洞的依赖
- [ ] 依赖版本保持最新
- [ ] 移除未使用的依赖

### 7.2 检查命令
```bash
# 检查依赖漏洞
npm audit

# 修复漏洞
npm audit fix

# 查看过时的依赖
npm outdated
```

---

## ✅ 8. 安全审查检查清单汇总

### 8.1 高危项（必须修复）
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] CSRF 防护
- [ ] 权限验证完整性
- [ ] 敏感数据加密

### 8.2 中危项（强烈建议）
- [ ] Rate Limiting
- [ ] 审计日志完整性
- [ ] 错误信息安全
- [ ] 依赖安全更新

### 8.3 低危项（建议优化）
- [ ] 日志脱敏优化
- [ ] 响应时间优化
- [ ] 代码混淆
- [ ] 安全 Header 增强

---

## 📝 9. 安全审查执行记录

| 审查项 | 状态 | 发现问题 | 严重程度 | 修复状态 |
|--------|------|----------|----------|----------|
| SQL 注入 | 待审查 | - | - | - |
| 权限验证 | 待审查 | - | - | - |
| 敏感数据 | 待审查 | - | - | - |
| 业务安全 | 待审查 | - | - | - |
| 审计日志 | 待审查 | - | - | - |
| API 安全 | 待审查 | - | - | - |
| 依赖安全 | 待审查 | - | - | - |

---

## 🚨 10. 安全事件响应

### 10.1 发现安全漏洞
1. **立即上报**：通知技术负责人和安全团队
2. **评估影响**：确定漏洞严重程度和影响范围
3. **临时修复**：实施临时防护措施
4. **永久修复**：开发并部署修复补丁
5. **验证修复**：确认漏洞已完全修复
6. **文档记录**：更新安全文档和知识库

### 10.2 安全联系人
- **安全负责人：** _待填写_
- **技术负责人：** _待填写_
- **应急响应团队：** _待填写_

---

**审查完成时间：** _待填写_  
**审查人员签名：** _待填写_  
**下次审查时间：** _待填写_
