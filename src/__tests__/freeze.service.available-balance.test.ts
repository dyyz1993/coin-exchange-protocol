/**
 * FreezeService.getAvailableBalance 单元测试
 *
 * 测试目标：验证可用余额计算逻辑正确性
 * Issue #290: 修复 getAvailableBalance 计算逻辑错误导致可用余额虚高
 */

import { freezeService } from '../services/freeze.service';
import { accountModel } from '../models/Account';
import { freezeModel } from '../models/Freeze';

describe('FreezeService.getAvailableBalance', () => {
  beforeEach(() => {
    // 清空所有数据
    (accountModel as any).accounts.clear();
    (accountModel as any).transactions.clear();
    (accountModel as any).userAccounts.clear();
    (freezeModel as any).freezes.clear();
  });

  describe('基础场景', () => {
    it('用户不存在时返回 0', () => {
      const available = freezeService.getAvailableBalance('non-existent-user');
      expect(available).toBe(0);
    });

    it('用户账户存在但无冻结时，返回全部余额', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 1000);

      const available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(1000);
    });

    it('用户账户存在且余额为 0 时，返回 0', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 0);

      const available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(0);
    });
  });

  describe('冻结场景 - 核心测试', () => {
    it('✅ 有冻结时，可用余额 = 总余额 - 冻结余额', async () => {
      const userId = 'user1';
      const account = await accountModel.createAccount(userId, 1000);

      // 冻结 300
      await accountModel.freezeBalance(userId, 300);

      // 验证账户状态
      const updatedAccount = accountModel.getAccountByUserId(userId);
      expect(updatedAccount?.balance).toBe(1000); // 总余额不变
      expect(updatedAccount?.frozenBalance).toBe(300); // 冻结余额增加

      // 验证可用余额
      const available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(700); // 1000 - 300 = 700
    });

    it('✅ 多次冻结时，可用余额正确累减', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 1000);

      // 第一次冻结 200
      await accountModel.freezeBalance(userId, 200);
      expect(freezeService.getAvailableBalance(userId)).toBe(800);

      // 第二次冻结 300
      await accountModel.freezeBalance(userId, 300);
      expect(freezeService.getAvailableBalance(userId)).toBe(500);

      // 第三次冻结 100
      await accountModel.freezeBalance(userId, 100);
      expect(freezeService.getAvailableBalance(userId)).toBe(400);

      // 验证账户状态
      const account = accountModel.getAccountByUserId(userId);
      expect(account?.balance).toBe(1000); // 总余额始终不变
      expect(account?.frozenBalance).toBe(600); // 200 + 300 + 100 = 600
    });

    it('✅ 冻结后解冻，可用余额正确恢复', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 1000);

      // 冻结 400
      await accountModel.freezeBalance(userId, 400);
      expect(freezeService.getAvailableBalance(userId)).toBe(600);

      // 解冻 200
      await accountModel.unfreezeBalance(userId, 200);
      expect(freezeService.getAvailableBalance(userId)).toBe(800);

      // 验证账户状态
      const account = accountModel.getAccountByUserId(userId);
      expect(account?.balance).toBe(1000); // 总余额始终不变
      expect(account?.frozenBalance).toBe(200); // 400 - 200 = 200
    });

    it('✅ 全部冻结时，可用余额为 0', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 500);

      // 冻结全部
      await accountModel.freezeBalance(userId, 500);

      const available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(0);

      // 验证账户状态
      const account = accountModel.getAccountByUserId(userId);
      expect(account?.balance).toBe(500);
      expect(account?.frozenBalance).toBe(500);
    });
  });

  describe('边界场景', () => {
    it('余额不足时冻结应抛出错误', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 100);

      // 尝试冻结超过余额的金额
      await expect(accountModel.freezeBalance(userId, 200)).rejects.toThrow(
        'Insufficient available balance'
      );

      // 可用余额应保持不变
      expect(freezeService.getAvailableBalance(userId)).toBe(100);
    });

    it('部分冻结后，剩余可用余额不足时应拒绝再次冻结', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 1000);

      // 冻结 600
      await accountModel.freezeBalance(userId, 600);
      expect(freezeService.getAvailableBalance(userId)).toBe(400);

      // 尝试冻结 500（超过可用余额 400）
      await expect(accountModel.freezeBalance(userId, 500)).rejects.toThrow(
        'Insufficient available balance'
      );

      // 可用余额应保持不变
      expect(freezeService.getAvailableBalance(userId)).toBe(400);
    });

    it('解冻金额超过冻结余额应抛出错误', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 1000);

      // 冻结 200
      await accountModel.freezeBalance(userId, 200);

      // 尝试解冻超过冻结余额的金额
      await expect(accountModel.unfreezeBalance(userId, 300)).rejects.toThrow(
        'Insufficient frozen balance'
      );

      // 冻结余额应保持不变
      const account = accountModel.getAccountByUserId(userId);
      expect(account?.frozenBalance).toBe(200);
    });
  });

  describe('并发安全性测试', () => {
    it('✅ 并发冻结时，可用余额计算应保持一致', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 1000);

      // 并发执行 10 次冻结操作，每次冻结 50
      const freezePromises = Array(10)
        .fill(null)
        .map(() =>
          accountModel.freezeBalance(userId, 50).catch((err) => {
            // 某些冻结可能因余额不足而失败
            return null;
          })
        );

      await Promise.all(freezePromises);

      // 验证账户状态
      const account = accountModel.getAccountByUserId(userId);
      expect(account?.balance).toBe(1000); // 总余额不变

      // 可用余额应该 = 总余额 - 冻结余额
      const available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(account!.balance - account!.frozenBalance);
      expect(available).toBeGreaterThanOrEqual(0);
    });
  });

  describe('实际业务场景', () => {
    it('✅ 交易冻结场景：创建冻结时检查可用余额', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 1000);

      // 冻结 300
      await accountModel.freezeBalance(userId, 300);

      // 可用余额应为 700
      expect(freezeService.getAvailableBalance(userId)).toBe(700);

      // 可以成功冻结 600（小于等于可用余额）
      await accountModel.freezeBalance(userId, 600);
      expect(freezeService.getAvailableBalance(userId)).toBe(100);

      // 尝试冻结 200 应该失败（超过可用余额 100）
      await expect(accountModel.freezeBalance(userId, 200)).rejects.toThrow();

      // 可用余额应保持 100
      expect(freezeService.getAvailableBalance(userId)).toBe(100);
    });

    it('✅ 复杂场景：多次冻结、部分解冻', async () => {
      const userId = 'user1';
      await accountModel.createAccount(userId, 2000);

      // 第一次冻结 500
      await accountModel.freezeBalance(userId, 500);
      expect(freezeService.getAvailableBalance(userId)).toBe(1500);

      // 第二次冻结 300
      await accountModel.freezeBalance(userId, 300);
      expect(freezeService.getAvailableBalance(userId)).toBe(1200);

      // 解冻 200
      await accountModel.unfreezeBalance(userId, 200);
      expect(freezeService.getAvailableBalance(userId)).toBe(1400);

      // 第三次冻结 400
      await accountModel.freezeBalance(userId, 400);
      expect(freezeService.getAvailableBalance(userId)).toBe(1000);

      // 验证最终状态
      const account = accountModel.getAccountByUserId(userId);
      expect(account?.balance).toBe(2000); // 总余额不变
      expect(account?.frozenBalance).toBe(1000); // 500 + 300 - 200 + 400 = 1000
      expect(freezeService.getAvailableBalance(userId)).toBe(1000); // 2000 - 1000 = 1000
    });
  });
});
