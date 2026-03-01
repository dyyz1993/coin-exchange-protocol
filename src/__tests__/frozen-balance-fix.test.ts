/**
 * 冻结余额计算修复测试
 * 验证 Issue #200 修复：冻结余额计算逻辑问题
 */

import { accountModel } from '../models/Account';
import { accountService } from '../services/account.service';
import { tokenService } from '../services/TokenService';

describe('冻结余额计算修复测试 (Issue #200)', () => {
  const testUserId = 'test-user-frozen-fix';

  beforeEach(async () => {
    // 每个测试前重置账户状态
    const existingAccount = accountModel.getAccountByUserId(testUserId);
    if (!existingAccount) {
      await accountModel.createAccount(testUserId, 1000);
    }
  });

  describe('场景1: 用户A有1000金币，全部被冻结', () => {
    test('冻结全部余额后，availableBalance 应该为 0', async () => {
      // 冻结全部 1000
      await accountModel.freezeBalance(testUserId, 1000);

      // ✅ 使用 AccountService 查询
      const info = accountService.getAccountInfo(testUserId);
      expect(info).not.toBeNull();
      expect(info!.balance).toBe(1000); // 总余额不变
      expect(info!.frozenBalance).toBe(1000); // 冻结金额
      expect(info!.availableBalance).toBe(0); // 1000 - 1000 = 0

      // ✅ 使用 TokenService 查询
      const balance = tokenService.getBalance(testUserId);
      expect(balance.balance).toBe(1000);
      expect(balance.frozenBalance).toBe(1000);
      expect(balance.availableBalance).toBe(0);
    });

    test('冻结全部余额后，解冻部分余额，availableBalance 应该正确', async () => {
      // 冻结全部 1000
      await accountModel.freezeBalance(testUserId, 1000);

      // 解冻 300
      await accountModel.unfreezeBalance(testUserId, 300);

      // ✅ 验证
      const info = accountService.getAccountInfo(testUserId);
      expect(info).not.toBeNull();
      expect(info!.balance).toBe(1000); // 总余额不变
      expect(info!.frozenBalance).toBe(700); // 1000 - 300 = 700
      expect(info!.availableBalance).toBe(300); // 1000 - 700 = 300
    });
  });

  describe('场景2: 部分冻结', () => {
    test('冻结部分余额后，availableBalance 应该正确', async () => {
      // 冻结 300
      await accountModel.freezeBalance(testUserId, 300);

      // ✅ 验证
      const info = accountService.getAccountInfo(testUserId);
      expect(info).not.toBeNull();
      expect(info!.balance).toBe(1000); // 总余额不变
      expect(info!.frozenBalance).toBe(300);
      expect(info!.availableBalance).toBe(700); // 1000 - 300 = 700
    });

    test('多次冻结后，availableBalance 应该正确', async () => {
      // 冻结 200
      await accountModel.freezeBalance(testUserId, 200);
      // 再冻结 300
      await accountModel.freezeBalance(testUserId, 300);

      // ✅ 验证
      const info = accountService.getAccountInfo(testUserId);
      expect(info).not.toBeNull();
      expect(info!.balance).toBe(1000); // 总余额不变
      expect(info!.frozenBalance).toBe(500); // 200 + 300 = 500
      expect(info!.availableBalance).toBe(500); // 1000 - 500 = 500
    });
  });

  describe('场景3: 边界情况', () => {
    test('余额为 0 时，冻结应该失败', async () => {
      const zeroUser = 'zero-balance-user';
      await accountModel.createAccount(zeroUser, 0);

      // ✅ 应该抛出错误
      await expect(accountModel.freezeBalance(zeroUser, 100)).rejects.toThrow(
        'Insufficient available balance'
      );
    });

    test('冻结金额超过可用余额应该失败', async () => {
      // ✅ 应该抛出错误
      await expect(accountModel.freezeBalance(testUserId, 1500)).rejects.toThrow(
        'Insufficient available balance'
      );
    });

    test('解冻金额超过冻结余额应该失败', async () => {
      // 冻结 300
      await accountModel.freezeBalance(testUserId, 300);

      // ✅ 应该抛出错误
      await expect(accountModel.unfreezeBalance(testUserId, 500)).rejects.toThrow(
        'Insufficient frozen balance'
      );
    });
  });

  describe('场景4: 与 FreezeService 集成', () => {
    test('getAvailableBalance 应该返回正确的可用余额', async () => {
      const { freezeService } = await import('../services/freeze.service');

      // 冻结 400
      await accountModel.freezeBalance(testUserId, 400);

      // ✅ 验证 FreezeService 的 getAvailableBalance
      const available = freezeService.getAvailableBalance(testUserId);
      expect(available).toBe(600); // 1000 - 400 = 600
    });
  });
});
