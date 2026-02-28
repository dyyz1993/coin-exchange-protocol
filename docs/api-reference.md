# 金币交易协议 API 参考文档

> **版本**: v1.0.0  
> **最后更新**: 2026-02-28  
> **基础URL**: `https://api.coin-exchange.example.com`

---

## 📋 目录

- [概述](#概述)
- [认证](#认证)
- [通用响应格式](#通用响应格式)
- [错误码](#错误码)
- [账户管理 API](#账户管理-api)
- [冻结系统 API](#冻结系统-api)
- [空投系统 API](#空投系统-api)
- [任务系统 API](#任务系统-api)

---

## 概述

金币交易协议提供了一套完整的 RESTful API，用于管理用户账户、金币交易、冻结系统和任务系统。

### API 特性

- ✅ RESTful 设计风格
- ✅ JSON 数据格式
- ✅ 完整的错误处理
- ✅ 请求/响应验证
- ✅ 支持 CORS

---

## 认证

所有 API 请求需要在 Header 中携带认证信息：

```http
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

### 获取访问令牌

```http
POST /api/auth/token
```

**请求体**:
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

---

## 通用响应格式

所有 API 响应都遵循统一的格式：

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

---

## 错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|------------|
| `INVALID_PARAMETERS` | 参数验证失败 | 400 |
| `UNAUTHORIZED` | 未授权访问 | 401 |
| `FORBIDDEN` | 权限不足 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

---

## 账户管理 API

### 1. 创建账户

创建新的用户账户。

```http
POST /api/account/create
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户唯一标识 |
| `initialBalance` | number | 否 | 初始余额（默认为 0） |
| `metadata` | object | 否 | 用户元数据 |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/account/create" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user001",
    "initialBalance": 0,
    "metadata": {
      "nickname": "张三",
      "email": "user001@example.com"
    }
  }'
```

#### 响应示例

**成功响应 (201)**:
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "balance": 0,
    "frozenAmount": 0,
    "availableBalance": 0,
    "createdAt": "2026-02-28T10:30:00Z"
  }
}
```

**错误响应 (409)**:
```json
{
  "success": false,
  "error": "账户已存在",
  "code": "CONFLICT"
}
```

---

### 2. 查询账户余额

查询指定用户的金币余额。

```http
GET /api/account/balance/:userId
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户唯一标识 |

#### 请求示例

```bash
curl -X GET "https://api.coin-exchange.example.com/api/account/balance/user001" \
  -H "Authorization: Bearer <your-token>"
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "balance": 1000,
    "frozenAmount": 100,
    "availableBalance": 900,
    "lastUpdated": "2026-02-28T10:30:00Z"
  }
}
```

**错误响应 (404)**:
```json
{
  "success": false,
  "error": "用户不存在",
  "code": "NOT_FOUND"
}
```

---

### 8. 查询交易记录

查询指定用户的金币交易历史。

```http
GET /api/account/transactions/:userId
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户唯一标识 |

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `pageSize` | number | 否 | 20 | 每页数量 |
| `type` | string | 否 | - | 交易类型 (deposit/withdraw/transfer) |
| `startDate` | string | 否 | - | 开始日期 (ISO 8601) |
| `endDate` | string | 否 | - | 结束日期 (ISO 8601) |

#### 请求示例

```bash
curl -X GET "https://api.coin-exchange.example.com/api/account/transactions/user001?page=1&pageSize=10" \
  -H "Authorization: Bearer <your-token>"
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx001",
        "userId": "user001",
        "type": "deposit",
        "amount": 100,
        "balance": 1000,
        "description": "任务奖励",
        "createdAt": "2026-02-28T10:30:00Z"
      },
      {
        "id": "tx002",
        "userId": "user001",
        "type": "withdraw",
        "amount": -50,
        "balance": 950,
        "description": "兑换商品",
        "createdAt": "2026-02-27T15:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### 3. 充值

为指定用户账户充值金币。

```http
POST /api/account/deposit
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户唯一标识 |
| `amount` | number | 是 | 充值金额（必须大于0） |
| `description` | string | 否 | 充值描述 |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/account/deposit" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user001",
    "amount": 100,
    "description": "任务奖励"
  }'
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "transactionId": "tx001",
    "userId": "user001",
    "type": "deposit",
    "amount": 100,
    "balance": 1100,
    "description": "任务奖励",
    "createdAt": "2026-02-28T10:30:00Z"
  }
}
```

**错误响应 (404)**:
```json
{
  "success": false,
  "error": "用户不存在",
  "code": "NOT_FOUND"
}
```

---

### 4. 提现

从指定用户账户提现金币。

```http
POST /api/account/withdraw
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户唯一标识 |
| `amount` | number | 是 | 提现金额（必须大于0） |
| `description` | string | 否 | 提现描述 |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/account/withdraw" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user001",
    "amount": 50,
    "description": "兑换商品"
  }'
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "transactionId": "tx002",
    "userId": "user001",
    "type": "withdraw",
    "amount": -50,
    "balance": 1050,
    "description": "兑换商品",
    "createdAt": "2026-02-28T10:35:00Z"
  }
}
```

**错误响应 (400)**:
```json
{
  "success": false,
  "error": "可用余额不足",
  "code": "INVALID_PARAMETERS"
}
```

---

### 5. 转账

在用户之间转移金币。

```http
POST /api/account/transfer
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `fromUserId` | string | 是 | 转出用户ID |
| `toUserId` | string | 是 | 转入用户ID |
| `amount` | number | 是 | 转账金额（必须大于0） |
| `description` | string | 否 | 转账描述 |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/account/transfer" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId": "user001",
    "toUserId": "user002",
    "amount": 30,
    "description": "朋友转账"
  }'
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "transactionId": "tx003",
    "fromUserId": "user001",
    "toUserId": "user002",
    "type": "transfer",
    "amount": 30,
    "fromUserBalance": 1020,
    "toUserBalance": 30,
    "description": "朋友转账",
    "createdAt": "2026-02-28T10:40:00Z"
  }
}
```

**错误响应 (400)**:
```json
{
  "success": false,
  "error": "转出用户可用余额不足",
  "code": "INVALID_PARAMETERS"
}
```

---

### 6. 冻结账户

冻结指定用户账户（管理员操作）。

```http
POST /api/account/freeze
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户唯一标识 |
| `reason` | string | 是 | 冻结原因 |
| `operator` | string | 是 | 操作人ID |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/account/freeze" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user001",
    "reason": "违规操作",
    "operator": "admin001"
  }'
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "status": "frozen",
    "reason": "违规操作",
    "operator": "admin001",
    "frozenAt": "2026-02-28T11:00:00Z"
  }
}
```

---

### 7. 解冻账户

解除用户账户冻结状态（管理员操作）。

```http
POST /api/account/unfreeze
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户唯一标识 |
| `reason` | string | 是 | 解冻原因 |
| `operator` | string | 是 | 操作人ID |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/account/unfreeze" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user001",
    "reason": "问题已解决",
    "operator": "admin001"
  }'
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "status": "active",
    "reason": "问题已解决",
    "operator": "admin001",
    "unfrozenAt": "2026-02-28T12:00:00Z"
  }
}
```

---

## 冻结系统 API

### 1. 申请冻结

申请冻结指定用户的金币金额。

```http
POST /api/freeze/apply
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户唯一标识 |
| `amount` | number | 是 | 冻结金额（必须大于0） |
| `reason` | string | 是 | 冻结原因 |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/freeze/apply" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user001",
    "amount": 100,
    "reason": "争议处理"
  }'
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze001",
    "userId": "user001",
    "amount": 100,
    "status": "pending",
    "reason": "争议处理",
    "createdAt": "2026-02-28T10:30:00Z"
  }
}
```

**错误响应 (400)**:
```json
{
  "success": false,
  "error": "可用余额不足",
  "code": "INVALID_PARAMETERS"
}
```

---

### 2. 审核通过（管理员）

审核通过冻结申请。

```http
POST /api/freeze/approve
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `freezeId` | string | 是 | 冻结记录ID |
| `approver` | string | 是 | 审核人ID |
| `comment` | string | 否 | 审核备注 |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/freeze/approve" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "freezeId": "freeze001",
    "approver": "admin001",
    "comment": "审核通过，争议已确认"
  }'
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze001",
    "status": "approved",
    "approver": "admin001",
    "approvedAt": "2026-02-28T11:00:00Z",
    "comment": "审核通过，争议已确认"
  }
}
```

---

### 3. 审核拒绝（管理员）

审核拒绝冻结申请。

```http
POST /api/freeze/reject
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `freezeId` | string | 是 | 冻结记录ID |
| `approver` | string | 是 | 审核人ID |
| `reason` | string | 是 | 拒绝原因 |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/freeze/reject" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "freezeId": "freeze001",
    "approver": "admin001",
    "reason": "证据不足"
  }'
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze001",
    "status": "rejected",
    "approver": "admin001",
    "rejectedAt": "2026-02-28T11:00:00Z",
    "reason": "证据不足"
  }
}
```

---

### 4. 解冻（管理员）

解除已冻结的金币。

```http
POST /api/freeze/unfreeze
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `freezeId` | string | 是 | 冻结记录ID |
| `operator` | string | 是 | 操作人ID |
| `reason` | string | 是 | 解冻原因 |

#### 请求示例

```bash
curl -X POST "https://api.coin-exchange.example.com/api/freeze/unfreeze" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "freezeId": "freeze001",
    "operator": "admin001",
    "reason": "争议已解决"
  }'
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze001",
    "status": "unfrozen",
    "operator": "admin001",
    "unfrozenAt": "2026-02-28T12:00:00Z",
    "reason": "争议已解决"
  }
}
```

---

### 5. 查询冻结记录列表

查询冻结记录列表，支持分页和筛选。

```http
GET /api/freeze/list
```

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `userId` | string | 否 | - | 用户ID |
| `status` | string | 否 | - | 状态 (pending/approved/rejected/unfrozen) |
| `page` | number | 否 | 1 | 页码 |
| `pageSize` | number | 否 | 10 | 每页数量（1-100） |

#### 请求示例

```bash
curl -X GET "https://api.coin-exchange.example.com/api/freeze/list?userId=user001&status=pending&page=1&pageSize=10" \
  -H "Authorization: Bearer <your-token>"
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "freezeId": "freeze001",
        "userId": "user001",
        "amount": 100,
        "status": "pending",
        "reason": "争议处理",
        "createdAt": "2026-02-28T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 6. 查询单个冻结记录

查询指定冻结记录的详细信息。

```http
GET /api/freeze/:id
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 冻结记录ID |

#### 请求示例

```bash
curl -X GET "https://api.coin-exchange.example.com/api/freeze/freeze001" \
  -H "Authorization: Bearer <your-token>"
```

#### 响应示例

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze001",
    "userId": "user001",
    "amount": 100,
    "status": "approved",
    "reason": "争议处理",
    "approver": "admin001",
    "approvedAt": "2026-02-28T11:00:00Z",
    "createdAt": "2026-02-28T10:30:00Z",
    "comment": "审核通过，争议已确认"
  }
}
```

---

## 空投系统 API

### 1. 创建空投活动

创建新的空投活动。

```http
POST /api/airdrop/create
```

#### 请求体

```json
{
  "title": "新用户奖励",
  "description": "新用户注册即送100金币",
  "totalAmount": 10000,
  "perUserAmount": 100,
  "startTime": "2026-03-01T00:00:00Z",
  "endTime": "2026-03-31T23:59:59Z",
  "conditions": {
    "newUserOnly": true
  }
}
```

---

### 2. 领取空投

用户领取空投奖励。

```http
POST /api/airdrop/claim
```

#### 请求体

```json
{
  "airdropId": "airdrop001",
  "userId": "user001"
}
```

---

## 任务系统 API

### 1. 创建任务

创建新的任务。

```http
POST /api/task/create
```

#### 请求体

```json
{
  "title": "每日签到",
  "description": "每日登录即奖励10金币",
  "reward": 10,
  "type": "daily",
  "conditions": {
    "loginDays": 1
  }
}
```

---

### 2. 完成任务

用户完成任务。

```http
POST /api/task/complete
```

#### 请求体

```json
{
  "taskId": "task001",
  "userId": "user001",
  "proof": {
    "loginTime": "2026-02-28T10:30:00Z"
  }
}
```

---

## 速率限制

API 请求受到速率限制：

| 用户类型 | 限制 | 时间窗口 |
|---------|------|---------|
| 普通用户 | 100 次 | 1 分钟 |
| 管理员 | 1000 次 | 1 分钟 |

超出限制将返回 `429 Too Many Requests` 错误。

---

## 最佳实践

### 1. 错误处理

始终检查响应中的 `success` 字段：

```javascript
const response = await fetch('/api/account/balance/user001');
const data = await response.json();

if (!data.success) {
  console.error('API Error:', data.error);
  return;
}

// 处理成功响应
console.log('Balance:', data.data.balance);
```

### 2. 重试机制

对于网络错误或 5xx 错误，建议实现指数退避重试：

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 3. 分页处理

使用游标或页码进行分页查询：

```javascript
async function getAllTransactions(userId) {
  let page = 1;
  let allTransactions = [];
  
  while (true) {
    const response = await fetch(`/api/account/transactions/${userId}?page=${page}`);
    const data = await response.json();
    
    allTransactions.push(...data.data.transactions);
    
    if (page >= data.data.pagination.totalPages) break;
    page++;
  }
  
  return allTransactions;
}
```

---

## 更新日志

### v1.0.0 (2026-02-28)
- ✨ 初始版本发布
- ✨ 账户管理 API
- ✨ 冻结系统 API
- ✨ 空投系统 API
- ✨ 任务系统 API

---

## 技术支持

如有问题，请联系：

- 📧 Email: support@coin-exchange.example.com
- 💬 Discord: https://discord.gg/coin-exchange
- 📖 文档: https://docs.coin-exchange.example.com

---

**© 2026 金币交易协议. All rights reserved.**
