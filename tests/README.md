# 测试套件

本目录包含金币交易系统的完整测试套件。

## 目录结构

```
tests/
├── services/              # 服务层单元测试
│   ├── account.service.test.ts    # 账户服务测试
│   ├── airdrop.service.test.ts    # 空投服务测试
│   ├── task.service.test.ts       # 任务服务测试
│   └── freeze.service.test.ts     # 冻结服务测试
├── integration/           # 集成测试
│   └── api.test.ts               # API 集成测试
└── README.md              # 本文件
```

## 快速开始

### 运行所有测试
```bash
bun test
```

### 运行特定服务的测试
```bash
# 账户服务测试
bun test tests/services/account.service.test.ts

# 空投服务测试
bun test tests/services/airdrop.service.test.ts

# 任务服务测试
bun test tests/services/task.service.test.ts

# 冻结服务测试
bun test tests/services/freeze.service.test.ts

# API 集成测试
bun test tests/integration/api.test.ts
```

### 生成覆盖率报告
```bash
bun test --coverage
```

### 监听模式（开发时使用）
```bash
bun test --watch
```

## 测试覆盖

### 单元测试覆盖率
- ✅ AccountService: 覆盖率目标 > 85%
  - 账户创建、余额查询、转账、冻结/解冻等核心功能
  - 边界条件和错误处理

- ✅ AirdropService: 覆盖率目标 > 85%
  - 空投创建、激活、领取验证
  - 重复领取防护、时间限制

- ✅ TaskService: 覆盖率目标 > 85%
  - 任务创建、完成、奖励发放
  - 状态管理、完成次数限制

- ✅ FreezeService: 覆盖率目标 > 85%
  - 冻结创建、自动解冻、冻结查询
  - 余额计算、批量操作

### 集成测试覆盖
- ✅ API 端点测试
- ✅ 错误处理
- ✅ 性能测试
- ✅ 完整业务流程

## 测试特点

### 1. 测试隔离
每个测试用例独立运行，测试前后自动清理数据。

### 2. 边界条件测试
全面覆盖正常流程、边界条件和异常情况。

### 3. 并发测试
验证系统在并发场景下的正确性。

### 4. 性能测试
确保系统在大量请求下的性能表现。

## 最佳实践

1. **运行测试前**：确保依赖已安装
   ```bash
   bun install
   ```

2. **提交代码前**：运行完整测试套件
   ```bash
   bun test
   ```

3. **开发新功能时**：使用监听模式
   ```bash
   bun test --watch
   ```

4. **查看覆盖率**：定期检查覆盖率报告
   ```bash
   bun test --coverage
   ```

## 故障排查

### 测试失败

1. 检查错误信息
2. 确认测试数据是否正确清理
3. 验证异步操作是否正确等待
4. 检查时序相关问题

### 性能问题

如果测试运行缓慢：
1. 检查是否有不必要的延迟
2. 优化测试数据准备
3. 使用 mock 减少外部依赖

## 维护指南

### 添加新测试

1. 在相应的测试文件中添加测试用例
2. 遵循命名规范：`test('应该[功能描述]', async () => {})`
3. 确保测试可以独立运行

### 更新测试

1. 当业务逻辑变更时同步更新测试
2. 保持测试的准确性
3. 运行完整测试套件验证

## 相关文档

- [完整测试文档](../docs/testing.md)
- [API 文档](../docs/api.md)
- [开发指南](../docs/development.md)

## 联系方式

如有问题，请联系测试工程师或查看项目文档。
