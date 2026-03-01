/**
 * FreezeService 单元测试
 * 测试冻结余额计算逻辑
 */

import { FreezeService } from '../services/freeze.service';
import { accountModel } from '../models/Account';
import { freezeModel } from '../models/Freeze';
import { FreezeType, FreezeStatus } from '../types';

describe('FreezeService - getAvailableBalance', () => {
  let freezeService: FreezeService;

  beforeEach(() => {
    freezeService = new FreezeService();
    // 清理模型状态
    (accountModel as any).accounts.clear();
    (accountModel as any).userAccounts.clear();
    (accountModel as any).transactions.clear();
    (freezeModel as any).freezes.clear();
  });

  describe('Issue #290: 修复可用余额计算逻辑', () => {
    it('应该正确计算可用余额（总余额 - 冻结余额）', async () => {
      // 1. 创建账户，初始余额 100
      const userId = 'test-user-1';
      await accountModel.createAccount(userId, 100);

      // 2. 验证初始可用余额
      const initialAvailable = freezeService.getAvailableBalance(userId);
      expect(initialAvailable).toBe(100);

      // 3. 冻结 30
      const account = accountModel.getAccountByUserId(userId);
      if (account) {
        await accountModel.freezeBalance(userId, 30);
      }

      // 4. 验证可用余额应该是 70（100 - 30）
      const availableAfterFreeze = freezeService.getAvailableBalance(userId);
      expect(availableAfterFreeze).toBe(70);

      // 5. 验证总余额仍然是 100
      const accountAfterFreeze = accountModel.getAccountByUserId(userId);
      expect(accountAfterFreeze?.balance).toBe(100);
      expect(accountAfterFreeze?.frozenBalance).toBe(30);
    });

    it('不应该返回总余额（之前的 bug）', async () => {
      const userId = 'test-user-2';
      await accountModel.createAccount(userId, 100);

      // 冻结 40
      await accountModel.freezeBalance(userId, 40);

      // 可用余额应该是 60，而不是 100（之前的 bug）
      const available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(60);
      expect(available).not.toBe(100); // 确保不是总余额
    });

    it('多次冻结应该正确累加冻结金额', async () => {
      const userId = 'test-user-3';
      await accountModel.createAccount(userId, 200);

      // 第一次冻结 50
      await accountModel.freezeBalance(userId, 50);
      expect(freezeService.getAvailableBalance(userId)).toBe(150);

      // 第二次冻结 30
      await accountModel.freezeBalance(userId, 30);
      expect(freezeService.getAvailableBalance(userId)).toBe(120);

      // 验证总余额不变
      const account = accountModel.getAccountByUserId(userId);
      expect(account?.balance).toBe(200);
      expect(account?.frozenBalance).toBe(80);
    });

    it('解冻后应该正确恢复可用余额', async () => {
      const userId = 'test-user-4';
      await accountModel.createAccount(userId, 100);

      // 冻结 40
      await accountModel.freezeBalance(userId, 40);
      expect(freezeService.getAvailableBalance(userId)).toBe(60);

      // 解冻 20
      await accountModel.unfreezeBalance(userId, 20);
      expect(freezeService.getAvailableBalance(userId)).toBe(80);

      // 验证账户状态
      const account = accountModel.getAccountByUserId(userId);
      expect(account?.balance).toBe(100);
      expect(account?.frozenBalance).toBe(20);
    });

    it('可用余额不足时应该拒绝冻结', async () => {
      const userId = 'test-user-5';
      await accountModel.createAccount(userId, 100);

      // 冻结 60
      await accountModel.freezeBalance(userId, 60);
      expect(freezeService.getAvailableBalance(userId)).toBe(40);

      // 尝试再冻结 50（超过可用余额）
      await expect(accountModel.freezeBalance(userId, 50)).rejects.toThrow(
        'Insufficient available balance'
      );
    });

    it('不存在的用户应该返回 0', () => {
      const available = freezeService.getAvailableBalance('non-existent-user');
      expect(available).toBe(0);
    });

    it('余额为 0 的账户应该正确处理', async () => {
      const userId = 'test-user-6';
      await accountModel.createAccount(userId, 0);

      expect(freezeService.getAvailableBalance(userId)).toBe(0);

      // 尝试冻结应该失败
      await expect(accountModel.freezeBalance(userId, 10)).rejects.toThrow(
        'Insufficient available balance'
      );
    });
  });

  describe('边界情况测试', () => {
    it('全额冻结时可用余额应该为 0', async () => {
      const userId = 'test-user-7';
      await accountModel.createAccount(userId, 100);

      // 全额冻结
      await accountModel.freezeBalance(userId, 100);
      expect(freezeService.getAvailableBalance(userId)).toBe(0);

      // 尝试再冻结任何金额都应该失败
      await expect(accountModel.freezeBalance(userId, 1)).rejects.toThrow();
    });

    it('大额余额应该正确计算', async () => {
      const userId = 'test-user-8';
      const largeAmount = 999999999;
      await accountModel.createAccount(userId, largeAmount);

      const freezeAmount = 500000000;
      await accountModel.freezeBalance(userId, freezeAmount);

      const available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(largeAmount - freezeAmount);
    });
  });
});
