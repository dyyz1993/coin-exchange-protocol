# API 参考文档

## 概述

金币交易协议 API 提供账户管理和冻结管理的完整功能。所有 API 都返回统一的 `ApiResponse` 格式。

**基础 URL:** `http://localhost:3000`

**响应格式:**
```typescript
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

---

## AccountController APIs

### 1. 创建账户

**接口:** `POST /api/account/create`

**描述:** 创建新用户账户

**请求体:**
```json
{
  "userId": "string",          // 必填，用户唯一标识
  "initialBalance": 0          // 可选，初始余额，默认为 0
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "balance": 0,
    "status": "active",
    "createdAt": "2024-03-01T10:00:00Z"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "无效的用户ID"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/account/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "initialBalance": 100}'
```

---

### 2. 查询余额

**接口:** `GET /api/account/balance/:userId`

**描述:** 查询指定用户的账户余额

**路径参数:**
- `userId` (string) - 用户唯一标识

**成功响应:**
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "balance": 150,
    "status": "active"
  }
}
```

**示例:**
```bash
curl http://localhost:3000/api/account/balance/user001
```

---

### 3. 充值

**接口:** `POST /api/account/deposit`

**描述:** 向用户账户充值

**请求体:**
```json
{
  "userId": "string",          // 必填，用户唯一标识
  "amount": 50,                // 必填，充值金额，必须 > 0
  "reason": "string"           // 可选，充值原因
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "transactionId": "tx123",
    "userId": "user001",
    "amount": 50,
    "balance": 200,
    "type": "deposit",
    "timestamp": "2024-03-01T10:05:00Z"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "无效的充值金额"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/account/deposit \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "amount": 50, "reason": "活动奖励"}'
```

---

### 4. 提现

**接口:** `POST /api/account/withdraw`

**描述:** 从用户账户提现

**请求体:**
```json
{
  "userId": "string",          // 必填，用户唯一标识
  "amount": 30,                // 必填，提现金额，必须 > 0
  "reason": "string"           // 可选，提现原因
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "transactionId": "tx124",
    "userId": "user001",
    "amount": 30,
    "balance": 170,
    "type": "withdraw",
    "timestamp": "2024-03-01T10:10:00Z"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "余额不足"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/account/withdraw \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "amount": 30, "reason": "提现申请"}'
```

---

### 5. 转账

**接口:** `POST /api/account/transfer`

**描述:** 在两个用户之间转账

**请求体:**
```json
{
  "fromUserId": "string",      // 必填，转出用户ID
  "toUserId": "string",        // 必填，转入用户ID
  "amount": 20,                // 必填，转账金额，必须 > 0
  "reason": "string"           // 可选，转账原因
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "transactionId": "tx125",
    "fromUserId": "user001",
    "toUserId": "user002",
    "amount": 20,
    "fromBalance": 150,
    "toBalance": 120,
    "type": "transfer",
    "timestamp": "2024-03-01T10:15:00Z"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "不能转账给自己"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/account/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromUserId": "user001", "toUserId": "user002", "amount": 20, "reason": "借款"}'
```

---

### 6. 冻结账户

**接口:** `POST /api/account/freeze`

**描述:** 冻结用户账户（停止所有交易）

**请求体:**
```json
{
  "userId": "string",          // 必填，用户唯一标识
  "reason": "string"           // 必填，冻结原因
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "status": "frozen",
    "reason": "可疑活动",
    "frozenAt": "2024-03-01T10:20:00Z"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "冻结原因不能为空"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/account/freeze \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "reason": "可疑活动"}'
```

---

### 7. 解冻账户

**接口:** `POST /api/account/unfreeze`

**描述:** 解冻用户账户（恢复交易）

**请求体:**
```json
{
  "userId": "string",          // 必填，用户唯一标识
  "reason": "string"           // 必填，解冻原因
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "status": "active",
    "reason": "审核通过",
    "unfrozenAt": "2024-03-01T10:25:00Z"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "解冻原因不能为空"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/account/unfreeze \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "reason": "审核通过"}'
```

---

### 8. 查询交易记录

**接口:** `GET /api/account/transactions/:userId`

**描述:** 查询用户的交易历史记录

**路径参数:**
- `userId` (string) - 用户唯一标识

**成功响应:**
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "transactions": [
      {
        "transactionId": "tx123",
        "type": "deposit",
        "amount": 50,
        "balance": 200,
        "timestamp": "2024-03-01T10:05:00Z"
      },
      {
        "transactionId": "tx124",
        "type": "withdraw",
        "amount": 30,
        "balance": 170,
        "timestamp": "2024-03-01T10:10:00Z"
      }
    ]
  }
}
```

**示例:**
```bash
curl http://localhost:3000/api/account/transactions/user001
```

---

## FreezeController APIs

### 1. 申请冻结

**接口:** `POST /api/freeze/apply`

**描述:** 申请冻结用户资金（需要审核）

**请求体:**
```json
{
  "userId": "string",          // 必填，用户唯一标识
  "amount": 100,               // 必填，冻结金额，必须 > 0
  "reason": "string"           // 必填，冻结原因
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze001",
    "userId": "user001",
    "amount": 100,
    "status": "pending",
    "reason": "争议处理",
    "createdAt": "2024-03-01T10:30:00Z"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "无效的冻结金额"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/freeze/apply \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "amount": 100, "reason": "争议处理"}'
```

---

### 2. 审核通过

**接口:** `POST /api/freeze/approve`

**描述:** 审核通过冻结申请

**请求体:**
```json
{
  "freezeId": "string",        // 必填，冻结记录ID
  "approver": "string",        // 必填，审核人ID
  "comment": "string"          // 可选，审核备注
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze001",
    "status": "approved",
    "approver": "admin001",
    "approvedAt": "2024-03-01T10:35:00Z",
    "comment": "审核通过"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "无效的冻结ID"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"freezeId": "freeze001", "approver": "admin001", "comment": "审核通过"}'
```

---

### 3. 审核拒绝

**接口:** `POST /api/freeze/reject`

**描述:** 审核拒绝冻结申请

**请求体:**
```json
{
  "freezeId": "string",        // 必填，冻结记录ID
  "approver": "string",        // 必填，审核人ID
  "reason": "string"           // 必填，拒绝原因
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze001",
    "status": "rejected",
    "approver": "admin001",
    "rejectedAt": "2024-03-01T10:35:00Z",
    "reason": "证据不足"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "拒绝原因不能为空"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/freeze/reject \
  -H "Content-Type: application/json" \
  -d '{"freezeId": "freeze001", "approver": "admin001", "reason": "证据不足"}'
```

---

### 4. 解冻

**接口:** `POST /api/freeze/unfreeze`

**描述:** 解冻已冻结的资金

**请求体:**
```json
{
  "freezeId": "string",        // 必填，冻结记录ID
  "operator": "string",        // 必填，操作人ID
  "reason": "string"           // 必填，解冻原因
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze001",
    "status": "unfrozen",
    "operator": "admin001",
    "unfrozenAt": "2024-03-01T10:40:00Z",
    "reason": "争议已解决"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "解冻原因不能为空"
}
```

**示例:**
```bash
curl -X POST http://localhost:3000/api/freeze/unfreeze \
  -H "Content-Type: application/json" \
  -d '{"freezeId": "freeze001", "operator": "admin001", "reason": "争议已解决"}'
```

---

### 5. 查询冻结记录列表

**接口:** `GET /api/freeze/list`

**描述:** 查询冻结记录列表（支持分页和筛选）

**查询参数:**
- `userId` (string, 可选) - 用户ID筛选
- `status` (string, 可选) - 状态筛选 (pending/approved/rejected/unfrozen)
- `page` (number, 可选) - 页码，默认 1
- `pageSize` (number, 可选) - 每页数量，默认 10，最大 100

**成功响应:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "records": [
      {
        "freezeId": "freeze001",
        "userId": "user001",
        "amount": 100,
        "status": "approved",
        "reason": "争议处理",
        "createdAt": "2024-03-01T10:30:00Z"
      }
    ]
  }
}
```

**示例:**
```bash
curl "http://localhost:3000/api/freeze/list?userId=user001&status=pending&page=1&pageSize=10"
```

---

### 6. 查询单个冻结记录

**接口:** `GET /api/freeze/:id`

**描述:** 查询单个冻结记录的详细信息

**路径参数:**
- `id` (string) - 冻结记录ID

**成功响应:**
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
    "createdAt": "2024-03-01T10:30:00Z",
    "approvedAt": "2024-03-01T10:35:00Z",
    "comment": "审核通过"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "缺少冻结ID"
}
```

**示例:**
```bash
curl http://localhost:3000/api/freeze/freeze001
```

---

## 错误码说明

| 错误信息 | 说明 |
|---------|------|
| 无效的用户ID | userId 参数缺失或格式错误 |
| 无效的金额 | amount 参数必须为正数 |
| 余额不足 | 账户余额不足以完成操作 |
| 原因不能为空 | 必填的 reason 参数缺失 |
| 无效的冻结ID | freezeId 参数缺失或不存在 |
| 无效的审核人ID | approver 参数缺失或格式错误 |
| 不能转账给自己 | fromUserId 和 toUserId 相同 |
| 无效的分页参数 | page 或 pageSize 超出范围 |

---

## 常见问题

### Q1: 如何处理并发转账？
A: 系统使用锁机制确保并发安全，同一用户的转账操作会按顺序执行。

### Q2: 冻结和解冻账户有什么区别？
A: 
- **账户冻结** (`/api/account/freeze`): 直接冻结整个账户，立即生效
- **资金冻结** (`/api/freeze/apply`): 申请冻结部分资金，需要审核

### Q3: 如何查询用户的完整状态？
A: 可以组合使用多个 API：
1. `GET /api/account/balance/:userId` - 查询余额
2. `GET /api/account/transactions/:userId` - 查询交易记录
3. `GET /api/freeze/list?userId=xxx` - 查询冻结记录

---

## 更新日志

**v1.0.0** (2024-03-01)
- ✅ 完成 AccountController 8个 API
- ✅ 完成 FreezeController 6个 API
- ✅ 所有 API 都有输入验证和错误处理
- ✅ 统一的响应格式

---

**文档维护者:** 开发总监  
**最后更新:** 2024-03-01
