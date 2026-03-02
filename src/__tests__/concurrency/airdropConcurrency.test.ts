/**
 * 空投系统并发安全测试
 * 验证修复后的并发控制是否有效
 */

import { AirdropModel } from '../../models/Airdrop';
import { AirdropStatus } from '../../types';

describe('AirdropModel 并发安全测试', () => {
  let airdropModel: AirdropModel;

  beforeEach(() => {
    airdropModel = new AirdropModel();
  });

  describe('并发领取测试', () => {
    it('应该防止同一用户并发重复领取', async () => {
      // 创建空投活动
      const airdrop = airdropModel.createAirdrop({
        name: '测试空投',
        description: '测试并发安全',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 模拟并发请求
      const concurrentRequests = 10;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          airdropModel.createClaim(airdrop.id, 'user1', 100).catch((err) => {
            // 预期只有第一个成功，其他都应该失败
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successCount = results.filter((r) => !('error' in r)).length;
      const failCount = results.filter((r) => 'error' in r).length;

      // console.log 已移除以符合 ESLint 规则

      // 应该只有 1 个成功，其余 9 个失败
      expect(successCount).toBe(1);
      expect(failCount).toBe(concurrentRequests - 1);

      // 验证最终状态
      const claims = airdropModel.getAirdropClaims(airdrop.id);
      expect(claims.length).toBe(1);
      expect(claims[0].amount).toBe(100);
    });

    it('应该防止多用户并发超发', async () => {
      // 创建总金额为 500 的空投，每人可领取 100
      const airdrop = airdropModel.createAirdrop({
        name: '限量空投',
        description: '测试超发防护',
        totalAmount: 500,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 模拟 10 个用户并发领取，但只有 5 个能成功
      const userCount = 10;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < userCount; i++) {
        const userId = `user${i}`;
        promises.push(
          airdropModel.createClaim(airdrop.id, userId, 100).catch((err) => {
            return { error: err.message, userId };
          })
        );
      }

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successCount = results.filter((r) => !('error' in r)).length;
      const failCount = results.filter((r) => 'error' in r).length;

      // console.log 已移除以符合 ESLint 规则

      // 应该只有 5 个成功，5 个失败
      expect(successCount).toBe(5);
      expect(failCount).toBe(5);

      // 验证最终余额
      const remainingAmount = airdropModel.getRemainingAmount(airdrop.id);
      expect(remainingAmount).toBe(0);

      // 验证已领取金额
      const claims = airdropModel.getAirdropClaims(airdrop.id);
      const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);
      expect(totalClaimed).toBe(500);
    });

    it('应该正确处理高并发压力测试', async () => {
      // 创建大额空投
      const airdrop = airdropModel.createAirdrop({
        name: '压力测试空投',
        description: '测试高并发场景',
        totalAmount: 10000,
        perUserAmount: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 模拟 100 个用户并发领取
      const userCount = 100;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < userCount; i++) {
        const userId = `user${i}`;
        promises.push(
          airdropModel.createClaim(airdrop.id, userId, 10).catch((err) => {
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => !('error' in r)).length;

      // // console.log 已移除以符合 ESLint 规则

      // 验证不超过最大限额
      expect(successCount).toBeLessThanOrEqual(1000); // 10000 / 10

      // 验证没有超发
      const claims = airdropModel.getAirdropClaims(airdrop.id);
      const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);
      expect(totalClaimed).toBeLessThanOrEqual(10000);
    });
  });

  describe('竞态条件测试', () => {
    it('应该防止 TOCTOU 竞态条件', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'TOCTOU 测试',
        description: '测试时间检查竞态',
        totalAmount: 100,
        perUserAmount: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 同时发起 3 个请求，只有 2 个应该成功
      const promises = await Promise.allSettled([
        airdropModel.createClaim(airdrop.id, 'user1', 50),
        airdropModel.createClaim(airdrop.id, 'user2', 50),
        airdropModel.createClaim(airdrop.id, 'user3', 50),
      ]);

      const fulfilled = promises.filter((p) => p.status === 'fulfilled').length;
      const rejected = promises.filter((p) => p.status === 'rejected').length;

      // // console.log 已移除以符合 ESLint 规则

      expect(fulfilled).toBe(2);
      expect(rejected).toBe(1);

      // 验证余额耗尽
      const remainingAmount = airdropModel.getRemainingAmount(airdrop.id);
      expect(remainingAmount).toBe(0);
    });
  });

  describe('锁机制测试', () => {
    it('应该正确释放锁，避免死锁', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: '死锁测试',
        description: '测试锁释放',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 第一批并发请求
      await Promise.allSettled([
        airdropModel.createClaim(airdrop.id, 'user1', 100),
        airdropModel.createClaim(airdrop.id, 'user2', 100),
        airdropModel.createClaim(airdrop.id, 'user3', 100),
      ]);

      // 第二批并发请求（验证锁已释放）
      const secondBatch = await Promise.allSettled([
        airdropModel.createClaim(airdrop.id, 'user4', 100),
        airdropModel.createClaim(airdrop.id, 'user5', 100),
      ]);

      const fulfilled = secondBatch.filter((p) => p.status === 'fulfilled').length;
      expect(fulfilled).toBe(2);

      // 验证最终状态
      const claims = airdropModel.getAirdropClaims(airdrop.id);
      expect(claims.length).toBe(5);
    });
  });
});
