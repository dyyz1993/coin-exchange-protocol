/**
 * E2E 测试 - 自动截图功能
 * 
 * 功能：截取关键页面的截图，用于文档和验证
 * 关联 Issue: #136
 * 
 * 截图目标：
 * 1. 账户管理界面 - account.png
 * 2. 冻结管理界面 - freeze.png
 * 3. 交易记录界面 - transactions.png
 * 4. API 文档页面 - api-docs.png
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';

// 截图保存目录
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/screenshots');

// 基础 URL（根据环境配置）
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * 测试配置
 */
test.describe('E2E 截图测试套件', () => {
  
  test.beforeEach(async ({ page }) => {
    // 设置视口大小，确保截图一致性
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  /**
   * 测试 1: 账户管理界面截图
   */
  test('截取账户管理界面', async ({ page }) => {
    console.log('📸 正在截取账户管理界面...');
    
    // 导航到账户管理页面
    await page.goto(`${BASE_URL}/account`);
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 等待主要元素出现
    await page.waitForSelector('[data-testid="account-list"]', { timeout: 10000 });
    
    // 截图
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'account.png'),
      fullPage: true
    });
    
    console.log('✅ 账户管理界面截图完成：account.png');
    
    // 验证截图文件存在
    const fs = require('fs');
    expect(fs.existsSync(path.join(SCREENSHOTS_DIR, 'account.png'))).toBeTruthy();
  });

  /**
   * 测试 2: 冻结管理界面截图
   */
  test('截取冻结管理界面', async ({ page }) => {
    console.log('📸 正在截取冻结管理界面...');
    
    // 导航到冻结管理页面
    await page.goto(`${BASE_URL}/freeze`);
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 等待主要元素出现
    await page.waitForSelector('[data-testid="freeze-list"]', { timeout: 10000 });
    
    // 截图
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'freeze.png'),
      fullPage: true
    });
    
    console.log('✅ 冻结管理界面截图完成：freeze.png');
    
    // 验证截图文件存在
    const fs = require('fs');
    expect(fs.existsSync(path.join(SCREENSHOTS_DIR, 'freeze.png'))).toBeTruthy();
  });

  /**
   * 测试 3: 交易记录界面截图
   */
  test('截取交易记录界面', async ({ page }) => {
    console.log('📸 正在截取交易记录界面...');
    
    // 导航到交易记录页面
    await page.goto(`${BASE_URL}/transactions`);
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 等待主要元素出现
    await page.waitForSelector('[data-testid="transaction-list"]', { timeout: 10000 });
    
    // 截图
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'transactions.png'),
      fullPage: true
    });
    
    console.log('✅ 交易记录界面截图完成：transactions.png');
    
    // 验证截图文件存在
    const fs = require('fs');
    expect(fs.existsSync(path.join(SCREENSHOTS_DIR, 'transactions.png'))).toBeTruthy();
  });

  /**
   * 测试 4: API 文档页面截图
   */
  test('截取 API 文档页面', async ({ page }) => {
    console.log('📸 正在截取 API 文档页面...');
    
    // 导航到 API 文档页面
    await page.goto(`${BASE_URL}/api-docs`);
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 等待主要元素出现（通常是 Swagger UI）
    await page.waitForSelector('.swagger-ui', { timeout: 10000 });
    
    // 截图
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'api-docs.png'),
      fullPage: true
    });
    
    console.log('✅ API 文档页面截图完成：api-docs.png');
    
    // 验证截图文件存在
    const fs = require('fs');
    expect(fs.existsSync(path.join(SCREENSHOTS_DIR, 'api-docs.png'))).toBeTruthy();
  });

  /**
   * 测试 5: 主页截图（额外）
   */
  test('截取主页', async ({ page }) => {
    console.log('📸 正在截取主页...');
    
    // 导航到主页
    await page.goto(BASE_URL);
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'home.png'),
      fullPage: true
    });
    
    console.log('✅ 主页截图完成：home.png');
  });

  /**
   * 测试 6: 用户仪表板截图（额外）
   */
  test('截取用户仪表板', async ({ page }) => {
    console.log('📸 正在截取用户仪表板...');
    
    // 导航到仪表板页面
    await page.goto(`${BASE_URL}/dashboard`);
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 等待主要元素出现
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    // 截图
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'dashboard.png'),
      fullPage: true
    });
    
    console.log('✅ 用户仪表板截图完成：dashboard.png');
  });
});

/**
 * 辅助函数：等待页面稳定
 */
async function waitForPageStable(page: Page, timeout: number = 5000) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  
  // 额外等待，确保动态内容加载完成
  await page.waitForTimeout(1000);
}

/**
 * 辅助函数：模拟登录（如果需要）
 */
async function mockLogin(page: Page) {
  // 如果页面需要认证，可以在这里模拟登录
  // 例如：
  // await page.goto(`${BASE_URL}/login`);
  // await page.fill('[name="username"]', 'testuser');
  // await page.fill('[name="password"]', 'testpass');
  // await page.click('[type="submit"]');
  // await page.waitForNavigation();
}
