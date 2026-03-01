# E2E 测试截图

本目录包含 E2E 测试自动截取的页面截图。

## 📸 截图文件

### 必需截图（4 张）

1. **account.png** - 账户管理界面
   - 展示账户列表、余额、状态等信息
   - 路由：GET /api/account

2. **freeze.png** - 冻结管理界面
   - 展示冻结账户列表、冻结原因、解冻时间等
   - 路由：GET /api/account/frozen

3. **transactions.png** - 交易记录界面
   - 展示交易历史、交易状态、交易金额等
   - 路由：GET /api/transaction

4. **api-docs.png** - API 文档页面
   - 展示 Swagger UI 文档界面
   - 路由：GET /api-docs

### 额外截图（2 张）

5. **home.png** - 主页
   - 系统首页，展示概览信息

6. **dashboard.png** - 用户仪表板
   - 用户个人仪表板，展示账户概览

## 🚀 如何生成截图

### 方法 1: 运行 E2E 测试

```bash
# 安装依赖
bun install

# 安装 Playwright 浏览器
bunx playwright install

# 运行截图测试
bunx playwright test tests/e2e/screenshot.test.ts
```

### 方法 2: 手动截图

如果前端页面已准备好，可以手动访问以下页面并截图：

- http://localhost:3000/account
- http://localhost:3000/freeze
- http://localhost:3000/transactions
- http://localhost:3000/api-docs

## 📝 截图规范

- **分辨率**：1920 x 1080（桌面端）
- **格式**：PNG
- **全页截图**：是（包含滚动内容）
- **文件大小**：< 2MB（建议）

## 🔗 相关文档

- [E2E 测试脚本](../../tests/e2e/screenshot.test.ts)
- [Playwright 配置](../../playwright.config.ts)
- [测试文档](../testing.md)

## 📅 最后更新

- 创建时间：2026-03-01
- 创建者：测试工程师
- 关联 Issue：#136
