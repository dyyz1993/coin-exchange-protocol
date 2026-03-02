/**
 * FreezeService.getAvailableBalance 单元测试
 * Issue #290: 修复余额计算错误和边界检查
 */

import { freezeService } from '../services/freeze.service';
import { accountModel } from '../models/Account';

describe('FreezeService.getAvailableBalance - Issue #290 修复验证', () => {
  beforeEach(async () => {
    // 测试会自动创建账户，不需要手动清空
  });

  describe('✅ 正常场景', () => {
    it('应该正确计算可用余额（balance - frozenBalance）', async () => {
      // 准备：创建账户，余额 100，冻结 30
      await accountModel.createAccount('user1', 100);
      await accountModel.freezeBalance('user1', 30);

      // 执行
      const available = freezeService.getAvailableBalance('user1');

      // 验证：100 - 30 = 70
      expect(available).toBe(70);
    });

    it('应该正确处理无冻结的情况', async () => {
      // 准备：创建账户，余额 100，无冻结
      await accountModel.createAccount('user2', 100);

      // 执行
      const available = freezeService.getAvailableBalance('user2');

      // 验证：100 - 0 = 100
      expect(available).toBe(100);
    });

    it('应该正确处理零余额的情况', async () => {
      // 准备：创建账户，余额 0，无冻结
      await accountModel.createAccount('user3', 0);

      // 执行
      const available = freezeService.getAvailableBalance('user3');

      // 验证：0 - 0 = 0
      expect(available).toBe(0);
    });
  });

  describe('⚠️ 边界检查（Issue #290 核心修复）', () => {
    it('当 frozenBalance > balance 时，应该返回 0（防止负数）', async () => {
      // 准备：模拟异常数据 - 冻结余额大于总余额
      await accountModel.createAccount('user4', 50);

      // 直接修改账户数据，模拟数据异常
      const acc = accountModel.getAccountByUserId('user4');
      if (acc) {
        acc.frozenBalance = 100; // 异常：冻结余额 > 总余额
      }

      // 执行
      const available = freezeService.getAvailableBalance('user4');

      // 验证：应该返回 0，而不是 -50
      expect(available).toBe(0);
    });

    it('当 balance = frozenBalance 时，应该返回 0', async () => {
      // 准备：余额和冻结余额相等
      await accountModel.createAccount('user5', 100);
      await accountModel.freezeBalance('user5', 100);

      // 执行
      const available = freezeService.getAvailableBalance('user5');

      // 验证：100 - 100 = 0
      expect(available).toBe(0);
    });

    it('当 frozenBalance 略大于 balance 时，应该返回 0', async () => {
      // 准备：模拟边界情况
      await accountModel.createAccount('user6', 100);
      await accountModel.freezeBalance('user6', 50);

      // 直接修改账户数据，模拟数据异常
      const acc = accountModel.getAccountByUserId('user6');
      if (acc) {
        acc.frozenBalance = 100.5; // 略大于总余额
      }

      // 执行
      const available = freezeService.getAvailableBalance('user6');

      // 验证：应该返回 0
      expect(available).toBe(0);
    });
  });

  describe('❌ 错误处理', () => {
    it('当账户不存在时，应该返回 0', () => {
      // 执行：查询不存在的账户
      const available = freezeService.getAvailableBalance('nonexistent');

      // 验证：应该返回 0
      expect(available).toBe(0);
    });
  });

  describe('🔒 资金安全验证', () => {
    it('可用余额不应该为负数（防止透支）', async () => {
      // 准备：多个场景测试
      const testCases = [
        { balance: 100, frozen: 50, expected: 50 },
        { balance: 100, frozen: 100, expected: 0 },
        { balance: 0, frozen: 0, expected: 0 },
        { balance: 50, frozen: 0, expected: 50 },
      ];

      for (const { balance, frozen, expected } of testCases) {
        const userId = `safety-test-${Math.random()}`;
        await accountModel.createAccount(userId, balance);

        if (frozen > 0 && frozen <= balance) {
          await accountModel.freezeBalance(userId, frozen);
        } else if (frozen > balance) {
          // 模拟异常数据
          const acc = accountModel.getAccountByUserId(userId);
          if (acc) {
            acc.frozenBalance = frozen;
          }
        }

        // 执行
        const available = freezeService.getAvailableBalance(userId);

        // 验证
        expect(available).toBe(expected);
        expect(available).toBeGreaterThanOrEqual(0); // 确保不为负数
      }
    });
  });
});
