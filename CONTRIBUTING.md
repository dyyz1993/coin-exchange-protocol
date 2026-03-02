# 贡献指南

感谢您有兴趣为金币交易协议项目做出贡献！本文档将帮助您了解如何参与项目开发。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [报告 Bug](#报告-bug)
- [提交功能请求](#提交功能请求)
- [开发环境搭建](#开发环境搭建)
- [代码风格规范](#代码风格规范)
- [Pull Request 流程](#pull-request-流程)
- [Commit Message 规范](#commit-message-规范)

## 行为准则

本项目采用贡献者公约作为行为准则。参与此项目即表示您同意遵守其条款。请阅读 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 了解详情。

## 如何贡献

### 贡献方式

- 报告 Bug
- 讨论代码问题
- 提交新功能建议
- 审查 Pull Request
- 提交代码修复或新功能
- 完善文档

## 报告 Bug

### 提交 Bug 前的检查清单

在提交 Bug 报告之前，请确保：

1. **搜索现有 Issues** - 避免[重复 Issues](https://github.com/dyyz1993/coin-exchange-protocol/issues?q=is%3Aissue)
2. **确认是 Bug** - 确保这不是预期行为
3. **测试最新版本** - 确认问题在最新 master 分支上仍然存在
4. **收集调试信息** - 准备好复现步骤和错误日志

### Bug 报告模板

提交 Bug 时，请使用以下模板：

```markdown
## Bug 描述
清晰简洁地描述这个 Bug。

## 复现步骤
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 预期行为
描述您期望发生的情况。

## 实际行为
描述实际发生的情况。

## 截图
如果适用，添加截图帮助解释问题。

## 环境信息
- OS: [例如 Windows 10, macOS 12]
- Node.js 版本: [例如 18.17.0]
- 项目版本: [例如 v1.0.0]

## 其他信息
添加任何其他关于此问题的信息。
```

### Bug 报告示例

```markdown
## Bug 描述
用户在领取空投时，即使空投总金额已耗尽，仍能成功领取并获得金币。

## 复现步骤
1. 创建一个总金额为 100 金币的空投活动
2. 使用账户 A 领取 100 金币
3. 使用账户 B 再次尝试领取
4. 发现账户 B 仍然能成功领取，尽管空投已耗尽

## 预期行为
当空投总金额耗尽时，应返回错误提示："空投金额已耗尽"。

## 实际行为
空投金额耗尽后，用户仍能成功领取。

## 环境信息
- OS: macOS 13.0
- Node.js: 18.17.0
- 项目版本: v1.2.0
```

## 提交功能请求

### 提交前的检查清单

1. **搜索现有 Issues** - 确认该功能尚未被建议
2. **思考功能价值** - 该功能是否对大多数用户有用
3. **考虑实现方案** - 如果可能，提供实现思路

### 功能请求模板

```markdown
## 功能描述
清晰简洁地描述您希望添加的功能。

## 问题陈述
这个功能解决了什么问题？请描述当前遇到的困扰。
例如：我总是感到沮丧，当 [...]

## 建议的解决方案
描述您希望如何实现这个功能。

## 替代方案
描述您考虑过的其他解决方案。

## 附加信息
- 这个功能是否在其他项目中存在？请提供参考链接
- 添加任何其他相关信息或截图

## 优先级建议
- [ ] P0 - 紧急
- [ ] P1 - 高优先级
- [ ] P2 - 中等优先级
- [ ] P3 - 低优先级
```

## 开发环境搭建

### 系统要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 安装步骤

1. **Fork 项目**
   ```bash
   # 在 GitHub 页面右上角点击 "Fork"
   ```

2. **克隆仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/coin-exchange-protocol.git
   cd coin-exchange-protocol
   ```

3. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/dyyz1993/coin-exchange-protocol.git
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

5. **配置 Git Hooks**
   ```bash
   npm run prepare
   ```

6. **运行测试**
   ```bash
   npm test
   ```

7. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 项目结构

```
coin-exchange-protocol/
├── src/
│   ├── controllers/    # 控制器层
│   ├── services/       # 业务逻辑层
│   ├── models/         # 数据模型
│   ├── routes/         # 路由定义
│   ├── middlewares/    # 中间件
│   ├── utils/          # 工具函数
│   └── validators/     # 输入验证
├── tests/
│   ├── unit/           # 单元测试
│   ├── integration/    # 集成测试
│   └── e2e/            # 端到端测试
├── docs/               # 文档
└── public/             # 静态资源
```

## 代码风格规范

### TypeScript 规范

#### 命名约定

```typescript
// ✅ 类名使用 PascalCase
class AccountService {
  // ✅ 私有属性使用下划线前缀
  private _balance: number;
  
  // ✅ 方法名使用 camelCase
  public async createAccount(): Promise<void> {
    // ...
  }
}

// ✅ 接口名使用 PascalCase，不带 I 前缀
interface Account {
  id: string;
  balance: number;
}

// ✅ 类型别名使用 PascalCase
type AccountStatus = 'active' | 'frozen' | 'closed';

// ✅ 常量使用 UPPER_SNAKE_CASE
const MAX_TRANSFER_AMOUNT = 10000;

// ✅ 枚举使用 PascalCase，成员使用 UPPER_CASE
enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}
```

#### 类型安全

```typescript
// ✅ 避免使用 any
function processAccount(account: Account): void {
  // ...
}

// ❌ 不要使用 any
function processAccount(account: any): void {
  // ...
}

// ✅ 使用严格类型检查
interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

function transfer(request: TransferRequest): Promise<void> {
  // ...
}

// ✅ 使用可选链和空值合并
const balance = account?.balance ?? 0;

// ✅ 明确返回类型
async function getAccount(id: string): Promise<Account | null> {
  // ...
}
```

#### 异步处理

```typescript
// ✅ 使用 async/await
async function transferFunds(from: string, to: string, amount: number): Promise<void> {
  try {
    await accountService.transfer(from, to, amount);
  } catch (error) {
    logger.error('Transfer failed', { from, to, amount, error });
    throw error;
  }
}

// ❌ 避免回调地狱
function transferFunds(from: string, to: string, amount: number, callback: Function) {
  accountService.transfer(from, to, amount, (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}
```

### 代码组织

#### 文件结构

```typescript
// account.service.ts

// 1. 导入依赖
import { Account } from '../models/account';
import { AccountRepository } from '../repositories/account.repository';
import { Logger } from '../utils/logger';

// 2. 定义接口
interface CreateAccountRequest {
  userId: string;
  initialBalance: number;
}

// 3. 导出类
export class AccountService {
  // 3.1 私有属性
  private logger = new Logger(AccountService.name);
  
  constructor(private accountRepository: AccountRepository) {}
  
  // 3.2 公共方法
  async createAccount(request: CreateAccountRequest): Promise<Account> {
    // ...
  }
  
  // 3.3 私有方法
  private validateRequest(request: CreateAccountRequest): void {
    // ...
  }
}
```

#### 注释规范

```typescript
/**
 * 转账服务 - 处理账户间资金转移
 * 
 * @class TransferService
 * @description 提供转账、查询交易历史等功能
 */
export class TransferService {
  /**
   * 执行账户间转账
   * 
   * @param fromAccountId - 转出账户ID
   * @param toAccountId - 转入账户ID
   * @param amount - 转账金额（必须大于0）
   * @returns 转账交易记录
   * @throws {InsufficientBalanceError} 余额不足
   * @throws {AccountNotFoundError} 账户不存在
   * 
   * @example
   * ```typescript
   * const transaction = await transferService.transfer(
   *   'account-1',
   *   'account-2',
   *   100
   * );
   * ```
   */
  async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ): Promise<Transaction> {
    // 实现...
  }
}
```

### ESLint 和 Prettier

项目使用 ESLint 和 Prettier 进行代码格式化。

```bash
# 运行 lint 检查
npm run lint

# 自动修复 lint 问题
npm run lint:fix

# 格式化代码
npm run format
```

**配置文件：**
- `.eslintrc.js` - ESLint 配置
- `.prettierrc` - Prettier 配置

## Pull Request 流程

### 创建 PR 前的准备

1. **同步最新代码**
   ```bash
   git fetch upstream
   git checkout master
   git merge upstream/master
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **编写代码和测试**
   - 确保代码符合规范
   - 添加必要的测试
   - 运行测试确保通过

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

5. **推送到 GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

### PR 标题规范

使用与 Commit Message 相同的格式：

```
<type>(<scope>): <subject>
```

**示例：**
- `feat(account): 添加账户冻结功能`
- `fix(airdrop): 修复空投金额耗尽检查`
- `docs(readme): 更新安装指南`

### PR 描述模板

```markdown
## 变更类型
- [ ] Bug 修复 (non-breaking change which fixes an issue)
- [ ] 新功能 (non-breaking change which adds functionality)
- [ ] 破坏性变更 (fix or feature that would cause existing functionality to change)
- [ ] 文档更新

## 关联 Issue
Fixes #(issue number)

## 变更描述
清晰描述本次 PR 的变更内容。

## 变更原因
解释为什么需要这些变更。

## 测试计划
- [ ] 单元测试已通过
- [ ] 集成测试已通过
- [ ] 手动测试已完成

### 测试步骤
1. ...
2. ...

## 截图（如适用）
添加截图帮助审查者理解变更。

## 检查清单
- [ ] 代码符合项目风格规范
- [ ] 已添加必要的注释
- [ ] 文档已更新
- [ ] 没有新增警告
- [ ] 测试已通过
- [ ] 所有讨论已解决
```

### PR 审查流程

1. **自动检查**
   - CI/CD 流水线自动运行
   - 代码质量检查
   - 测试覆盖率检查

2. **代码审查**
   - 至少需要 1 位审查者批准
   - 解决所有审查意见
   - 通过所有自动检查

3. **合并要求**
   - 所有 CI 检查通过
   - 至少 1 个批准
   - 没有未解决的审查意见
   - 分支与 master 同步

### PR 合并后

1. **删除分支**
   ```bash
   # 本地分支
   git branch -d feature/your-feature-name
   
   # 远程分支（GitHub 会自动提示）
   git push origin --delete feature/your-feature-name
   ```

2. **同步主仓库**
   ```bash
   git checkout master
   git pull upstream master
   ```

## Commit Message 规范

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat(account): 添加账户冻结功能 |
| `fix` | Bug 修复 | fix(airdrop): 修复空投金额检查 |
| `docs` | 文档更新 | docs(readme): 更新安装指南 |
| `style` | 代码格式（不影响功能） | style: 格式化代码 |
| `refactor` | 重构（不是新功能也不是修复） | refactor(service): 优化账户服务 |
| `test` | 测试相关 | test(account): 添加账户服务测试 |
| `chore` | 构建过程或辅助工具的变动 | chore: 更新依赖版本 |
| `perf` | 性能优化 | perf(transfer): 优化转账性能 |
| `ci` | CI 配置文件和脚本的变动 | ci: 添加 GitHub Actions 配置 |
| `revert` | 回退之前的 commit | revert: 回退某个提交 |

### Scope 范围

常见的 scope：

- `account` - 账户相关
- `airdrop` - 空投相关
- `task` - 任务系统
- `freeze` - 冻结管理
- `transfer` - 转账功能
- `api` - API 相关
- `test` - 测试相关
- `docs` - 文档相关
- `config` - 配置相关

### Subject 主题

- 使用简洁、描述性的语言
- 不以大写字母开头
- 不以句号结尾
- 使用中文或英文（项目统一即可）

### Body 内容（可选）

- 解释 **为什么** 做这个改动
- 与之前的行为对比
- 每行不超过 72 个字符

### Footer 页脚（可选）

- **Breaking Changes**: 破坏性变更说明
- **Closes**: 关联的 Issue

### 完整示例

#### 示例 1：新功能

```
feat(account): 添加账户冻结功能

- 新增冻结/解冻 API 接口
- 添加冻结状态检查中间件
- 实现自动解冻定时任务

冻结的账户无法进行转账、领取空投等操作，
只能查询余额。管理员可以手动解冻或设置自动解冻时间。

Closes #123
```

#### 示例 2：Bug 修复

```
fix(airdrop): 修复空投金额耗尽后仍能领取的问题

问题：当空投总金额耗尽后，用户仍能成功领取空投，
导致空投超发。

原因：claimAirdrop 方法没有检查空投总金额是否已耗尽。

修复：在领取前检查空投总金额，如果已耗尽则返回错误。

Fixes #201
```

#### 示例 3：破坏性变更

```
refactor(api): 重构账户 API 接口

统一 API 响应格式，所有接口现在返回：
{
  "success": boolean,
  "data": any,
  "error": string | null
}

BREAKING CHANGE:
- GET /api/accounts/:id 响应格式变更
- POST /api/accounts 请求参数变更
- 所有错误响应格式变更

迁移指南请参考 docs/api-migration-guide.md
```

### Git Hooks

项目使用 Husky 配置了 Git Hooks：

- **pre-commit**: 运行 lint-staged，自动格式化提交的代码
- **commit-msg**: 检查 commit message 格式
- **pre-push**: 运行测试

如果需要跳过 hooks（不推荐）：

```bash
git commit --no-verify -m "..."
```

## 需要帮助？

如果您在贡献过程中遇到任何问题，可以：

1. 查阅 [项目文档](docs/)
2. 在 [Discussions](https://github.com/dyyz1993/coin-exchange-protocol/discussions) 中提问
3. 联系维护者

---

再次感谢您的贡献！🎉
