/**
 * 单元测试 - 验证可用余额计算的正确性
 * Issue #162: 修复 availableBalance 计算错误
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AccountService } from '../../src/services/account.service';
import { TokenService } from '../../src/services/TokenService';
import { accountModel } from '../../src/models/Account';

describe('可用余额计算测试', () => {
  let accountService: AccountService;
  let tokenService: TokenService;
  const testUserId = 'test-user-balance';

  beforeEach(() => {
    accountService = new AccountService();
    tokenService = new TokenService();
    // 重置测试数据 - 清除所有 Map
    accountModel['accounts'].clear();
    accountModel['transactions'].clear();
    accountModel['userAccounts'].clear();
  });

  describe('AccountService - getAccountInfo', () => {
    it('应该正确计算可用余额（总余额 - 冻结余额）', async () => {
      // 创建账户，初始余额 1000
      await accountService.createAccount(testUserId, 1000);

      // 冻结 300
      await accountService.freezeTokens(testUserId, 300, '测试冻结');

      // 获取账户信息
      const accountInfo = accountService.getAccountInfo(testUserId);

      expect(accountInfo).not.toBeNull();
      expect(accountInfo!.balance).toBe(1000);
      expect(accountInfo!.frozenBalance).toBe(300);
      expect(accountInfo!.availableBalance).toBe(700); // 1000 - 300 = 700
    });

    it('当冻结余额为0时，可用余额应等于总余额', async () => {
      await accountService.createAccount(testUserId, 500);

      const accountInfo = accountService.getAccountInfo(testUserId);

      expect(accountInfo!.balance).toBe(500);
      expect(accountInfo!.frozenBalance).toBe(0);
      expect(accountInfo!.availableBalance).toBe(500);
    });

    it('当全部冻结时，可用余额应为0', async () => {
      await accountService.createAccount(testUserId, 800);
      await accountService.freezeTokens(testUserId, 800, '全部冻结');

      const accountInfo = accountService.getAccountInfo(testUserId);

      expect(accountInfo!.balance).toBe(800);
      expect(accountInfo!.frozenBalance).toBe(800);
      expect(accountInfo!.availableBalance).toBe(0);
    });
  });

  describe('AccountService - getTokenBalance', () => {
    it('应该正确返回代币余额和可用余额', async () => {
      await accountService.createAccount(testUserId, 2000);
      await accountService.freezeTokens(testUserId, 500, '部分冻结');

      const balance = accountService.getTokenBalance(testUserId);

      expect(balance).not.toBeNull();
      expect(balance!.balance).toBe(2000);
      expect(balance!.frozenBalance).toBe(500);
      expect(balance!.availableBalance).toBe(1500); // 2000 - 500 = 1500
    });
  });

  describe('AccountService - freezeTokens', () => {
    it('冻结后代币应返回正确的可用余额', async () => {
      await accountService.createAccount(testUserId, 1000);

      const result = await accountService.freezeTokens(testUserId, 300, '测试冻结');

      expect(result.success).toBe(true);
      expect(result.frozenAmount).toBe(300);
      expect(result.availableBalance).toBe(700); // 1000 - 300 = 700
    });

    it('多次冻结应累积计算冻结余额', async () => {
      await accountService.createAccount(testUserId, 1000);

      await accountService.freezeTokens(testUserId, 200, '第一次冻结');
      const result2 = await accountService.freezeTokens(testUserId, 300, '第二次冻结');

      expect(result2.availableBalance).toBe(500); // 1000 - 200 - 300 = 500
    });
  });

  describe('AccountService - unfreezeTokens', () => {
    it('解冻后代币应返回正确的可用余额', async () => {
      await accountService.createAccount(testUserId, 1000);
      await accountService.freezeTokens(testUserId, 400, '先冻结');

      const result = await accountService.unfreezeTokens(testUserId, 200, '部分解冻');

      expect(result.success).toBe(true);
      expect(result.unfrozenAmount).toBe(200);
      expect(result.availableBalance).toBe(800); // 1000 - (400 - 200) = 800
    });
  });

  describe('TokenService - getBalance', () => {
    it('应该正确计算可用余额', async () => {
      // 先通过 accountService 创建账户和冻结
      await accountService.createAccount(testUserId, 1500);
      await accountService.freezeTokens(testUserId, 400, '测试冻结');

      // 使用 tokenService 获取余额
      const balance = tokenService.getBalance(testUserId);

      expect(balance.balance).toBe(1500);
      expect(balance.frozenBalance).toBe(400);
      expect(balance.availableBalance).toBe(1100); // 1500 - 400 = 1100
    });

    it('不存在的用户应返回余额为0', () => {
      const balance = tokenService.getBalance('non-existent-user');

      expect(balance.balance).toBe(0);
      expect(balance.frozenBalance).toBe(0);
      expect(balance.availableBalance).toBe(0);
    });
  });

  describe('余额计算边界情况', () => {
    it('部分冻结后进行转账应使用可用余额', async () => {
      const fromUserId = 'user-from';
      const toUserId = 'user-to';

      await accountService.createAccount(fromUserId, 1000);
      await accountService.createAccount(toUserId, 0);

      // 冻结 400
      await accountService.freezeTokens(fromUserId, 400, '部分冻结');

      // 尝试转账 500（可用余额 600）
      const result = await accountService.transfer(fromUserId, toUserId, 500, '测试转账');

      expect(result.success).toBe(true);

      // 验证余额
      const fromBalance = accountService.getTokenBalance(fromUserId);
      expect(fromBalance!.balance).toBe(500);
      expect(fromBalance!.frozenBalance).toBe(400);
      expect(fromBalance!.availableBalance).toBe(100); // 500 - 400 = 100
    });

    it('尝试转账超过可用余额应失败', async () => {
      const fromUserId = 'user-from-2';
      const toUserId = 'user-to-2';

      await accountService.createAccount(fromUserId, 1000);
      await accountService.createAccount(toUserId, 0);

      // 冻结 600
      await accountService.freezeTokens(fromUserId, 600, '大部分冻结');

      // 尝试转账 500（可用余额只有 400）应该失败
      await expect(accountService.transfer(fromUserId, toUserId, 500, '超额转账')).rejects.toThrow(
        '余额不足'
      );
    });
  });

  describe('hasEnoughBalance 方法', () => {
    it('应该基于可用余额判断，而非总余额', async () => {
      await accountService.createAccount(testUserId, 1000);
      await accountService.freezeTokens(testUserId, 600, '部分冻结');

      // 可用余额 = 400
      expect(accountService.hasEnoughBalance(testUserId, 400)).toBe(true);
      expect(accountService.hasEnoughBalance(testUserId, 500)).toBe(false);
      expect(accountService.hasEnoughBalance(testUserId, 1000)).toBe(false); // 虽然总余额是1000，但可用只有400
    });
  });
});
