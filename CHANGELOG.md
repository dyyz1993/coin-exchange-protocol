# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 贡献者指南文档 (CONTRIBUTING.md)
- Issue 管理维护流程文档

### Changed
- 优化项目文档结构

## [1.0.0] - 2026-02-28

### Added
- **核心功能**
  - 账户管理服务 (AccountService)
  - 订单管理服务 (OrderService)
  - 空投服务 (AirdropService)
  - 任务系统服务 (TaskService)
  - 冻结服务 (FreezeService)
  - 转账服务 (TransferService)

- **数据验证**
  - 集成 Zod 运行时类型验证系统
  - 输入参数验证器模块 (src/validators/)
  - API 响应类型验证

- **并发控制**
  - 为 OrderModel 添加并发控制机制
  - 集成 async-mutex 实现异步锁
  - 修复 Account.ts busy wait 锁机制

- **测试基础设施**
  - Jest 单元测试框架
  - 空投服务并发安全性测试套件
  - OrderModel 并发控制机制测试
  - 服务集成测试（空投服务和任务服务）
  - 性能测试基础设施

- **文档**
  - 用户故事文档 (docs/user-stories.md)
  - 产品路线图 (docs/roadmap.md)
  - 功能验收标准和测试用例文档 (docs/acceptance-criteria.md)
  - Busy wait 修复文档

### Changed
- 优化 AccountService.createAccount 方法签名，支持初始余额参数
- 改进测试：使领取记录验证不依赖顺序
- 删除 OrderModel 中未使用的 orderCounter 字段

### Fixed
- **P0 资金安全修复**
  - 修复空投超额领取资金安全问题 (Issue #201)
  - 修复空投领取总额检查的原子性问题
  - 修复 getAvailableBalance() 余额计算错误 (Issue #194, #200)
  - 修复冻结余额计算错误

- **P1 稳定性修复**
  - 添加空值检查，避免运行时错误 (Issue #164)
  - 修复类型导出冲突：避免重复导出 ApiResponse
  - 修复 availableBalance 计算错误 - 扣除冻结余额

- **性能优化**
  - 修复 Account.ts busy wait 锁机制 - 提升系统性能

### Security
- 实现空投领取总额检查，防止资金超额发放
- 增强余额计算安全性，避免重复扣除冻结金额
- 添加并发控制机制，防止竞态条件导致的数据不一致

## [0.9.0] - 2026-02-20

### Added
- 初始项目架构设计
- 基础数据模型定义
- TypeScript 配置和开发环境
- ESLint 和 Prettier 代码质量工具
- Husky Git hooks 集成

### Changed
- 项目初始化设置

## [0.8.0] - 2026-02-15

### Added
- README.md 项目说明文档
- 基础目录结构
- npm 脚本配置

---

## 版本说明

### 版本号规则
- **主版本号 (MAJOR)**: 不兼容的 API 修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

### 变更类型
- **Added**: 新功能
- **Changed**: 对现有功能的变更
- **Deprecated**: 即将删除的功能
- **Removed**: 已删除的功能
- **Fixed**: 任何 bug 修复
- **Security**: 安全相关的修复

---

[Unreleased]: https://github.com/dyyz1993/coin-exchange-protocol/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/dyyz1993/coin-exchange-protocol/releases/tag/v1.0.0
[0.9.0]: https://github.com/dyyz1993/coin-exchange-protocol/releases/tag/v0.9.0
[0.8.0]: https://github.com/dyyz1993/coin-exchange-protocol/releases/tag/v0.8.0
