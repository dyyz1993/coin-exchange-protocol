# 测试框架配置指南

## 概述

本项目使用 **Jest** 作为统一的测试框架。

## 测试框架历史

项目之前混用了三种测试框架：
- **Jest** - 主要测试框架
- **Bun Test** - 部分集成测试使用
- **Vitest** - 少数测试文件使用

**2026-03-01**: 统一所有测试文件使用 Jest，移除 bun:test 和 vitest 导入。

## 配置文件

### Jest 配置 (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  // ... 完整配置见 jest.config.js
};
```

### 测试设置文件

- `tests/setup/global-setup.ts` - 全局初始化
- `tests/setup/global-teardown.ts` - 全局清理
- `tests/setup/test-setup.ts` - 测试环境配置

## 编写测试

### ✅ 正确的导入方式

```typescript
// Jest 全局变量自动可用，无需导入
describe('MyTest', () => {
  test('should work', () => {
    expect(true).toBe(true);
  });
  
  beforeEach(() => {
    // 设置代码
  });
  
  afterEach(() => {
    // 清理代码
  });
});
```

### ❌ 错误的导入方式（已移除）

```typescript
// ❌ 不要使用 bun:test
import { describe, test, expect } from 'bun:test';

// ❌ 不要使用 vitest
import { describe, it, expect } from 'vitest';
```

## 运行测试

### 命令

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 使用 Bun 运行（备用）
npm run test:bun
```

### 测试覆盖率

Jest 配置了以下覆盖率阈值：
- 分支覆盖率: 70%
- 函数覆盖率: 70%
- 行覆盖率: 70%
- 语句覆盖率: 70%

## 测试文件结构

```
project/
├── src/
│   └── __tests__/           # 单元测试
│       ├── integration/     # 集成测试
│       └── *.test.ts        # 其他测试
└── tests/
    ├── setup/               # 测试设置
    ├── integration/         # 集成测试
    ├── services/            # 服务测试
    └── models/              # 模型测试
```

## 常见问题

### 1. Jest 找不到测试文件

确保测试文件名匹配以下模式：
- `*.test.ts`
- `*.spec.ts`
- `__tests__/*.ts`

### 2. TypeScript 错误

确保安装了 Jest 类型：
```bash
npm install --save-dev @types/jest
```

### 3. 模块路径别名

Jest 配置了以下路径别名（与 tsconfig.json 保持一致）：
- `@/*` → `<rootDir>/src/*`
- `@types/*` → `<rootDir>/src/types/*`
- `@services/*` → `<rootDir>/src/services/*`

## 最佳实践

1. **测试命名**: 使用描述性的测试名称
   ```typescript
   test('should return 404 when user not found', () => {
     // ...
   });
   ```

2. **测试隔离**: 每个测试应该独立运行
   ```typescript
   beforeEach(() => {
     // 重置状态
   });
   ```

3. **断言清晰**: 使用明确的断言
   ```typescript
   expect(result.status).toBe(200);
   expect(result.data).toHaveProperty('id');
   ```

4. **异步测试**: 正确处理异步代码
   ```typescript
   test('async operation', async () => {
     const result = await service.getData();
     expect(result).toBeDefined();
   });
   ```

## 依赖版本

```json
{
  "jest": "^29.7.0",
  "ts-jest": "^29.1.2",
  "@types/jest": "^29.5.12"
}
```

## 迁移日志

### 2026-03-01 - 统一测试框架为 Jest

**修改的文件：**
- `tests/integration/e2e.test.ts` - 移除 bun:test 导入
- `tests/integration/route-mapping.test.ts` - 移除 bun:test 导入
- `tests/integration/freeze.controller.test.ts` - 移除 bun:test 导入
- `tests/integration/api.test.ts` - 移除 bun:test 导入
- `tests/services/account.service.test.ts` - 移除 bun:test 导入
- `tests/services/freeze.service.test.ts` - 移除 bun:test 导入
- `tests/services/task.service.test.ts` - 移除 bun:test 导入
- `tests/services/TokenService.test.ts` - 移除 bun:test 导入
- `tests/services/airdrop.service.test.ts` - 移除 bun:test 导入
- `src/__tests__/integration/api.test.ts` - 移除 vitest 导入

**结果：**
- ✅ 所有测试文件统一使用 Jest
- ✅ `npm test` 可以运行
- ⚠️ 部分测试存在 TypeScript 错误（非框架问题）
