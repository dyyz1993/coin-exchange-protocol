# 金币交易协议 API 接入指南

欢迎使用金币交易协议 API 文档。本指南将帮助开发者快速集成金币交易功能到您的应用中。

## 📋 目录

- [快速开始](./quick-start.md) - 环境准备、API Key 申请、第一个请求
- [API 参考](./api-reference.md) - 所有接口的详细说明
- [SDK 使用说明](./sdk-guide.md) - 安装、初始化、示例代码
- [最佳实践](./best-practices.md) - 错误处理、安全性建议
- [常见问题](./faq.md) - FAQ

## 📚 附录

- [错误码对照表](./error-codes.md)
- [接口签名算法](./signature.md)
- [Postman 集合](./postman-collection.json)

## 🚀 快速链接

### 核心功能

- **账户管理** - 余额查询、交易记录、转账、冻结/解冻
- **空投系统** - 创建空投活动、领取空投、查看空投记录
- **任务系统** - 创建任务、完成任务、查看任务记录

### API 基础信息

- **Base URL**: `https://api.coin-protocol.com/v1`
- **认证方式**: API Key + 签名
- **请求格式**: JSON
- **响应格式**: JSON
- **字符编码**: UTF-8

## 📦 版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2025-02-28 | 初始版本，包含账户、空投、任务三大核心功能 |

## 🔗 相关链接

- [GitHub 仓库](https://github.com/dyyz1993/coin-exchange-protocol)
- [Issue 跟踪](https://github.com/dyyz1993/coin-exchange-protocol/issues)
- [变更日志](CHANGELOG.md)

## 💬 技术支持

如有问题，请通过以下方式联系我们：

- 提交 [GitHub Issue](https://github.com/dyyz1993/coin-exchange-protocol/issues)
- 发送邮件至 support@coin-protocol.com

---

**⚠️ 注意**: 请妥善保管您的 API Key 和 Secret，不要在代码中明文存储，建议使用环境变量或密钥管理服务。
