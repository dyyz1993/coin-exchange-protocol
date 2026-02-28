# 示例代码

本目录包含多种编程语言的示例代码，帮助开发者快速上手金币交易协议 API。

## 📁 目录结构

```
examples/
├── javascript/          # JavaScript/TypeScript 示例
│   ├── basic-trading.js
│   ├── websocket.js
│   └── advanced/
├── python/             # Python 示例
│   ├── basic_trading.py
│   ├── websocket.py
│   └── advanced/
└── go/                 # Go 示例
    ├── basic_trading.go
    ├── websocket.go
    └── advanced/
```

## 🚀 快速开始

### JavaScript/TypeScript

```bash
# 安装依赖
cd javascript
npm install

# 设置环境变量
export COIN_EXCHANGE_API_KEY="your-api-key"
export COIN_EXCHANGE_API_SECRET="your-api-secret"

# 运行示例
node basic-trading.js
```

### Python

```bash
# 安装依赖
cd python
pip install -r requirements.txt

# 设置环境变量
export COIN_EXCHANGE_API_KEY="your-api-key"
export COIN_EXCHANGE_API_SECRET="your-api-secret"

# 运行示例
python basic_trading.py
```

### Go

```bash
# 安装依赖
cd go
go mod download

# 设置环境变量
export COIN_EXCHANGE_API_KEY="your-api-key"
export COIN_EXCHANGE_API_SECRET="your-api-secret"

# 运行示例
go run basic_trading.go
```

## 📚 示例说明

### 1. 基础交易示例

演示如何进行基本的交易操作：
- ✅ 查询账户余额
- ✅ 查询市场行情
- ✅ 创建限价订单
- ✅ 查询订单状态
- ✅ 取消订单
- ✅ 查询历史订单

### 2. WebSocket 示例

演示如何使用 WebSocket 订阅实时数据：
- ✅ 连接 WebSocket
- ✅ 订阅行情数据
- ✅ 订阅深度数据
- ✅ 订阅成交记录
- ✅ 自动重连机制

### 3. 高级示例

演示更复杂的使用场景：
- ✅ 网格交易策略
- ✅ 套利交易
- ✅ 自动化交易机器人
- ✅ 风险管理

## ⚙️ 环境变量

所有示例都需要设置以下环境变量：

```bash
# API 认证信息
COIN_EXCHANGE_API_KEY=your-api-key
COIN_EXCHANGE_API_SECRET=your-api-secret

# 可选：自定义环境
COIN_EXCHANGE_ENV=sandbox  # sandbox 或 production
```

## 📝 代码风格

- **JavaScript**: 遵循 Airbnb 风格指南
- **Python**: 遵循 PEP 8 规范
- **Go**: 遵循 Go 官方代码规范

## 🧪 测试

所有示例都包含错误处理和日志输出，便于调试。

### 调试模式

```bash
# JavaScript
DEBUG=* node basic-trading.js

# Python
DEBUG=* python basic_trading.py

# Go
DEBUG=* go run basic_trading.go
```

## 📖 相关文档

- [快速开始指南](../quick-start.md)
- [API 完整参考](../api-reference.md)
- [SDK 使用说明](../sdk-guide.md)
- [最佳实践](../best-practices.md)

## 🤝 贡献

欢迎提交更多语言的示例代码！

1. Fork 仓库
2. 创建特性分支
3. 提交 Pull Request

## 📄 许可证

MIT License
