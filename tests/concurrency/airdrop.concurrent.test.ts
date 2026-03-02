/**
 * 空投服务并发测试 - 验证竞态条件修复
 *
 * 测试场景：
 * 1. 多个用户同时领取空投，验证不会超额分发
 * 2. 同一用户并发领取，验证只能领取一次
 * 3. 空投金额即将耗尽时，验证并发请求的正确处理
 */

import { airdropService } from '../../src/services/airdrop.service';
import { accountService } from '../../src/services/account.service';
import { accountModel } from '../../src/models/Account';

describe('AirdropService 并发安全测试', () => {
  beforeEach(() => {
    // 清理所有数据（通过重新创建实例来清理）
    // 由于 Model 是单例，这里不做清理，依赖测试隔离
  });

  describe('🔒 Issue #300: 修复空投超额分发竞态条件', () => {
    it('应该防止多个用户同时领取导致超额分发', async () => {
      // 创建空投：总金额 100，每人可领取 50
      const airdrop = await airdropService.createAirdrop({
        name: '并发测试空投',
        description: '测试并发领取',
        totalAmount: 100,
        perUserAmount: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await airdropService.startAirdrop(airdrop.airdropId);

      // 创建 3 个用户账户
      const user1 = 'user-concurrent-1';
      const user2 = 'user-concurrent-2';
      const user3 = 'user-concurrent-3';

      await accountService.createAccount(user1);
      await accountService.createAccount(user2);
      await accountService.createAccount(user3);

      // 🔥 并发场景：3 个用户同时领取，但只有 2 个能成功（总金额 100，每人 50）
      const claimPromises = [
        airdropService.claimAirdrop(airdrop.airdropId, user1),
        airdropService.claimAirdrop(airdrop.airdropId, user2),
        airdropService.claimAirdrop(airdrop.airdropId, user3),
      ];

      // 等待所有请求完成
      const results = await Promise.allSettled(claimPromises);

      // 统计成功和失败的数量
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      // ✅ 验证：只有 2 个用户能成功领取（100 / 50 = 2）
      expect(successCount).toBe(2);
      expect(failedCount).toBe(1);

      // 验证第 3 个用户收到"金额已耗尽"的错误
      const rejectedResult = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rejectedResult.reason.message).toContain('空投金额已耗尽');

      // 验证实际分发金额不超过总金额
      const stats = airdropService.getAirdropStats(airdrop.airdropId);
      expect(stats.totalDistributed).toBeLessThanOrEqual(100);
    });

    it('应该防止同一用户并发重复领取', async () => {
      // 创建空投
      const airdrop = await airdropService.createAirdrop({
        name: '防重复领取测试',
        description: '测试同一用户并发领取',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await airdropService.startAirdrop(airdrop.airdropId);

      const userId = 'user-duplicate-test';
      await accountService.createAccount(userId);

      // 🔥 并发场景：同一用户同时发起 5 次领取请求
      const claimPromises = Array(5)
        .fill(null)
        .map(() => airdropService.claimAirdrop(airdrop.airdropId, userId));

      const results = await Promise.allSettled(claimPromises);

      // ✅ 验证：只有 1 次成功，其余 4 次失败
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      expect(successCount).toBe(1);
      expect(failedCount).toBe(4);

      // 验证失败原因都是"已经领取过"
      const rejectedResults = results.filter(
        (r) => r.status === 'rejected'
      ) as PromiseRejectedResult[];
      rejectedResults.forEach((result) => {
        expect(result.reason.message).toContain('您已经领取过此空投');
      });

      // 验证用户余额只增加了 100（一次领取的金额）
      const account = accountModel.getAccountByUserId(userId);
      expect(account!.balance).toBe(100);
    });

    it('应该在边界情况下正确处理并发（剩余金额刚好够一人）', async () => {
      // 创建空投：总金额 150，每人 50
      const airdrop = await airdropService.createAirdrop({
        name: '边界测试',
        description: '测试剩余金额刚好够一人',
        totalAmount: 150,
        perUserAmount: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await airdropService.startAirdrop(airdrop.airdropId);

      // 创建 5 个用户
      const users = [
        'user-boundary-1',
        'user-boundary-2',
        'user-boundary-3',
        'user-boundary-4',
        'user-boundary-5',
      ];
      for (const userId of users) {
        await accountService.createAccount(userId);
      }

      // 🔥 并发场景：5 个用户同时领取，只有 3 个能成功
      const claimPromises = users.map((userId) =>
        airdropService.claimAirdrop(airdrop.airdropId, userId)
      );

      const results = await Promise.allSettled(claimPromises);

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      // ✅ 验证：3 个成功（150 / 50 = 3）
      expect(successCount).toBe(3);
      expect(failedCount).toBe(2);

      // 验证总分发金额正好是 150
      const stats = airdropService.getAirdropStats(airdrop.airdropId);
      expect(stats.totalDistributed).toBe(150);
    });

    it('应该在高并发下保持数据一致性（压力测试）', async () => {
      // 创建大额空投
      const airdrop = await airdropService.createAirdrop({
        name: '高并发压力测试',
        description: '测试 100 个并发请求',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await airdropService.startAirdrop(airdrop.airdropId);

      // 创建 100 个用户
      const userCount = 100;
      const users = Array(userCount)
        .fill(null)
        .map((_, i) => `user-stress-${i}`);

      for (const userId of users) {
        await accountService.createAccount(userId);
      }

      // 🔥 高并发：100 个用户同时领取
      const claimPromises = users.map((userId) =>
        airdropService.claimAirdrop(airdrop.airdropId, userId)
      );

      const results = await Promise.allSettled(claimPromises);

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      // ✅ 验证：100 个请求，1000 / 10 = 100 个应该成功
      expect(successCount).toBe(100);
      expect(failedCount).toBe(0);

      // 验证总分发金额正好是 1000
      const stats = airdropService.getAirdropStats(airdrop.airdropId);
      expect(stats.totalDistributed).toBe(1000);
    });
  });
});
