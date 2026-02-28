# 金币交易协议 API 接入指南

> 版本: v1.0.0  
> 最后更新: 2026-02-28  
> 维护者: 金币交易协议开发团队

## 📖 文档概览

本指南帮助第三方开发者快速接入金币交易协议（Coin Exchange Protocol），提供完整的 API 参考、SDK 使用说明和最佳实践。

## 📚 文档目录

### 1. [快速开始指南](./quick-start.md)
- 5分钟快速接入
- 环境准备
- 第一个 API 调用

### 2. [API 完整参考](./api-reference.md)
- 所有接口详细说明（包含冻结系统API）
- 请求/响应示例
- 认证机制
- 错误码说明

### 3. [集成指南](./integration-guide.md)
- 接口签名验证详解
- SDK 集成教程
- 3+ 实战场景示例
- 最佳实践
- 常见问题

### 4. [系统架构](./architecture.md)
- 系统架构图
- 数据流程图
- 核心模块说明
- 部署架构
- 技术栈

### 5. [SDK 使用说明](./sdk-guide.md)
- JavaScript/TypeScript SDK
- Python SDK
- Go SDK

### 6. [最佳实践](./best-practices.md)
- 安全性建议
- 性能优化
- 错误处理

### 7. [常见问题](./faq.md)
- 常见问题解答
- 故障排查

### 8. [错误码说明](./error-codes.md)
- 完整错误码列表
- 错误处理指南

### 9. [示例代码](./examples/)
- 多语言示例
- 实战案例

### 10. [Postman 集合](./postman/)
- 导入 Postman 集合
- 快速测试 API

## 🔑 快速链接

- [获取 API Key](#)
- [API 状态监控](#)
- [开发者社区](#)
- [技术支持](mailto:support@coinexchange.io)

## 📋 前置要求

- 已注册开发者账号
- 已完成身份验证
- 已获取 API Key 和 Secret

## ⚡ 5分钟快速开始

```bash
# 安装 SDK
npm install @coin-exchange/sdk

# 或使用 Python
pip install coin-exchange-sdk
```

```javascript
const { CoinExchangeClient } = require('@coin-exchange/sdk');

const client = new CoinExchangeClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  environment: 'production' // 或 'sandbox'
});

// 查询账户余额
const balance = await client.getBalance();
console.log(balance);
```

## 🔐 安全提示

⚠️ **重要**: 请勿在客户端代码中暴露 API Secret，建议通过后端服务器调用 API。

## 📊 API 限制

| 环境 | 请求限制 | 说明 |
|------|---------|------|
| Sandbox | 1000 次/分钟 | 测试环境 |
| Production | 10000 次/分钟 | 生产环境 |

## 📝 版本历史

- **v1.0.0** (2026-02-28): 初始版本发布
- 后续版本请查看 [CHANGELOG](./CHANGELOG.md)

## 🤝 贡献指南

发现文档错误或有改进建议？欢迎提交 Issue 或 Pull Request！

## 📄 许可证

本文档采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可证。
