# 测试基础设施文档

## 测试框架

本项目支持两种测试框架：

### 1. Jest（主要测试框架）
- **配置文件**: `jest.config.js`
- **测试目录**: `src/__tests__/`
- **覆盖率目标**: > 80%

### 2. Bun Test（现有测试）
- **测试目录**: `tests/`
- **配置**: 内置 Bun 测试框架

## 目录结构

```
src/__tests__/
├── unit/              # 单元测试
│   └── account.test.ts
├── integration/       # 集成测试
│   └── api.test.ts
└── setup.ts          # 测试环境设置
```

## 运行测试

### Jest 测试

```bash
# 运行所有 Jest 测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 仅运行单元测试
npm run test:unit

# 仅运行集成测试
npm run test:integration
```

### Bun 测试

```bash
# 运行所有 Bun 测试
npm run test:bun
```

## 测试覆盖率

### 覆盖率目标
- **分支覆盖率**: > 80%
- **函数覆盖率**: > 80%
- **行覆盖率**: > 80%
- **语句覆盖率**: > 80%

### 查看覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告会生成在 `coverage/` 目录：
- `coverage/lcov-report/index.html` - HTML 报告
- `coverage/lcov.info` - LCOV 格式报告

## 编写测试

### 单元测试示例

```typescript
describe('账户服务', () => {
  test('应该成功创建账户', async () => {
    const result = await accountService.createAccount('user-001');
    expect(result.success).toBe(true);
  });
});
```

### 集成测试示例

```typescript
describe('账户 API', () => {
  test('GET /api/account/balance/:userId', async () => {
    const response = await fetch(`${baseUrl}/api/account/balance/${userId}`);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## 自定义匹配器

项目提供了自定义 Jest 匹配器：

### toBeValidAccount()
```typescript
expect(account).toBeValidAccount();
```

### toBeSuccessfulResponse()
```typescript
expect(response).toBeSuccessfulResponse();
```

## 已知问题

### Issue #47-48: 控制器方法缺失
- `AccountController.getTransactionHistory` 未实现
- `AccountController.transfer` 未实现
- `AccountController.freezeBalance` 未实现
- `AccountController.unfreezeBalance` 未实现

### Issue #49-50: 测试类型导入错误
- `e2e.test.ts` 导入 `Transaction` 类型失败

## 测试最佳实践

1. **隔离性**: 每个测试应该独立运行，不依赖其他测试
2. **可读性**: 使用清晰的描述和有意义的测试名称
3. **覆盖率**: 确保测试覆盖所有关键路径和边界条件
4. **性能**: 避免测试运行时间过长
5. **维护性**: 及时更新测试代码，保持与生产代码同步

## CI/CD 集成

测试会在以下情况自动运行：
- Pull Request 创建时
- 代码推送到主分支时
- 定期运行（可配置）

## 相关文档

- [Jest 官方文档](https://jestjs.io/)
- [Bun Test 文档](https://bun.sh/docs/cli/test)
- [测试最佳实践](https://testingjavascript.com/)
