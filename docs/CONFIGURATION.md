# 项目配置文档

本文档说明项目的配置文件和环境设置。

## 📦 配置文件列表

### 1. package.json
Node.js 项目配置文件，包含：
- 项目元数据
- 脚本命令
- 依赖管理
- lint-staged 配置

**主要脚本：**
```bash
npm run test          # 运行 Jest 测试
npm run test:watch    # 监听模式运行测试
npm run test:coverage # 生成测试覆盖率报告
npm run lint          # 运行 ESLint
npm run lint:fix      # 自动修复 lint 问题
npm run type-check    # TypeScript 类型检查
npm run format        # 格式化代码
```

### 2. tsconfig.json
TypeScript 编译器配置，包含：
- 编译选项
- 类型检查规则
- 模块解析配置
- 路径别名

**路径别名：**
```typescript
import { Something } from '@/types/something';
import { Service } from '@services/service';
```

### 3. jest.config.js
Jest 测试框架配置，包含：
- 测试环境设置
- 文件匹配模式
- 覆盖率配置
- 模块路径映射

**测试命令：**
```bash
jest                  # 运行所有测试
jest --watch          # 监听模式
jest --coverage       # 生成覆盖率报告
jest --detectOpenHandles # 检测未关闭的句柄
```

### 4. .eslintrc.js
ESLint 代码检查配置，包含：
- TypeScript 规则
- Import 规则
- 最佳实践规则

**检查命令：**
```bash
eslint 'src/**/*.{ts,tsx}'     # 检查代码
eslint --fix 'src/**/*.ts'     # 自动修复
```

### 5. .prettierrc
Prettier 代码格式化配置，包含：
- 代码风格设置
- 格式化规则

**格式化命令：**
```bash
prettier --write 'src/**/*.ts' # 格式化代码
```

## 🔧 开发环境设置

### 安装依赖
```bash
# 使用 npm
npm install

# 或使用 bun
bun install
```

### 运行测试
```bash
# Jest 测试
npm test

# Bun 测试（原生）
bun test
```

### 代码检查
```bash
# 运行 lint
npm run lint

# 类型检查
npm run type-check
```

## 📝 Git Hooks

项目使用 Husky 和 lint-staged 在提交前自动运行检查：

**Pre-commit Hook：**
- 运行 ESLint 检查
- 自动格式化代码
- 运行相关测试

## 🎯 覆盖率目标

| 指标 | 目标 | 说明 |
|------|------|------|
| Branches | 70% | 分支覆盖率 |
| Functions | 70% | 函数覆盖率 |
| Lines | 70% | 行覆盖率 |
| Statements | 70% | 语句覆盖率 |

## 🚨 故障排查

### Jest 测试失败
1. 检查 TypeScript 配置
2. 确认所有依赖已安装
3. 查看测试设置文件

### ESLint 错误
1. 运行 `npm run lint:fix` 自动修复
2. 检查 `.eslintrc.js` 规则配置
3. 确认导入路径正确

### TypeScript 错误
1. 运行 `npm run type-check`
2. 检查 `tsconfig.json` 配置
3. 确认类型定义文件存在

## 📚 相关文档

- [测试文档](./testing.md)
- [开发指南](./development.md)
- [API 文档](./api-reference.md)

## 🔄 更新配置

### 更新依赖
```bash
npm update
npm outdated
```

### 更新 TypeScript
```bash
npm install typescript@latest --save-dev
```

### 更新 ESLint 规则
编辑 `.eslintrc.js` 文件中的 `rules` 部分。

## ⚙️ 环境变量

创建 `.env` 文件（不提交到 Git）：
```env
NODE_ENV=development
TEST_TIMEOUT=10000
```

## 📌 最佳实践

1. **提交前检查**
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```

2. **保持依赖更新**
   ```bash
   npm update
   npm audit fix
   ```

3. **遵循代码风格**
   - 使用 Prettier 格式化
   - 遵循 ESLint 规则
   - 编写单元测试

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 遵循代码规范
4. 运行所有测试
5. 提交 Pull Request

---

**维护者**: 测试工程师
**最后更新**: 2026-03-01
