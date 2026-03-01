# E2E 测试套件

本目录包含端到端（E2E）测试，使用 Playwright 框架。

## 📁 目录结构

```
tests/e2e/
├── screenshot.test.ts  # 截图自动化测试
└── README.md          # 本文件
```

## 🚀 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 安装 Playwright 浏览器

```bash
bunx playwright install
```

### 3. 运行测试

```bash
# 运行所有 E2E 测试
bun run test:e2e

# 运行截图测试
bun run test:screenshots

# 使用 UI 模式运行测试（推荐用于调试）
bun run test:e2e:ui
```

## 📸 截图测试

### 功能

- 自动访问关键页面
- 截取全页截图
- 保存到 `docs/screenshots/` 目录
- 验证截图文件生成

### 截图目标

1. 账户管理界面 - `account.png`
2. 冻结管理界面 - `freeze.png`
3. 交易记录界面 - `transactions.png`
4. API 文档页面 - `api-docs.png`
5. 主页 - `home.png`
6. 用户仪表板 - `dashboard.png`

### 配置

- **视口大小**：1920 x 1080
- **超时时间**：30 秒
- **重试次数**：2 次（CI 环境）
- **浏览器**：Chromium, Firefox, WebKit

## 🔧 配置文件

测试配置位于项目根目录的 `playwright.config.ts`。

### 关键配置

```typescript
{
  testDir: './tests/e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
}
```

## 📊 测试报告

测试完成后，报告将生成在：

- HTML 报告：`test-results/html/index.html`
- JSON 报告：`test-results/results.json`

## 🐛 调试技巧

### 1. 使用 UI 模式

```bash
bun run test:e2e:ui
```

### 2. 查看测试追踪

失败测试的追踪文件会保存在 `test-results/` 目录。

### 3. 查看视频

失败测试的视频会保存在 `test-results/` 目录。

### 4. 运行特定测试

```bash
bunx playwright test -g "截取账户管理界面"
```

## 📝 编写新测试

### 示例

```typescript
import { test, expect } from '@playwright/test';

test('我的新测试', async ({ page }) => {
  // 访问页面
  await page.goto('/my-page');
  
  // 等待元素
  await page.waitForSelector('[data-testid="my-element"]');
  
  // 执行操作
  await page.click('button');
  
  // 验证结果
  await expect(page.locator('.result')).toBeVisible();
  
  // 截图
  await page.screenshot({ path: 'docs/screenshots/my-page.png' });
});
```

## 🔗 相关资源

- [Playwright 官方文档](https://playwright.dev/)
- [测试文档](../../docs/testing.md)
- [截图文档](../../docs/screenshots/README.md)

## 📅 维护信息

- 创建时间：2026-03-01
- 创建者：测试工程师
- 关联 Issue：#136
