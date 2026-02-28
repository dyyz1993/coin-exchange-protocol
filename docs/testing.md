# 测试文档

## 概述

本项目采用 **Bun Test** 作为测试框架，为金币交易系统提供完整的测试覆盖。

## 测试结构

```
tests/
├── services/           # 单元测试
│   ├── account.service.test.ts
│   ├── airdrop.service.test.ts
│   ├── task.service.test.ts
│   └── freeze.service.test.ts
└── integration/        # 集成测试
    └── api.test.ts
```

## 测试范围

### 单元测试

#### 1. 账户服务测试 (account.service.test.ts)
- ✅ 账户创建
  - 创建新账户
  - 同时创建代币账户
  - 支持可选初始数据
- ✅ 余额查询
  - 获取完整账户信息
  - 获取代币余额
  - 查询不存在的账户
- ✅ 代币操作
  - 增加代币
  - 扣除代币
  - 余额不足处理
- ✅ 冻结/解冻
  - 冻结代币
  - 解冻代币
  - 超额冻结/解冻处理
- ✅ 转账
  - 用户间转账
  - 余额不足处理
  - 冻结余额考虑
- ✅ 其他功能
  - 余额检查
  - 账户统计
  - 账户信息更新
  - 账户激活/停用
- ✅ 边界条件
  - 零金额操作
  - 极大金额
  - 并发操作

#### 2. 空投服务测试 (airdrop.service.test.ts)
- ✅ 空投创建
  - 创建空投活动
  - 时间验证
  - 金额验证
- ✅ 空投激活
  - 启动空投
  - 状态验证
- ✅ 空投领取
  - 成功领取
  - 重复领取防护
  - 时间限制验证
  - 状态验证
- ✅ 空投管理
  - 结束空投
  - 取消空投
  - 空投详情查询
- ✅ 查询功能
  - 可领取空投列表
  - 用户领取历史
  - 空投统计
- ✅ 边界条件
  - 大量用户领取
  - 并发领取
  - 极端时间设置

#### 3. 任务服务测试 (task.service.test.ts)
- ✅ 任务创建
  - 创建任务
  - 时间验证
  - 奖励金额验证
  - 完成次数验证
- ✅ 任务状态管理
  - 激活任务
  - 暂停任务
  - 取消任务
- ✅ 任务完成
  - 完成任务获得奖励
  - 重复完成防护
  - 时间限制验证
  - 完成次数限制
- ✅ 查询功能
  - 任务详情
  - 所有任务列表
  - 活跃任务列表
  - 用户可完成任务
  - 用户完成记录
- ✅ 边界条件
  - 大量用户完成
  - 并发完成
  - 极端奖励金额
  - 极端完成次数

#### 4. 冻结服务测试 (freeze.service.test.ts)
- ✅ 冻结创建
  - 初始冻结
  - 争议冻结
  - 余额验证
  - 过期时间设置
- ✅ 冻结解冻
  - 手动解冻
  - 自动解冻
  - 批量解冻
- ✅ 查询功能
  - 冻结状态查询
  - 用户冻结列表
  - 活跃冻结查询
  - 交易ID查询
- ✅ 其他功能
  - 可用余额计算
  - 冻结能力检查
  - 冻结统计
- ✅ 边界条件
  - 大量冻结记录
  - 极大冻结金额
  - 并发冻结
  - 快速创建解冻
- ✅ 定时任务
  - 自动解冻定时器

### 集成测试

#### API 集成测试 (api.test.ts)
- ✅ 账户 API
  - 创建账户
  - 查询余额
  - 转账操作
- ✅ 空投 API
  - 创建空投
  - 启动空投
  - 领取空投
  - 空投列表
- ✅ 任务 API
  - 创建任务
  - 激活任务
  - 完成任务
  - 任务列表
- ✅ 冻结 API
  - 创建冻结
  - 解冻操作
  - 状态查询
- ✅ 错误处理
  - 不存在的资源
  - 无效参数
  - 并发操作
- ✅ 性能测试
  - 大量查询
  - 批量操作
- ✅ 集成场景
  - 完整业务流程
  - 冻结场景

## 运行测试

### 运行所有测试
```bash
bun test
```

### 运行特定测试文件
```bash
bun test tests/services/account.service.test.ts
```

### 运行测试并生成覆盖率报告
```bash
bun test --coverage
```

### 运行测试并监听文件变化
```bash
bun test --watch
```

## 测试覆盖率目标

- **单元测试覆盖率**: > 80%
- **关键业务逻辑覆盖率**: > 90%
- **API 集成测试覆盖率**: > 70%

## 测试最佳实践

### 1. 测试隔离
每个测试用例都应该独立运行，不依赖其他测试的状态。

```typescript
beforeEach(() => {
  // 清空测试数据
  (AccountModel as any).accounts.clear();
});

afterEach(() => {
  // 清理测试数据
  (AccountModel as any).accounts.clear();
});
```

### 2. 明确的断言
使用清晰明确的断言，测试结果应该可预测。

```typescript
expect(balance?.balance).toBe(1000);
expect(result.success).toBe(true);
```

### 3. 覆盖边界条件
不仅测试正常情况，还要测试边界和异常情况。

```typescript
test('应该处理零金额操作', async () => {
  // ...
});

test('应该拒绝超额冻结', async () => {
  // ...
});
```

### 4. 使用辅助函数
对于重复的设置代码，使用辅助函数提高可读性。

```typescript
async function createTestAirdrop(name: string = '测试空投'): Promise<any> {
  // ...
}
```

### 5. 测试并发场景
对于可能并发执行的代码，测试并发安全性。

```typescript
test('应该处理并发操作', async () => {
  const promises = Array(10).fill(null).map(() => 
    accountService.addTokens(userId, 100, TransactionType.REWARD, '并发')
  );
  await Promise.all(promises);
  // ...
});
```

## CI/CD 集成

测试应该在 CI/CD 流程中自动运行：

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test --coverage
```

## 测试报告

测试完成后会生成覆盖率报告，包括：
- 语句覆盖率 (Statement Coverage)
- 分支覆盖率 (Branch Coverage)
- 函数覆盖率 (Function Coverage)
- 行覆盖率 (Line Coverage)

## 故障排查

### 测试失败常见原因

1. **数据未清理**: 确保每个测试后清理数据
2. **异步操作未等待**: 使用 `async/await` 等待异步操作
3. **时序问题**: 避免依赖执行顺序的测试
4. **环境变量**: 确保测试环境配置正确

### 调试技巧

```typescript
test('调试测试', async () => {
  const result = await service.method();
  console.log('Debug:', result); // 临时调试输出
  expect(result).toBeDefined();
});
```

## 维护指南

### 添加新测试

1. 在相应的测试文件中添加新的 `describe` 块或 `test` 块
2. 遵循现有的测试结构和命名规范
3. 确保新测试能够独立运行

### 更新现有测试

1. 当业务逻辑变更时，及时更新相关测试
2. 保持测试的准确性和可读性
3. 运行完整测试套件确保没有破坏其他测试

### 测试重构

1. 定期重构测试代码，消除重复
2. 提取公共辅助函数
3. 改进测试的可读性和维护性

## 联系方式

如有测试相关问题，请联系测试工程师或开发团队。
