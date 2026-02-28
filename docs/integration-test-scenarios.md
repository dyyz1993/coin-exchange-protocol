# 集成测试场景

**版本：** v1.0  
**创建日期：** 2026-02-28  
**创建人：** 质量工程师  
**测试框架：** Jest + Supertest

---

## 🧪 1. 账户操作完整流程测试

### 1.1 转账流程测试

#### 测试场景 1.1.1：正常转账流程
```typescript
describe('转账流程 - 正常情况', () => {
  test('用户A向用户B转账100金币', async () => {
    // 1. 准备数据
    const userA = await createTestUser({ balance: 1000 });
    const userB = await createTestUser({ balance: 500 });
    
    // 2. 执行转账
    const response = await request(app)
      .post('/api/account/transfer')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        toUserId: userB.id,
        amount: 100,
        description: '测试转账'
      });
    
    // 3. 验证响应
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.transactionId).toBeDefined();
    
    // 4. 验证余额变化
    const userABalance = await getBalance(userA.id);
    const userBBalance = await getBalance(userB.id);
    expect(userABalance).toBe(900);
    expect(userBBalance).toBe(600);
    
    // 5. 验证交易记录
    const transactions = await getTransactions(userA.id);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(100);
    expect(transactions[0].type).toBe('TRANSFER_OUT');
  });
});
```

#### 测试场景 1.1.2：余额不足转账
```typescript
describe('转账流程 - 余额不足', () => {
  test('余额不足时应返回明确错误', async () => {
    const userA = await createTestUser({ balance: 50 });
    const userB = await createTestUser({ balance: 0 });
    
    const response = await request(app)
      .post('/api/account/transfer')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        toUserId: userB.id,
        amount: 100,
        description: '余额不足测试'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INSUFFICIENT_BALANCE');
    expect(response.body.error.message).toContain('余额不足');
    
    // 验证余额未变化
    const userABalance = await getBalance(userA.id);
    expect(userABalance).toBe(50);
  });
});
```

#### 测试场景 1.1.3：向自己转账
```typescript
describe('转账流程 - 非法操作', () => {
  test('不能向自己转账', async () => {
    const user = await createTestUser({ balance: 1000 });
    
    const response = await request(app)
      .post('/api/account/transfer')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        toUserId: user.id,
        amount: 100,
        description: '自己转账'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_TRANSFER');
  });
});
```

### 1.2 冻结/解冻流程测试

#### 测试场景 1.2.1：正常冻结流程
```typescript
describe('冻结流程 - 正常情况', () => {
  test('冻结用户账户余额', async () => {
    const user = await createTestUser({ balance: 1000 });
    
    const response = await request(app)
      .post('/api/account/freeze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: user.id,
        amount: 200,
        reason: '违规操作',
        duration: 7 // 天数
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.freezeId).toBeDefined();
    
    // 验证冻结状态
    const freeze = await getFreezeStatus(response.body.data.freezeId);
    expect(freeze.status).toBe('ACTIVE');
    expect(freeze.amount).toBe(200);
    
    // 验证可用余额
    const balance = await getBalance(user.id);
    expect(balance.available).toBe(800);
    expect(balance.frozen).toBe(200);
  });
});
```

#### 测试场景 1.2.2：冻结金额超过余额
```typescript
describe('冻结流程 - 异常情况', () => {
  test('冻结金额不能超过可用余额', async () => {
    const user = await createTestUser({ balance: 100 });
    
    const response = await request(app)
      .post('/api/account/freeze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: user.id,
        amount: 200,
        reason: '测试冻结'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INSUFFICIENT_BALANCE');
  });
});
```

#### 测试场景 1.2.3：解冻流程
```typescript
describe('解冻流程', () => {
  test('手动解冻冻结资金', async () => {
    const user = await createTestUser({ balance: 1000 });
    
    // 先冻结
    const freezeResponse = await request(app)
      .post('/api/account/freeze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: user.id,
        amount: 300,
        reason: '测试冻结'
      });
    
    const freezeId = freezeResponse.body.data.freezeId;
    
    // 解冻
    const unfreezeResponse = await request(app)
      .post('/api/account/unfreeze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        freezeId: freezeId,
        reason: '解冻原因'
      });
    
    expect(unfreezeResponse.status).toBe(200);
    
    // 验证冻结状态
    const freeze = await getFreezeStatus(freezeId);
    expect(freeze.status).toBe('RELEASED');
    
    // 验证余额恢复
    const balance = await getBalance(user.id);
    expect(balance.available).toBe(1000);
    expect(balance.frozen).toBe(0);
  });
});
```

### 1.3 交易历史查询测试

#### 测试场景 1.3.1：分页查询
```typescript
describe('交易历史查询', () => {
  test('分页查询交易记录', async () => {
    const user = await createTestUser({ balance: 10000 });
    
    // 创建 50 条交易记录
    for (let i = 0; i < 50; i++) {
      await createTestTransaction(user.id);
    }
    
    // 查询第一页
    const response = await request(app)
      .get('/api/account/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ page: 1, limit: 10 });
    
    expect(response.status).toBe(200);
    expect(response.body.data.transactions).toHaveLength(10);
    expect(response.body.data.pagination.total).toBe(50);
    expect(response.body.data.pagination.totalPages).toBe(5);
  });
  
  test('按类型筛选交易记录', async () => {
    const user = await createTestUser({ balance: 10000 });
    
    // 创建不同类型的交易
    await createTransferOut(user.id);
    await createTransferIn(user.id);
    await createFreeze(user.id);
    
    const response = await request(app)
      .get('/api/account/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ type: 'TRANSFER_OUT' });
    
    expect(response.body.data.transactions).toHaveLength(1);
    expect(response.body.data.transactions[0].type).toBe('TRANSFER_OUT');
  });
});
```

---

## 🔄 2. 冻结操作完整流程测试

### 2.1 冻结账户测试

#### 测试场景 2.1.1：管理员冻结账户
```typescript
describe('冻结账户 - 管理员操作', () => {
  test('管理员可以冻结用户账户', async () => {
    const user = await createTestUser({ balance: 500 });
    
    const response = await request(app)
      .post('/api/freeze/account')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: user.id,
        amount: 200,
        reason: '涉嫌违规交易',
        duration: 30
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.freezeId).toBeDefined();
    expect(response.body.data.status).toBe('ACTIVE');
  });
  
  test('普通用户无权冻结账户', async () => {
    const userA = await createTestUser({ balance: 500 });
    const userB = await createTestUser({ balance: 500 });
    
    const response = await request(app)
      .post('/api/freeze/account')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        userId: userB.id,
        amount: 100,
        reason: '恶意冻结'
      });
    
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
```

### 2.2 查询冻结状态测试

#### 测试场景 2.2.1：查询冻结详情
```typescript
describe('查询冻结状态', () => {
  test('查询冻结记录详情', async () => {
    const user = await createTestUser({ balance: 1000 });
    
    const freezeResponse = await request(app)
      .post('/api/freeze/account')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: user.id,
        amount: 300,
        reason: '测试冻结'
      });
    
    const freezeId = freezeResponse.body.data.freezeId;
    
    const response = await request(app)
      .get(`/api/freeze/status/${freezeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data.freezeId).toBe(freezeId);
    expect(response.body.data.amount).toBe(300);
    expect(response.body.data.reason).toBe('测试冻结');
    expect(response.body.data.status).toBe('ACTIVE');
  });
  
  test('查询不存在的冻结记录', async () => {
    const response = await request(app)
      .get('/api/freeze/status/non-existent-id')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('FREEZE_NOT_FOUND');
  });
});
```

### 2.3 解冻操作测试

#### 测试场景 2.3.1：手动解冻
```typescript
describe('解冻操作', () => {
  test('管理员手动解冻', async () => {
    const user = await createTestUser({ balance: 1000 });
    
    // 冻结
    const freezeResponse = await request(app)
      .post('/api/freeze/account')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: user.id,
        amount: 400,
        reason: '测试'
      });
    
    const freezeId = freezeResponse.body.data.freezeId;
    
    // 解冻
    const unfreezeResponse = await request(app)
      .post('/api/freeze/unfreeze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        freezeId: freezeId,
        reason: '问题已解决'
      });
    
    expect(unfreezeResponse.status).toBe(200);
    expect(unfreezeResponse.body.data.status).toBe('RELEASED');
  });
});
```

---

## ⚡ 3. 并发操作测试场景

### 3.1 转账并发测试

#### 测试场景 3.1.1：同一用户并发转账
```typescript
describe('并发转账测试', () => {
  test('同一用户同时发起多笔转账', async () => {
    const userA = await createTestUser({ balance: 1000 });
    const userB = await createTestUser({ balance: 0 });
    const userC = await createTestUser({ balance: 0 });
    
    // 并发发起两笔转账，总额超过余额
    const [response1, response2] = await Promise.all([
      request(app)
        .post('/api/account/transfer')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ toUserId: userB.id, amount: 800, description: '转账1' }),
      request(app)
        .post('/api/account/transfer')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ toUserId: userC.id, amount: 800, description: '转账2' })
    ]);
    
    // 只有一笔应该成功
    const successCount = [response1, response2].filter(r => r.status === 200).length;
    expect(successCount).toBe(1);
    
    // 验证最终余额正确
    const finalBalance = await getBalance(userA.id);
    expect(finalBalance).toBe(200); // 1000 - 800
  });
});
```

#### 测试场景 3.1.2：A->B 和 B->A 同时转账
```typescript
describe('双向并发转账', () => {
  test('A->B 和 B->A 同时转账', async () => {
    const userA = await createTestUser({ balance: 1000 });
    const userB = await createTestUser({ balance: 500 });
    
    const [response1, response2] = await Promise.all([
      request(app)
        .post('/api/account/transfer')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ toUserId: userB.id, amount: 300, description: 'A->B' }),
      request(app)
        .post('/api/account/transfer')
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ toUserId: userA.id, amount: 200, description: 'B->A' })
    ]);
    
    // 两笔都应该成功
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    
    // 验证最终余额
    const balanceA = await getBalance(userA.id);
    const balanceB = await getBalance(userB.id);
    expect(balanceA).toBe(900); // 1000 - 300 + 200
    expect(balanceB).toBe(600); // 500 - 200 + 300
  });
});
```

### 3.2 冻结并发测试

#### 测试场景 3.2.1：并发冻结同一用户
```typescript
describe('并发冻结测试', () => {
  test('多个管理员同时冻结同一用户', async () => {
    const user = await createTestUser({ balance: 1000 });
    
    // 两个管理员同时发起冻结
    const [response1, response2] = await Promise.all([
      request(app)
        .post('/api/freeze/account')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({ userId: user.id, amount: 600, reason: '冻结1' }),
      request(app)
        .post('/api/freeze/account')
        .set('Authorization', `Bearer ${admin2Token}`)
        .send({ userId: user.id, amount: 600, reason: '冻结2' })
    ]);
    
    // 只有一笔应该成功
    const successCount = [response1, response2].filter(r => r.status === 200).length;
    expect(successCount).toBe(1);
    
    // 验证冻结总额正确
    const balance = await getBalance(user.id);
    expect(balance.available).toBe(400);
    expect(balance.frozen).toBe(600);
  });
});
```

### 3.3 转账与冻结并发测试

#### 测试场景 3.3.1：转账和冻结同时操作
```typescript
describe('转账与冻结并发', () => {
  test('转账和冻结同时操作同一用户', async () => {
    const userA = await createTestUser({ balance: 1000 });
    const userB = await createTestUser({ balance: 0 });
    
    // 同时发起转账和冻结
    const [transferRes, freezeRes] = await Promise.all([
      request(app)
        .post('/api/account/transfer')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ toUserId: userB.id, amount: 500, description: '转账' }),
      request(app)
        .post('/api/freeze/account')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: userA.id, amount: 600, reason: '冻结' })
    ]);
    
    // 只有一个操作应该成功
    const successCount = [transferRes, freezeRes].filter(r => r.status === 200).length;
    expect(successCount).toBe(1);
    
    // 验证最终状态一致
    const balance = await getBalance(userA.id);
    expect(balance.available + balance.frozen).toBe(1000);
  });
});
```

---

## 📊 4. 性能测试场景

### 4.1 负载测试

```typescript
describe('性能测试', () => {
  test('100个并发转账请求', async () => {
    const users = await createTestUsers(200, { balance: 10000 });
    
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app)
          .post('/api/account/transfer')
          .set('Authorization', `Bearer ${users[i].token}`)
          .send({
            toUserId: users[i + 100].id,
            amount: 100,
            description: `并发转账${i}`
          })
      );
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    const successCount = responses.filter(r => r.status === 200).length;
    const avgResponseTime = (endTime - startTime) / 100;
    
    console.log(`成功率: ${successCount}%`);
    console.log(`平均响应时间: ${avgResponseTime}ms`);
    
    expect(successCount).toBeGreaterThan(95); // 95% 成功率
    expect(avgResponseTime).toBeLessThan(500); // 平均响应时间 < 500ms
  });
});
```

---

## 🧩 5. 边界条件测试

### 5.1 极限值测试

```typescript
describe('边界条件', () => {
  test('转账金额为0', async () => {
    const userA = await createTestUser({ balance: 1000 });
    const userB = await createTestUser({ balance: 0 });
    
    const response = await request(app)
      .post('/api/account/transfer')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ toUserId: userB.id, amount: 0, description: '测试' });
    
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_AMOUNT');
  });
  
  test('转账金额为负数', async () => {
    const userA = await createTestUser({ balance: 1000 });
    const userB = await createTestUser({ balance: 0 });
    
    const response = await request(app)
      .post('/api/account/transfer')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ toUserId: userB.id, amount: -100, description: '测试' });
    
    expect(response.status).toBe(400);
  });
  
  test('转账金额为小数', async () => {
    const userA = await createTestUser({ balance: 1000 });
    const userB = await createTestUser({ balance: 0 });
    
    const response = await request(app)
      .post('/api/account/transfer')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ toUserId: userB.id, amount: 100.5, description: '测试' });
    
    // 根据业务需求决定是否允许小数
    expect([200, 400]).toContain(response.status);
  });
});
```

---

## ✅ 6. 测试执行计划

### 6.1 测试优先级

| 优先级 | 测试类型 | 测试场景数 | 预计时间 |
|--------|----------|------------|----------|
| P0 | 转账正常流程 | 5 | 10分钟 |
| P0 | 冻结正常流程 | 3 | 5分钟 |
| P1 | 并发测试 | 5 | 15分钟 |
| P1 | 错误处理 | 8 | 10分钟 |
| P2 | 边界条件 | 6 | 10分钟 |
| P2 | 性能测试 | 2 | 5分钟 |

### 6.2 测试覆盖率目标

- **语句覆盖率：** >= 80%
- **分支覆盖率：** >= 75%
- **函数覆盖率：** >= 85%
- **行覆盖率：** >= 80%

---

**测试负责人：** 质量工程师  
**最后更新：** 2026-02-28
