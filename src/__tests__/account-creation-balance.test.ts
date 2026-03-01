/**
 * 账户创建余额测试
 * 验证 Issue #236: 账户创建时初始余额重复计算 Bug
 */

import { accountModel } from '../models/Account';
import { accountService } from '../services/account.service';

describe('账户创建余额测试 - Issue #236', () => {
  describe('createAccount 初始余额验证', () => {
    test('账户创建时初始余额应该正确，不应重复计算', async () => {
      const userId = 'test-user-initial-balance';
      const initialBalance = 1000;

      // 创建账户并设置初始余额
      const result = await accountService.createAccount(userId, initialBalance);

      // 验证返回的初始余额
      expect(result.initialBalance).toBe(initialBalance);

      // 验证实际账户余额
      const account = accountModel.getAccountByUserId(userId);
      expect(account).toBeDefined();
      expect(account!.balance).toBe(initialBalance); // 应该是 1000，不是 2000

      // 验证 totalEarned 也正确（应该等于初始余额）
      expect(account!.totalEarned).toBe(initialBalance);

      console.log(`✅ 账户创建成功，余额正确: ${account!.balance} (期望: ${initialBalance})`);
    });

    test('账户创建时不传初始余额，默认为 0', async () => {
      const userId = 'test-user-no-initial-balance';

      // 创建账户不传初始余额
      const result = await accountService.createAccount(userId);

      // 验证返回的初始余额为 0
      expect(result.initialBalance).toBe(0);

      // 验证实际账户余额为 0
      const account = accountModel.getAccountByUserId(userId);
      expect(account).toBeDefined();
      expect(account!.balance).toBe(0);
      expect(account!.totalEarned).toBe(0);

      console.log(`✅ 账户创建成功（无初始余额），余额正确: ${account!.balance}`);
    });

    test('账户创建时传对象形式的初始余额应该正确', async () => {
      const userId = 'test-user-object-initial-balance';
      const initialBalance = 500;

      // 使用对象形式传递初始余额
      const result = await accountService.createAccount(userId, {
        email: 'test@example.com',
        nickname: 'TestUser',
        initialBalance: initialBalance,
      });

      // 验证返回的初始余额
      expect(result.initialBalance).toBe(initialBalance);

      // 验证实际账户余额
      const account = accountModel.getAccountByUserId(userId);
      expect(account).toBeDefined();
      expect(account!.balance).toBe(initialBalance); // 应该是 500，不是 1000

      console.log(
        `✅ 账户创建成功（对象形式），余额正确: ${account!.balance} (期望: ${initialBalance})`
      );
    });

    test('重复创建同一账户应该返回已存在的账户，不重复增加余额', async () => {
      const userId = 'test-user-duplicate-creation';
      const initialBalance = 1000;

      // 第一次创建账户
      const result1 = await accountService.createAccount(userId, initialBalance);
      expect(result1.initialBalance).toBe(initialBalance);

      // 第二次创建同一账户
      const result2 = await accountService.createAccount(userId, initialBalance);
      expect(result2.initialBalance).toBe(initialBalance);

      // 验证余额没有被重复增加
      const account = accountModel.getAccountByUserId(userId);
      expect(account).toBeDefined();
      expect(account!.balance).toBe(initialBalance); // 应该还是 1000，不是 2000

      console.log(`✅ 重复创建账户，余额未重复计算: ${account!.balance} (期望: ${initialBalance})`);
    });
  });

  describe('AccountModel createAccount 验证', () => {
    test('AccountModel.createAccount 应该正确设置初始余额', async () => {
      const userId = 'test-model-initial-balance';
      const initialBalance = 2000;

      // 直接调用 AccountModel 创建账户
      const account = await accountModel.createAccount(userId, initialBalance);

      // 验证账户余额
      expect(account.balance).toBe(initialBalance);
      expect(account.totalEarned).toBe(initialBalance);
      expect(account.frozenBalance).toBe(0);

      console.log(
        `✅ AccountModel 创建账户成功，余额正确: ${account.balance} (期望: ${initialBalance})`
      );
    });

    test('AccountModel.createAccount 不传初始余额应该默认为 0', async () => {
      const userId = 'test-model-no-initial-balance';

      // 不传初始余额
      const account = await accountModel.createAccount(userId);

      // 验证账户余额为 0
      expect(account.balance).toBe(0);
      expect(account.totalEarned).toBe(0);
      expect(account.frozenBalance).toBe(0);

      console.log(`✅ AccountModel 创建账户成功（无初始余额），余额正确: ${account.balance}`);
    });
  });

  describe('边界情况测试', () => {
    test('初始余额为 0 时应该正确处理', async () => {
      const userId = 'test-user-zero-initial-balance';

      const result = await accountService.createAccount(userId, 0);

      expect(result.initialBalance).toBe(0);

      const account = accountModel.getAccountByUserId(userId);
      expect(account!.balance).toBe(0);
      expect(account!.totalEarned).toBe(0);
    });

    test('初始余额为负数时应该正确处理', async () => {
      const userId = 'test-user-negative-initial-balance';

      // 负数初始余额应该被接受（或根据业务逻辑拒绝）
      await accountService.createAccount(userId, -100);

      const account = accountModel.getAccountByUserId(userId);
      // 根据当前实现，负数余额可能被接受
      expect(account!.balance).toBe(-100);
    });
  });
});
