# 金币交易协议 - 代币系统

## 概述

这是一个基于 TypeScript 和 Bun 运行时的代币系统基础架构，实现了代币账户管理、空投机制和任务奖励系统。

## 技术栈

- **运行时**: Bun
- **语言**: TypeScript
- **架构**: RESTful API
- **数据存储**: 内存存储 (Map)

## 项目结构

```
src/
├── types/           # 类型定义
│   └── index.ts
├── models/          # 数据模型
│   └── store.ts
├── services/        # 业务逻辑层
│   ├── account.service.ts
│   ├── airdrop.service.ts
│   └── task.service.ts
├── controllers/     # 控制器层
│   ├── account.controller.ts
│   ├── airdrop.controller.ts
│   └── task.controller.ts
├── routes/          # 路由配置
│   └── index.ts
└── index.ts         # 入口文件
```

## 快速开始

### 安装依赖

```bash
bun install
```

### 启动服务

```bash
bun run src/index.ts
```

服务将在 `http://localhost:3000` 启动。

## API 文档

### 账户接口

#### 查询余额
```
GET /api/account/balance/:userId
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "balance": 1000,
    "transactionCount": 5
  }
}
```

#### 查询交易记录
```
GET /api/account/transactions/:userId
```

### 空投接口

#### 创建空投
```
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

#### 获取所有空投
```
GET /api/airdrop/list
```

#### 获取用户可领取的空投
```
GET /api/airdrop/available/:userId
```

#### 领取空投
```
POST /api/airdrop/claim
```

**请求体:**
```json
{
  "airdropId": "airdrop123",
  "userId": "user123"
}
```

#### 获取用户空投领取记录
```
GET /api/airdrop/claims/:userId
```

### 任务接口

#### 创建任务
```
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

#### 获取所有任务
```
GET /api/task/list
```

#### 获取任务详情
```
GET /api/task/:taskId
```

#### 获取用户可完成的任务
```
GET /api/task/available/:userId
```

#### 完成任务
```
POST /api/task/complete
```

**请求体:**
```json
{
  "taskId": "task123",
  "userId": "user123"
}
```

#### 获取用户任务完成记录
```
GET /api/task/completions/:userId
```

#### 更新任务状态
```
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

### 创建空投并领取

```bash
# 创建空投
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

# 查看空投列表
curl http://localhost:3000/api/airdrop/list

# 领取空投（替换 airdropId）
curl -X POST http://localhost:3000/api/airdrop/claim \
  -H "Content-Type: application/json" \
  -d '{
    "airdropId": "你的空投ID",
    "userId": "user123"
  }'

# 查询余额
curl http://localhost:3000/api/account/balance/user123
```

### 创建任务并完成

```bash
# 创建任务
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

# 查询余额
curl http://localhost:3000/api/account/balance/user123
```

## 架构特点

### 分层架构
- **Types**: 类型定义，确保类型安全
- **Models**: 数据存储层，使用 Map 模拟数据库
- **Services**: 业务逻辑层，处理核心功能
- **Controllers**: 控制器层，处理 HTTP 请求
- **Routes**: 路由层，API 路由配置

### 核心功能

1. **代币账户系统**
   - 自动创建账户
   - 余额管理
   - 交易记录追踪

2. **空投机制**
   - 空投活动创建
   - 防重复领取
   - 自动余额发放

3. **任务奖励系统**
   - 任务创建和管理
   - 任务完成验证
   - 自动奖励发放

## 注意事项

⚠️ **当前使用内存存储，重启服务数据将丢失**

生产环境建议：
- 接入真实数据库（PostgreSQL, MongoDB 等）
- 添加用户认证和授权
- 实现数据持久化
- 添加日志记录
- 实现限流和安全防护

## License

MIT