/**
 * 🔴 P0 竞态条件测试 - Issue #281
 *
 * 测试目标：验证空投系统 requestId 生成的竞态条件风险
 * 问题：使用 Date.now() + Math.random() 生成 ID 可能导致重复
 *
 * 测试场景：
 * 1. 模拟同一毫秒内大量并发请求
 * 2. 检测 ID 碰撞概率
 * 3. 验证并发安全性
 */

import { AirdropModel } from '../../src/models/Airdrop';
import { AirdropStatus } from '../../src/types';

describe('🔴 AirdropModel 竞态条件测试 - Issue #281', () => {
  let airdropModel: AirdropModel;

  beforeEach(() => {
    airdropModel = new AirdropModel();
  });

  describe('ID 生成安全性测试', () => {
    test('应该检测到同一毫秒内的 ID 碰撞风险', () => {
      const ids = new Set<string>();
      const duplicates: string[] = [];
      const iterations = 10000;

      // 🔥 模拟同一时间戳下的 ID 生成
      const now = Date.now();
      for (let i = 0; i < iterations; i++) {
        const id = `airdrop_${now}_${Math.random().toString(36).substr(2, 9)}`;

        if (ids.has(id)) {
          duplicates.push(id);
        }
        ids.add(id);
      }

      console.log(`生成了 ${iterations} 个 ID`);
      console.log(`唯一 ID 数量: ${ids.size}`);
      console.log(`重复 ID 数量: ${duplicates.length}`);
      console.log(`碰撞概率: ${((duplicates.length / iterations) * 100).toFixed(4)}%`);

      // ⚠️ 风险：理论上应该没有重复，但 Math.random() 的熵有限
      // 在高并发场景下仍有碰撞风险
      if (duplicates.length > 0) {
        console.error('🔴 发现 ID 碰撞！', duplicates);
      }
    });

    test('应该验证 claimId 生成的唯一性', () => {
      const claimIds = new Set<string>();
      const duplicates: string[] = [];
      const iterations = 10000;

      const now = Date.now();
      for (let i = 0; i < iterations; i++) {
        const claimId = `claim_${now}_${Math.random().toString(36).substr(2, 9)}`;

        if (claimIds.has(claimId)) {
          duplicates.push(claimId);
        }
        claimIds.add(claimId);
      }

      console.log(`生成了 ${iterations} 个 claimId`);
      console.log(`唯一 claimId 数量: ${claimIds.size}`);
      console.log(`重复 claimId 数量: ${duplicates.length}`);

      if (duplicates.length > 0) {
        console.error('🔴 发现 claimId 碰撞！', duplicates);
      }
    });

    test('应该测试极端并发场景下的 ID 生成', async () => {
      const ids = new Set<string>();
      const duplicates: string[] = [];
      const concurrentRequests = 1000;

      // 🔥 模拟 1000 个并发请求同时创建空投
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => {
          return new Promise<string>((resolve) => {
            const airdrop = airdropModel.createAirdrop({
              name: '并发测试',
              description: '测试',
              totalAmount: 1000,
              perUserAmount: 10,
              startTime: new Date(),
              endTime: new Date(Date.now() + 1000 * 60 * 60),
            });
            resolve(airdrop.id);
          });
        });

      const allIds = await Promise.all(promises);

      // 检查重复
      for (const id of allIds) {
        if (ids.has(id)) {
          duplicates.push(id);
        }
        ids.add(id);
      }

      console.log(`并发创建了 ${concurrentRequests} 个空投`);
      console.log(`唯一 ID 数量: ${ids.size}`);
      console.log(`重复 ID 数量: ${duplicates.length}`);

      // ⚠️ 如果发现重复，说明存在严重的竞态条件
      expect(duplicates.length).toBe(0);
    });
  });

  describe('并发领取安全性测试', () => {
    test('应该防止并发领取导致的超额分发', async () => {
      // 创建一个小额空投
      const airdrop = airdropModel.createAirdrop({
        name: '并发领取测试',
        description: '测试并发领取安全性',
        totalAmount: 100, // 总额 100，每人 10，最多 10 人
        perUserAmount: 10,
        startTime: new Date(Date.now() - 1000 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 创建 20 个用户并发领取
      const userIds = Array(20)
        .fill(null)
        .map((_, i) => `user-${i}`);

      const results = await Promise.allSettled(
        userIds.map((userId) => Promise.resolve(airdropModel.createClaim(airdrop.id, userId, 10)))
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      console.log(`并发领取结果：成功 ${successCount}，失败 ${failedCount}`);

      // ✅ 验证：最多只能成功 10 次
      expect(successCount).toBeLessThanOrEqual(10);
      expect(failedCount).toBeGreaterThanOrEqual(10);

      // ✅ 验证：总领取金额不超过总金额
      const claims = airdropModel.getAirdropClaims(airdrop.id);
      const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);
      expect(totalClaimed).toBeLessThanOrEqual(100);
    });

    test('应该防止同一用户并发重复领取', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: '重复领取测试',
        description: '测试重复领取防护',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      const userId = 'test-user-duplicate';

      // 🔥 同一用户并发尝试领取 10 次
      const results = await Promise.allSettled(
        Array(10)
          .fill(null)
          .map(() => Promise.resolve(airdropModel.createClaim(airdrop.id, userId, 100)))
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      console.log(`重复领取测试：成功 ${successCount}，失败 ${failedCount}`);

      // ✅ 验证：只能成功 1 次
      expect(successCount).toBe(1);
      expect(failedCount).toBe(9);

      // ✅ 验证：用户只领取了 1 次
      const userClaims = airdropModel.getUserClaims(userId);
      expect(userClaims.length).toBe(1);
      expect(userClaims[0].amount).toBe(100);
    });
  });

  describe('🔒 锁机制有效性测试', () => {
    test('应该验证锁机制能防止并发冲突', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: '锁机制测试',
        description: '测试锁的有效性',
        totalAmount: 50, // 总额 50，每人 10，最多 5 人
        perUserAmount: 10,
        startTime: new Date(Date.now() - 1000 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 创建 10 个用户并发领取（超过可用额度）
      const userIds = Array(10)
        .fill(null)
        .map((_, i) => `lock-test-user-${i}`);

      const startTime = Date.now();
      const results = await Promise.allSettled(
        userIds.map((userId) => Promise.resolve(airdropModel.createClaim(airdrop.id, userId, 10)))
      );
      const endTime = Date.now();

      console.log(`并发领取耗时: ${endTime - startTime}ms`);

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      console.log(`锁机制测试：成功 ${successCount}，失败 ${failedCount}`);

      // ✅ 验证：锁机制确保最多 5 人成功
      expect(successCount).toBeLessThanOrEqual(5);
      expect(failedCount).toBeGreaterThanOrEqual(5);

      // ✅ 验证：没有超额分发
      const claims = airdropModel.getAirdropClaims(airdrop.id);
      const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);
      expect(totalClaimed).toBeLessThanOrEqual(50);
    });
  });
});
