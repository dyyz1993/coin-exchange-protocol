# 🪙 金币交易协议 - 完整代币系统

> 一个基于 TypeScript 和 Bun 运行时的企业级代币管理系统，提供账户管理、冻结机制、空投奖励和任务系统

[![Bun](https://img.shields.io/badge/Runtime-Bun-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📑 目录

- [概述](#概述)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [API 文档](#api-文档)
  - [账户管理](#账户管理-api)
  - [冻结管理](#冻结管理-api)
  - [空投系统](#空投系统-api)
  - [任务系统](#任务系统-api)
- [项目结构](#项目结构)
- [架构特点](#架构特点)
- [测试指南](#测试指南)
- [部署说明](#部署说明)
- [贡献指南](#贡献指南)

---

## 🎯 概述

金币交易协议是一个功能完整的代币管理系统，专为游戏平台、积分系统和数字资产管理场景设计。系统采用分层架构，提供 RESTful API 接口，支持账户管理、交易冻结、空投活动和任务奖励等核心功能。

### ✨ 核心功能

| 功能模块 | 描述 | 状态 |
|---------|------|------|
| 🏦 **账户管理** | 账户创建、余额查询、交易记录追踪 | ✅ 已完成 |
| 🔒 **冻结管理** | 交易冻结申请、审核、自动解冻机制 | ✅ 已完成 |
| 🎁 **空投系统** | 创建空投活动、用户领取、防重复机制 | ✅ 已完成 |
| 📋 **任务系统** | 任务创建、完成验证、自动奖励发放 | ✅ 已完成 |

---

## 🚀 快速开始

### 环境要求

- **Bun** >= 1.0.0
- **Node.js** >= 18 (可选，用于某些工具)

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/dyyz1993/coin-exchange-protocol.git
cd coin-exchange-protocol

# 2. 安装依赖
bun install

# 3. 启动开发服务器
bun run src/index.ts

# 4. 访问服务
# 服务将运行在 http://localhost:3000
```

### 📸 E2E 测试截图

> **注意**：以下截图由测试团队提供，展示了核心功能的 E2E 测试结果

#### 账户管理功能
![账户余额查询](./docs/screenshots/account-balance.png)
*图1: 账户余额查询界面*

#### 冻结管理功能
![冻结申请流程](./docs/screenshots/freeze-apply.png)
*图2: 交易冻结申请流程*

#### 空投领取功能
![空投领取](./docs/screenshots/airdrop-claim.png)
*图3: 用户领取空投*

> 📷 **截图更新中**：完整截图将由测试团队（test-engineer）提供并持续更新

---

## 📚 API 文档

### 🔑 认证说明

当前版本使用简单的 userId 进行身份识别。生产环境建议添加 JWT 或 OAuth 认证。

---

### 🏦 账户管理 API

#### 1. 查询账户余额

```http
GET /api/account/balance/:userId
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "balance": 1000,
    "transactionCount": 5,
    "frozenAmount": 100
  }
}
```

#### 2. 查询交易记录

```http
GET /api/account/transactions/:userId
```

**查询参数：**
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页条数，默认 20

**响应示例：**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx_123",
        "type": "airdrop_claim",
        "amount": 100,
        "timestamp": "2026-03-01T10:00:00Z",
        "description": "领取新手空投"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

#### 3. 转账

```http
POST /api/account/transfer
```

**请求体：**
```json
{
  "fromUserId": "user123",
  "toUserId": "user456",
  "amount": 50,
  "description": "好友转账"
}
```

---

### 🔒 冻结管理 API

#### 1. 申请冻结

```http
POST /api/freeze/apply
```

**请求体：**
```json
{
  "userId": "user123",
  "amount": 100,
  "reason": "交易争议处理"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "freezeId": "freeze_123",
    "status": "pending",
    "amount": 100,
    "createdAt": "2026-03-01T10:00:00Z"
  }
}
```

#### 2. 审核冻结申请

```http
POST /api/freeze/approve
```

**请求体：**
```json
{
  "freezeId": "freeze_123",
  "approver": "admin001",
  "comment": "审核通过，开始冻结"
}
```

#### 3. 拒绝冻结申请

```http
POST /api/freeze/reject
```

**请求体：**
```json
{
  "freezeId": "freeze_123",
  "approver": "admin001",
  "comment": "证据不足，拒绝冻结"
}
```

#### 4. 手动解冻

```http
POST /api/freeze/unfreeze
```

**请求体：**
```json
{
  "freezeId": "freeze_123",
  "operator": "admin001",
  "reason": "问题已解决"
}
```

#### 5. 查询冻结状态

```http
GET /api/freeze/status/:userId
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "frozenAmount": 100,
    "freezeRecords": [
      {
        "freezeId": "freeze_123",
        "amount": 100,
        "status": "active",
        "reason": "交易争议处理",
        "createdAt": "2026-03-01T10:00:00Z"
      }
    ]
  }
}
```

#### 6. 查询冻结记录列表

```http
GET /api/freeze/list
```

**查询参数：**
- `status` (可选): pending | active | released | rejected
- `userId` (可选): 用户ID
- `page` (可选): 页码
- `limit` (可选): 每页条数

---

### 🎁 空投系统 API

#### 1. 创建空投活动

```http
POST /api/airdrop/create
```

**请求体：**
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

**请求体：**
```json
{
  "airdropId": "airdrop123",
  "userId": "user123"
}
```

#### 5. 查询领取记录

```http
GET /api/airdrop/claims/:userId
```

---

### 📋 任务系统 API

#### 1. 创建任务

```http
POST /api/task/create
```

**请求体：**
```json
{
  "title": "每日签到",
  "description": "每天登录应用获得奖励",
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

**请求体：**
```json
{
  "taskId": "task123",
  "userId": "user123"
}
```

#### 6. 查询完成记录

```http
GET /api/task/completions/:userId
```

#### 7. 更新任务状态

```http
PUT /api/task/status
```

**请求体：**
```json
{
  "taskId": "task123",
  "isActive": false
}
```

---

## 📁 项目结构

```
coin-exchange-protocol/
├── src/
│   ├── types/                    # 类型定义
│   │   ├── index.ts              # 基础类型
│   │   └── freeze.ts             # 冻结相关类型
│   ├── models/                   # 数据模型层
│   │   ├── Account.ts            # 账户模型
│   │   ├── Freeze.ts             # 冻结模型
│   │   ├── Airdrop.ts            # 空投模型
│   │   └── Task.ts               # 任务模型
│   ├── services/                 # 业务逻辑层
│   │   ├── account.service.ts    # 账户服务
│   │   ├── freeze.service.ts     # 冻结服务 (8.1KB)
│   │   ├── airdrop.service.ts    # 空投服务
│   │   └── task.service.ts       # 任务服务
│   ├── controllers/              # 控制器层
│   │   ├── account.controller.ts # 账户控制器
│   │   ├── freeze.controller.ts  # 冻结控制器
│   │   ├── airdrop.controller.ts # 空投控制器
│   │   └── task.controller.ts    # 任务控制器
│   ├── routes/                   # 路由配置
│   │   └── index.ts
│   └── index.ts                  # 应用入口
├── docs/                         # 文档目录
│   ├── api-reference.md          # API 参考文档
│   ├── api-guide/                # API 使用指南
│   ├── implementation-guide-*.md # 实现指南
│   ├── testing.md                # 测试文档
│   └── screenshots/              # E2E 测试截图
├── tests/                        # 测试文件
│   ├── e2e/                      # E2E 测试
│   └── unit/                     # 单元测试
├── README.md                     # 本文档
└── package.json
```

---

## 🏗️ 架构特点

### 分层架构

```
┌─────────────────────────────────────┐
│          Routes (路由层)             │  API 路由配置
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Controllers (控制器层)          │  HTTP 请求处理
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       Services (业务逻辑层)          │  核心业务处理
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Models (数据模型层)           │  数据存储与管理
└─────────────────────────────────────┘
```

### 核心设计原则

1. **单一职责**：每层只负责特定功能
2. **依赖注入**：服务层可独立测试
3. **类型安全**：TypeScript 严格模式
4. **错误处理**：统一的错误响应格式
5. **自动机制**：定时任务处理过期冻结

---

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
bun test

# 运行 E2E 测试
bun test:e2e

# 运行单元测试
bun test:unit

# 生成测试覆盖率报告
bun test:coverage
```

### 测试示例

#### 测试空投领取流程

```bash
# 1. 创建空投
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

# 2. 查看空投列表
curl http://localhost:3000/api/airdrop/list

# 3. 领取空投（替换 airdropId）
curl -X POST http://localhost:3000/api/airdrop/claim \
  -H "Content-Type: application/json" \
  -d '{
    "airdropId": "你的空投ID",
    "userId": "user123"
  }'

# 4. 查询余额
curl http://localhost:3000/api/account/balance/user123
```

#### 测试冻结流程

```bash
# 1. 申请冻结
curl -X POST http://localhost:3000/api/freeze/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 50,
    "reason": "交易争议"
  }'

# 2. 审核通过（替换 freezeId）
curl -X POST http://localhost:3000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{
    "freezeId": "你的冻结ID",
    "approver": "admin001",
    "comment": "审核通过"
  }'

# 3. 查询冻结状态
curl http://localhost:3000/api/freeze/status/user123
```

---

## 🚢 部署说明

### 生产环境部署

#### 环境变量配置

```bash
# .env
PORT=3000
NODE_ENV=production
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

#### 部署到 Cloudflare Workers

本项目支持自动部署到 Cloudflare，通过 GitHub Workflow 自动触发。

```bash
# 推送到 main 分支自动部署
git push origin main
```

#### Docker 部署（可选）

```dockerfile
FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

---

### ⚠️ 注意事项

**当前使用内存存储，重启服务数据将丢失**

**生产环境建议：**
- ✅ 接入真实数据库（PostgreSQL, MongoDB 等）
- ✅ 添加用户认证和授权（JWT, OAuth）
- ✅ 实现数据持久化
- ✅ 添加日志记录（Winston, Pino）
- ✅ 实现限流和安全防护
- ✅ 添加监控和告警（Prometheus, Grafana）
- ✅ 配置 CORS 和安全头

---

## 📖 相关文档

- [API 参考文档](./docs/api-reference.md)
- [API 使用指南](./docs/api-guide/)
- [实现指南 - 账户控制器](./docs/implementation-guide-account-controller.md)
- [实现指南 - 冻结控制器](./docs/implementation-guide-freeze-controller.md)
- [测试文档](./docs/testing.md)
- [代码审查清单](./docs/code-review-checklist.md)

---

## 👥 团队协作

### 角色分工

| 角色 | 职责 | 成员 ID |
|------|------|---------|
| 开发总监 | 任务分配、代码审查、PR 合并 | dev-director |
| 后端开发 | API 开发、业务逻辑实现 | backend-developer |
| 前端开发 | 前端界面、用户交互 | frontend-developer |
| 测试工程师 | E2E 测试、截图提供 | test-engineer |

### 截图协作流程

1. **测试工程师** 完成 E2E 测试
2. **测试工程师** 上传截图到 `docs/screenshots/`
3. **开发总监** 更新 README.md 中的截图引用
4. **前端开发** 提供演示数据展示建议

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 编写单元测试
- 更新相关文档

---

## 📝 更新日志

### v1.0.0 (2026-03-01)
- ✅ 实现账户管理功能
- ✅ 实现冻结管理功能
- ✅ 实现空投系统
- ✅ 实现任务系统
- ✅ 完善文档体系

---

## 📄 License

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 💬 联系方式

- **项目地址**: https://github.com/dyyz1993/coin-exchange-protocol
- **问题反馈**: [GitHub Issues](https://github.com/dyyz1993/coin-exchange-protocol/issues)
- **文档站点**: [待部署]

---

<p align="center">Made with ❤️ by 金币交易协议开发团队</p>
