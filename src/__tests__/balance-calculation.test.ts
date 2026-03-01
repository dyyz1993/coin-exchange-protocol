/**
 * 余额计算单元测试
 * 测试 availableBalance = balance - frozenBalance 的正确性
 */

import { accountModel } from '../models/Account';
import { accountService } from '../services/account.service';
import { tokenService } from '../services/TokenService';

describe('余额计算测试', () => {
  const testUserId = 'test-user-balance';

  beforeEach(() => {
    // 每个测试前重置账户状态
    const existingAccount = accountModel.getAccountByUserId(testUserId);
    if (!existingAccount) {
      accountModel.createAccount(testUserId, 1000);
    }
  });

  describe('AccountService 余额计算', () => {
    test('getAccountInfo 应该正确计算 availableBalance', () => {
      const account = accountModel.getAccountByUserId(testUserId);
      expect(account).toBeDefined();

      // 初始状态：balance=1000, frozenBalance=0
      const info = accountService.getAccountInfo(testUserId);
      expect(info).not.toBeNull();
      expect(info!.balance).toBe(1000);
      expect(info!.frozenBalance).toBe(0);
      expect(info!.availableBalance).toBe(1000); // 1000 - 0 = 1000
    });

    test('冻结余额后，availableBalance 应该减少', async () => {
      // 冻结 300
      await accountService.freezeTokens(testUserId, 300, '测试冻结');

      const info = accountService.getAccountInfo(testUserId);
      expect(info).not.toBeNull();
      expect(info!.balance).toBe(1000);
      expect(info!.frozenBalance).toBe(300);
      expect(info!.availableBalance).toBe(700); // 1000 - 300 = 700
    });

    test('解冻余额后，availableBalance 应该增加', async () => {
      // 先冻结 500
      await accountService.freezeTokens(testUserId, 500, '测试冻结');

      // 再解冻 200
      await accountService.unfreezeTokens(testUserId, 200, '测试解冻');

      const info = accountService.getAccountInfo(testUserId);
      expect(info).not.toBeNull();
      expect(info!.balance).toBe(1000);
      expect(info!.frozenBalance).toBe(300); // 500 - 200 = 300
      expect(info!.availableBalance).toBe(700); // 1000 - 300 = 700
    });

    test('getTokenBalance 应该正确计算 availableBalance', async () => {
      // 冻结 250
      await accountService.freezeTokens(testUserId, 250, '测试冻结');

      const balance = accountService.getTokenBalance(testUserId);
      expect(balance).not.toBeNull();
      expect(balance!.balance).toBe(1000);
      expect(balance!.frozenBalance).toBe(250);
      expect(balance!.availableBalance).toBe(750); // 1000 - 250 = 750
    });

    test('freezeTokens 返回的 availableBalance 应该正确', async () => {
      const result = await accountService.freezeTokens(testUserId, 400, '测试冻结');

      expect(result.success).toBe(true);
      expect(result.frozenAmount).toBe(400);
      expect(result.availableBalance).toBe(600); // 1000 - 400 = 600
    });

    test('unfreezeTokens 返回的 availableBalance 应该正确', async () => {
      // 先冻结 600
      await accountService.freezeTokens(testUserId, 600, '测试冻结');

      // 再解冻 200
      const result = await accountService.unfreezeTokens(testUserId, 200, '测试解冻');

      expect(result.success).toBe(true);
      expect(result.unfrozenAmount).toBe(200);
      expect(result.availableBalance).toBe(600); // 1000 - 400 = 600
    });
  });

  describe('TokenService 余额计算', () => {
    test('getBalance 应该正确计算 availableBalance', async () => {
      // 冻结 350
      await accountModel.freezeBalance(testUserId, 350);

      const balance = tokenService.getBalance(testUserId);
      expect(balance.balance).toBe(1000);
      expect(balance.frozenBalance).toBe(350);
      expect(balance.availableBalance).toBe(650); // 1000 - 350 = 650
    });

    test('全部冻结时，availableBalance 应该为 0', async () => {
      // 冻结全部余额
      await accountModel.freezeBalance(testUserId, 1000);

      const balance = tokenService.getBalance(testUserId);
      expect(balance.balance).toBe(1000);
      expect(balance.frozenBalance).toBe(1000);
      expect(balance.availableBalance).toBe(0); // 1000 - 1000 = 0
    });
  });

  describe('边界情况测试', () => {
    test('不存在的账户应该返回 null 或默认值', () => {
      const nonExistentUserId = 'non-existent-user';

      const accountInfo = accountService.getAccountInfo(nonExistentUserId);
      expect(accountInfo).toBeNull();

      const tokenBalance = accountService.getTokenBalance(nonExistentUserId);
      expect(tokenBalance).toBeNull();

      const balance = tokenService.getBalance(nonExistentUserId);
      expect(balance.balance).toBe(0);
      expect(balance.frozenBalance).toBe(0);
      expect(balance.availableBalance).toBe(0);
    });

    test('余额为 0 时，availableBalance 应该为 0', () => {
      const zeroBalanceUserId = 'zero-balance-user';
      accountModel.createAccount(zeroBalanceUserId, 0);

      const balance = tokenService.getBalance(zeroBalanceUserId);
      expect(balance.balance).toBe(0);
      expect(balance.frozenBalance).toBe(0);
      expect(balance.availableBalance).toBe(0);
    });
  });
});
