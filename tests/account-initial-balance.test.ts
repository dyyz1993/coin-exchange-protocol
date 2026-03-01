/**
 * 测试账户初始余额功能
 * 验证修复：AccountController.createAccount 参数不匹配问题
 */

import { accountController } from '../src/controllers/account.controller';
import { accountModel } from '../src/models/Account';

describe('Account Initial Balance', () => {
  beforeEach(() => {
    // 清空账户数据（如果需要）
  });

  test('创建账户时应正确设置初始余额', async () => {
    const userId = 'test-user-100';
    const initialBalance = 100;

    // 创建账户，设置初始余额为 100
    await accountController.createAccount({
      userId,
      initialBalance,
    });

    // 查询余额，验证初始余额是否正确（应该是 100，不是 200）
    const balanceResult = await accountController.getBalance({ userId });

    if ('balance' in balanceResult) {
      expect(balanceResult.balance).toBe(initialBalance);
    } else {
      fail('Failed to get balance');
    }
  });

  test('不设置初始余额时，默认为 0', async () => {
    const userId = 'test-user-default';

    // 创建账户，不设置初始余额
    await accountController.createAccount({
      userId,
    });

    // 查询余额
    const balanceResult = await accountController.getBalance({ userId });

    if ('balance' in balanceResult) {
      expect(balanceResult.balance).toBe(0);
    } else {
      fail('Failed to get balance');
    }
  });

  test('初始余额为负数时应返回错误', async () => {
    const userId = 'test-user-negative';

    // 尝试创建账户，设置负数的初始余额
    const result = await accountController.createAccount({
      userId,
      initialBalance: -100,
    });

    // 应该返回错误
    expect(result.success).toBe(false);
    expect(result.error).toContain('无效的初始余额');
  });

  test('AccountModel 应正确处理初始余额', async () => {
    const userId = 'test-model-user';
    const initialBalance = 500;

    // 使用 Model 直接创建账户
    const account = await accountModel.createAccount(userId, initialBalance);

    // 验证账户属性
    expect(account.balance).toBe(initialBalance);
    expect(account.totalEarned).toBe(initialBalance);
    expect(account.frozenBalance).toBe(0);
    expect(account.userId).toBe(userId);
  });
});
