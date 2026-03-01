/**
 * Playwright 配置文件
 * 用于 E2E 测试和截图自动化
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',
  
  // 测试文件匹配模式
  testMatch: '**/*.test.ts',
  
  // 全局超时设置
  timeout: 30000,
  
  // 期望超时
  expect: {
    timeout: 5000
  },
  
  // 完全并行运行测试
  fullyParallel: true,
  
  // CI 上失败时禁止 test.only
  forbidOnly: !!process.env.CI,
  
  // CI 上重试失败测试
  retries: process.env.CI ? 2 : 0,
  
  // CI 上限制并行工作者
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter 配置
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // 共享配置
  use: {
    // 基础 URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // 收集失败测试的追踪
    trace: 'on-first-retry',
    
    // 截图配置
    screenshot: 'only-on-failure',
    
    // 视频配置
    video: 'retain-on-failure',
  },

  // 配置项目（不同浏览器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // 移动端测试（可选）
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // 运行本地开发服务器（可选）
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
