/**
 * 🔥 P0 并发测试 - AirdropModel 并发安全性验证
 * Issue #351: 修复自旋锁死锁问题
 *
 * 测试目标：
 * 1. 验证 100 个用户同时领取空投不会死锁
 * 2. 验证不会超发（总领取金额 <= totalAmount）
 * 3. 验证每个用户只能领取一次
 */

/* eslint-disable no-console */

import { AirdropModel } from '../../src/models/Airdrop';
import { AirdropStatus } from '../../src/types';

describe('AirdropModel Concurrency Tests', () => {
  let airdropModel: AirdropModel;

  beforeEach(() => {
    airdropModel = new AirdropModel();
  });

  /**
   * 🔥 测试 1: 100 个用户并发领取空投，验证不会死锁
   */
  it('should handle 100 concurrent claims without deadlock', async () => {
    // 创建空投活动
    const airdrop = airdropModel.createAirdrop({
      name: 'Test Airdrop',
      description: 'Concurrent test',
      totalAmount: 1000,
      perUserAmount: 10,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000),
    });

    // 激活空投
    airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

    // 创建 100 个用户并发领取
    const userIds = Array.from({ length: 100 }, (_, i) => `user_${i}`);

    // 🔥 关键测试：所有请求应该并发执行，不会死锁
    const startTime = Date.now();
    const promises = userIds.map((userId) => airdropModel.createClaim(airdrop.id, userId, 10));

    // 使用 Promise.allSettled 确保所有 Promise 都完成（无论成功或失败）
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ 100 个并发请求完成，耗时: ${duration}ms`);

    // 验证：应该有 100 个成功的领取（因为 totalAmount=1000，perUserAmount=10）
    const successfulClaims = results.filter((r) => r.status === 'fulfilled');
    const failedClaims = results.filter((r) => r.status === 'rejected');

    console.log(`✅ 成功领取: ${successfulClaims.length}`);
    console.log(`❌ 失败领取: ${failedClaims.length}`);

    // 验证成功数量
    expect(successfulClaims.length).toBe(100);

    // 验证总领取金额不超过 totalAmount
    const claims = airdropModel.getAirdropClaims(airdrop.id);
    const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);
    expect(totalClaimed).toBeLessThanOrEqual(airdrop.totalAmount);
    expect(totalClaimed).toBe(1000); // 100 users * 10 each

    // 验证每个用户只领取了一次
    const userClaimCounts = new Map<string, number>();
    claims.forEach((claim) => {
      const count = userClaimCounts.get(claim.userId) || 0;
      userClaimCounts.set(claim.userId, count + 1);
    });

    userClaimCounts.forEach((count, _userId) => {
      expect(count).toBe(1); // 每个用户只能领取一次
    });

    // 验证没有死锁（应该在 5 秒内完成）
    expect(duration).toBeLessThan(5000);
  });

  /**
   * 🔥 测试 2: 验证并发领取不会超发
   */
  it('should prevent over-issuance during concurrent claims', async () => {
    // 创建空投活动：总量 100，每人 10，最多 10 个人能领取
    const airdrop = airdropModel.createAirdrop({
      name: 'Limited Airdrop',
      description: 'Test over-issuance prevention',
      totalAmount: 100,
      perUserAmount: 10,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000),
    });

    airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

    // 创建 20 个用户并发领取（但只有 10 个应该成功）
    const userIds = Array.from({ length: 20 }, (_, i) => `user_${i}`);

    const promises = userIds.map((userId) => airdropModel.createClaim(airdrop.id, userId, 10));

    const results = await Promise.allSettled(promises);

    // 统计成功和失败数量
    const successfulClaims = results.filter((r) => r.status === 'fulfilled');
    const failedClaims = results.filter((r) => r.status === 'rejected');

    console.log(`✅ 成功领取: ${successfulClaims.length}`);
    console.log(`❌ 失败领取（余额不足）: ${failedClaims.length}`);

    // 验证：只有 10 个成功
    expect(successfulClaims.length).toBe(10);
    expect(failedClaims.length).toBe(10);

    // 验证总领取金额不超过 totalAmount
    const claims = airdropModel.getAirdropClaims(airdrop.id);
    const totalClaimed = claims.reduce((sum, claim) => sum + claim.amount, 0);
    expect(totalClaimed).toBe(100); // 正好 100
    expect(totalClaimed).toBeLessThanOrEqual(airdrop.totalAmount);
  });

  /**
   * 🔥 测试 3: 验证同一个用户并发领取多次，只有一次成功
   */
  it('should prevent duplicate claims from same user', async () => {
    const airdrop = airdropModel.createAirdrop({
      name: 'Duplicate Test',
      description: 'Test duplicate prevention',
      totalAmount: 1000,
      perUserAmount: 10,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000),
    });

    airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

    // 同一个用户并发领取 10 次
    const userId = 'user_duplicate';
    const promises = Array.from({ length: 10 }, () =>
      airdropModel.createClaim(airdrop.id, userId, 10)
    );

    const results = await Promise.allSettled(promises);

    // 统计成功和失败数量
    const successfulClaims = results.filter((r) => r.status === 'fulfilled');
    const failedClaims = results.filter((r) => r.status === 'rejected');

    console.log(`✅ 成功领取: ${successfulClaims.length}`);
    console.log(`❌ 失败领取（重复领取）: ${failedClaims.length}`);

    // 验证：只有 1 次成功，9 次失败
    expect(successfulClaims.length).toBe(1);
    expect(failedClaims.length).toBe(9);

    // 验证失败原因是"已领取"
    failedClaims.forEach((result) => {
      if (result.status === 'rejected') {
        expect(result.reason.message).toContain('already claimed');
      }
    });
  });

  /**
   * 🔥 测试 4: 验证不会死锁（极端并发场景）
   */
  it('should not deadlock under extreme concurrency', async () => {
    const airdrop = airdropModel.createAirdrop({
      name: 'Extreme Test',
      description: 'Test deadlock prevention',
      totalAmount: 10000,
      perUserAmount: 10,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000),
    });

    airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

    // 创建 500 个用户极端并发领取
    const userIds = Array.from({ length: 500 }, (_, i) => `extreme_user_${i}`);

    const startTime = Date.now();
    const promises = userIds.map((userId) => airdropModel.createClaim(airdrop.id, userId, 10));

    // 设置超时：如果 10 秒内未完成，说明可能死锁
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Possible deadlock detected')), 10000);
    });

    try {
      await Promise.race([Promise.allSettled(promises), timeoutPromise]);

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`✅ 500 个极端并发请求完成，耗时: ${duration}ms`);

      // 验证没有死锁（应该在 10 秒内完成）
      expect(duration).toBeLessThan(10000);
    } catch (error) {
      // 如果超时，测试失败
      throw new Error('Deadlock detected: Operation timed out after 10 seconds');
    }
  }, 15000); // 设置 Jest 超时为 15 秒
});
