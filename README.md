# 金币交易协议 - 代币系统

## 📖 目录

- [概述](#概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [功能介绍](#功能介绍)
- [API 文档](#api-文档)
- [测试示例](#测试示例)
- [架构特点](#架构特点)
- [开发指南](#开发指南)
- [注意事项](#注意事项)

## 概述

这是一个基于 TypeScript 和 Bun 运行时的代币系统基础架构，实现了代币账户管理、冻结管理、空投机制和任务奖励系统。

### ✨ 核心特性

- 🏦 **账户管理** - 完整的账户创建、查询、充值、提现、转账功能
- 🔒 **冻结管理** - 灵活的账户冻结、解冻、批量操作机制
- 🎁 **空投系统** - 支持创建空投活动、用户领取奖励
- 📋 **任务奖励** - 任务创建、完成验证、自动发放奖励
- 📊 **交易记录** - 完整的交易历史追踪
- 🛡️ **安全控制** - 输入验证、错误处理、状态管理

## 技术栈

- **运行时**: Bun v1.0+
- **语言**: TypeScript 5.0+
- **架构**: RESTful API
- **数据存储**: 内存存储 (Map)
- **测试**: Bun Test Framework

## 项目结构

```
coin-exchange-protocol/
├── src/
│   ├── types/              # 类型定义
│   │   ├── index.ts        # 基础类型
│   │   └── freeze.ts       # 冻结相关类型
│   ├── models/             # 数据模型
│   │   └── store.ts        # 内存存储
│   ├── services/           # 业务逻辑层
│   │   ├── account.service.ts    # 账户服务
│   │   ├── freeze.service.ts     # 冻结服务
│   │   ├── airdrop.service.ts    # 空投服务
│   │   └── task.service.ts       # 任务服务
│   ├── controllers/        # 控制器层
│   │   ├── account.controller.ts # 账户控制器
│   │   ├── freeze.controller.ts  # 冻结控制器
│   │   ├── airdrop.controller.ts # 空投控制器
│   │   └── task.controller.ts    # 任务控制器
│   ├── routes/             # 路由配置
│   │   └── index.ts
│   └── index.ts            # 入口文件
├── tests/                  # 测试文件
│   ├── e2e/               # E2E 测试
│   └── unit/              # 单元测试
├── docs/                   # 文档目录
│   ├── API.md             # API 详细文档
│   └── screenshots/       # 测试截图
└── README.md              # 本文件
```

## 快速开始

### 前置要求

- Bun v1.0 或更高版本
- Git

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/dyyz1993/coin-exchange-protocol.git
cd coin-exchange-protocol

# 2. 安装依赖
bun install

# 3. 启动开发服务器
bun run dev

# 4. 在另一个终端运行测试
bun test
```

服务将在 `http://localhost:3000` 启动。

### 环境变量（可选）

创建 `.env` 文件：

```env
PORT=3000
NODE_ENV=development
```

## 功能介绍

### 1. 🏦 账户管理系统

提供完整的账户生命周期管理：

- **账户创建** - 支持自定义初始余额
- **余额查询** - 实时查询账户余额和交易次数
- **充值/提现** - 灵活的资金流入流出管理
- **转账** - 用户间快速转账
- **账户信息** - 查询账户详细信息
- **状态管理** - 激活、冻结、关闭账户

### 2. 🔒 冻结管理系统

灵活的账户冻结机制：

- **申请冻结** - 提交冻结申请，等待审核
- **审核流程** - 支持批准/拒绝冻结申请
- **立即冻结** - 管理员直接冻结账户
- **解冻操作** - 单个或批量解冻账户
- **冻结记录** - 完整的冻结历史追踪
- **批量操作** - 支持批量冻结/解冻

### 3. 🎁 空投系统

促进用户增长的空投机制：

- **创建空投** - 定义空投总额、单人限额、时间范围
- **空投列表** - 查看所有空投活动
- **领取空投** - 用户领取空投奖励
- **防重复领取** - 自动检测并阻止重复领取
- **领取记录** - 查询用户空投历史

### 4. 📋 任务奖励系统

激励用户参与的任务机制：

- **任务创建** - 定义任务标题、描述、奖励、类型
- **任务列表** - 查看所有可用任务
- **完成任务** - 用户完成任务获得奖励
- **任务类型** - 支持每日、每周、一次性任务
- **完成记录** - 追踪用户任务完成历史

## API 文档

### 基础 URL

```
http://localhost:3000/api
```

### 通用响应格式

```typescript
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

---

### 账户接口

#### 1. 创建账户

```http
POST /api/account/create
```

**请求体:**
```json
{
  "userId": "user123",
  "initialBalance": 1000
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "balance": 1000,
    "frozenBalance": 0,
    "status": "active",
    "createdAt": "2026-03-01T09:00:00Z"
  }
}
```

#### 2. 查询余额

```http
GET /api/account/balance/:userId
```

**响应:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "balance": 1000,
    "frozenBalance": 0,
    "availableBalance": 1000,
    "transactionCount": 5
  }
}
```

#### 3. 充值

```http
POST /api/account/deposit
```

**请求体:**
```json
{
  "userId": "user123",
  "amount": 500,
  "reason": "系统充值"
}
```

#### 4. 提现

```http
POST /api/account/withdraw
```

**请求体:**
```json
{
  "userId": "user123",
  "amount": 200,
  "reason": "用户提现"
}
```

#### 5. 转账

```http
POST /api/account/transfer
```

**请求体:**
```json
{
  "fromUserId": "user123",
  "toUserId": "user456",
  "amount": 100,
  "reason": "好友转账"
}
```

#### 6. 查询交易记录

```http
GET /api/account/transactions/:userId
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tx123",
      "type": "deposit",
      "amount": 500,
      "timestamp": "2026-03-01T09:05:00Z",
      "reason": "系统充值"
    }
  ]
}
```

#### 7. 获取账户信息

```http
GET /api/account/info/:userId
```

#### 8. 更新账户状态

```http
PUT /api/account/status
```

**请求体:**
```json
{
  "userId": "user123",
  "status": "suspended"
}
```

---

### 冻结管理接口

#### 1. 申请冻结

```http
POST /api/freeze/apply
```

**请求体:**
```json
{
  "userId": "user123",
  "amount": 500,
  "reason": "风险控制"
}
```

#### 2. 审核冻结申请（批准）

```http
POST /api/freeze/approve
```

**请求体:**
```json
{
  "freezeId": "freeze123",
  "approver": "admin001",
  "comment": "审核通过"
}
```

#### 3. 审核冻结申请（拒绝）

```http
POST /api/freeze/reject
```

**请求体:**
```json
{
  "freezeId": "freeze123",
  "approver": "admin001",
  "reason": "资料不足"
}
```

#### 4. 立即冻结账户

```http
POST /api/freeze/account
```

**请求体:**
```json
{
  "userId": "user123",
  "reason": "违规操作"
}
```

#### 5. 解冻账户

```http
POST /api/freeze/unfreeze-account
```

**请求体:**
```json
{
  "userId": "user123",
  "reason": "审核通过，解除冻结"
}
```

#### 6. 查询冻结记录列表

```http
GET /api/freeze/list?userId=user123&status=active&page=1&pageSize=10
```

#### 7. 查询单个冻结记录

```http
GET /api/freeze/:freezeId
```

#### 8. 查询冻结账户列表

```http
GET /api/freeze/frozen-accounts?status=frozen&page=1&pageSize=10
```

#### 9. 查询账户冻结状态

```http
GET /api/freeze/status/:userId
```

#### 10. 批量冻结

```http
POST /api/freeze/batch-freeze
```

**请求体:**
```json
{
  "userIds": ["user123", "user456", "user789"],
  "reason": "批量风险控制"
}
```

#### 11. 批量解冻

```http
POST /api/freeze/batch-unfreeze
```

**请求体:**
```json
{
  "userIds": ["user123", "user456"],
  "reason": "批量解冻"
}
```

---

### 空投接口

#### 1. 创建空投

```http
POST /api/airdrop/create
```

**请求体:**
```json
{
  "name": "新手空投",
  "description": "新用户注册奖励",
  "totalAmount": 100000,
  "perUserAmount": 100,
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-12-31T23:59:59Z"
}
```

#### 2. 获取所有空投

```http
GET /api/airdrop/list
```

#### 3. 获取用户可领取的空投

```http
GET /api/airdrop/available/:userId
```

#### 4. 领取空投

```http
POST /api/airdrop/claim
```

**请求体:**
```json
{
  "airdropId": "airdrop123",
  "userId": "user123"
}
```

#### 5. 获取用户空投领取记录

```http
GET /api/airdrop/claims/:userId
```

---

### 任务接口

#### 1. 创建任务

```http
POST /api/task/create
```

**请求体:**
```json
{
  "title": "每日签到",
  "description": "每天登录应用",
  "reward": 10,
  "type": "daily"
}
```

#### 2. 获取所有任务

```http
GET /api/task/list
```

#### 3. 获取任务详情

```http
GET /api/task/:taskId
```

#### 4. 获取用户可完成的任务

```http
GET /api/task/available/:userId
```

#### 5. 完成任务

```http
POST /api/task/complete
```

**请求体:**
```json
{
  "taskId": "task123",
  "userId": "user123"
}
```

#### 6. 获取用户任务完成记录

```http
GET /api/task/completions/:userId
```

#### 7. 更新任务状态

```http
PUT /api/task/status
```

**请求体:**
```json
{
  "taskId": "task123",
  "isActive": false
}
```

## 测试示例

### 完整流程示例

```bash
# 1. 创建账户
curl -X POST http://localhost:3000/api/account/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "initialBalance": 1000
  }'

# 2. 查询余额
curl http://localhost:3000/api/account/balance/user123

# 3. 充值
curl -X POST http://localhost:3000/api/account/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 500,
    "reason": "测试充值"
  }'

# 4. 创建空投并领取
curl -X POST http://localhost:3000/api/airdrop/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试空投",
    "description": "测试空投活动",
    "totalAmount": 10000,
    "perUserAmount": 100,
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2025-12-31T23:59:59Z"
  }'

# 查看空投列表并获取 airdropId
curl http://localhost:3000/api/airdrop/list

# 领取空投（替换 airdropId）
curl -X POST http://localhost:3000/api/airdrop/claim \
  -H "Content-Type: application/json" \
  -d '{
    "airdropId": "你的空投ID",
    "userId": "user123"
  }'

# 5. 冻结管理示例
# 申请冻结
curl -X POST http://localhost:3000/api/freeze/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 200,
    "reason": "测试冻结"
  }'

# 查看冻结记录
curl http://localhost:3000/api/freeze/list

# 审核批准
curl -X POST http://localhost:3000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{
    "freezeId": "你的冻结ID",
    "approver": "admin001",
    "comment": "审核通过"
  }'

# 6. 任务奖励示例
curl -X POST http://localhost:3000/api/task/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "每日签到",
    "description": "每天登录应用获得奖励",
    "reward": 10,
    "type": "daily"
  }'

# 查看任务列表
curl http://localhost:3000/api/task/list

# 完成任务（替换 taskId）
curl -X POST http://localhost:3000/api/task/complete \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "你的任务ID",
    "userId": "user123"
  }'

# 查询最终余额
curl http://localhost:3000/api/account/balance/user123
```

### E2E 测试截图

> 📸 **测试截图待添加**
> 
> 测试工程师正在准备 E2E 测试截图，包括：
> - 账户创建和查询流程
> - 冻结管理操作流程
> - 空投领取流程
> - 任务完成流程

## 架构特点

### 分层架构

```
┌─────────────────────────────────────┐
│         Routes (路由层)              │  API 路由配置
├─────────────────────────────────────┤
│     Controllers (控制器层)           │  处理 HTTP 请求/响应
├─────────────────────────────────────┤
│       Services (业务逻辑层)          │  核心业务逻辑
├─────────────────────────────────────┤
│        Models (数据模型层)           │  数据存储和访问
├─────────────────────────────────────┤
│         Types (类型定义层)           │  TypeScript 类型
└─────────────────────────────────────┘
```

### 设计原则

1. **单一职责** - 每个模块专注单一功能
2. **依赖注入** - 服务层解耦，便于测试
3. **错误处理** - 统一的错误处理机制
4. **类型安全** - 完整的 TypeScript 类型定义
5. **可测试性** - 分层设计便于单元测试

### 核心功能模块

#### 1. 账户服务 (AccountService)

```typescript
class AccountService {
  createAccount(userId: string, initialBalance: number)
  getBalance(userId: string)
  deposit(userId: string, amount: number, reason?: string)
  withdraw(userId: string, amount: number, reason?: string)
  transfer(fromUserId: string, toUserId: string, amount: number, reason?: string)
  freezeAccount(userId: string, reason: string, duration?: number)
  unfreezeAccount(userId: string, reason?: string)
  getTransactions(userId: string)
  freezeTokens(userId: string, amount: number, reason: string)
  unfreezeTokens(userId: string, amount: number, reason: string)
}
```

#### 2. 冻结服务 (FreezeService)

```typescript
class FreezeService {
  applyFreeze(userId: string, amount: number, reason: string)
  approveFreeze(freezeId: string, approver: string, comment?: string)
  rejectFreeze(freezeId: string, approver: string, reason: string)
  unfreeze(freezeId: string, operator: string, reason: string)
  getFreezeList(filters: FreezeListFilters)
  getFreezeById(freezeId: string)
  freezeAccount(userId: string, reason: string)
  unfreezeAccount(userId: string, reason: string)
  getFrozenAccounts(filters: FrozenAccountsFilters)
  getFreezeStatus(userId: string)
  batchFreeze(userIds: string[], reason: string)
  batchUnfreeze(userIds: string[], reason: string)
}
```

## 开发指南

### 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test tests/unit/account.test.ts

# 运行 E2E 测试
bun test tests/e2e/

# 生成测试覆盖率报告
bun test --coverage
```

### 代码规范

```bash
# 格式化代码
bun run format

# 代码检查
bun run lint

# 类型检查
bun run typecheck
```

### 提交规范

使用 Conventional Commits 规范：

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

## 注意事项

### ⚠️ 当前限制

1. **内存存储** - 当前使用内存存储，重启服务数据将丢失
2. **无认证** - 暂未实现用户认证和授权
3. **无持久化** - 数据未持久化到数据库
4. **无日志** - 暂未实现完整的日志系统

### 🚀 生产环境建议

#### 1. 数据库集成

```typescript
// 推荐使用 PostgreSQL 或 MongoDB
import { Pool } from 'pg';
// 或
import mongoose from 'mongoose';
```

#### 2. 用户认证

```typescript
// JWT 认证
import jwt from 'jsonwebtoken';

// 或 OAuth 2.0
import passport from 'passport';
```

#### 3. 数据持久化

- 实现 Repository 模式
- 添加数据库迁移
- 实现数据备份机制

#### 4. 日志系统

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### 5. 安全防护

- 实现请求限流 (Rate Limiting)
- 添加 CORS 配置
- 实现 CSRF 保护
- 输入验证和清理
- SQL 注入防护

#### 6. 性能优化

- 添加 Redis 缓存
- 实现数据库连接池
- 添加 API 响应压缩
- 实现分页查询

### 📊 监控和告警

```typescript
// 推荐使用 Prometheus + Grafana
import client from 'prom-client';

// 或使用 APM 工具
import * as apm from 'elastic-apm-node';
```

## 常见问题 (FAQ)

### Q: 如何重置账户数据？

A: 当前使用内存存储，重启服务即可重置所有数据。

### Q: 冻结和账户状态有什么区别？

A: 
- **冻结 (Freeze)**: 冻结特定金额，账户仍可使用剩余余额
- **账户状态 (Status)**: 完全限制账户的所有操作

### Q: 如何处理并发转账？

A: 当前实现使用了简单的锁机制，生产环境建议使用数据库事务。

### Q: 支持多币种吗？

A: 当前仅支持单一币种，多币种支持在规划中。

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 更新日志

### v1.0.0 (2026-03-01)

- ✅ 完整的账户管理系统
- ✅ 冻结管理功能（申请、审核、批量操作）
- ✅ 空投系统
- ✅ 任务奖励系统
- ✅ E2E 测试覆盖
- ✅ API 文档

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- **项目地址**: https://github.com/dyyz1993/coin-exchange-protocol
- **问题反馈**: https://github.com/dyyz1993/coin-exchange-protocol/issues
- **文档**: [docs/](docs/)

---

**Made with ❤️ by Coin Exchange Protocol Team**
