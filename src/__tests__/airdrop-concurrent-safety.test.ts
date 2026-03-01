/**
 * 空投并发安全测试
 * 验证在并发场景下，空投领取功能是否能正确防止超额领取和重复领取
 */

import { airdropModel } from '../models/Airdrop';
import { AirdropStatus } from '../types';

describe('Airdrop Concurrent Safety Tests', () => {
  beforeEach(() => {
    // 重置模型状态
    (airdropModel as any).airdrops.clear();
    (airdropModel as any).claims.clear();
    (airdropModel as any).userClaims.clear();
    (airdropModel as any).claimLocks.clear();
    (airdropModel as any).airdropLocks.clear();
    (airdropModel as any).requestCache.clear();
  });

  describe('1. 用户重复领取防护', () => {
    it('应该防止同一用户重复领取空投', () => {
      // 创建一个空投活动
      const airdrop = airdropModel.createAirdrop({
        name: 'Test Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 第一次领取应该成功
      const claim1 = airdropModel.createClaim(airdrop.id, 'user1', 100);
      expect(claim1).toBeDefined();
      expect(claim1.amount).toBe(100);

      // 第二次领取应该返回第一次的记录（幂等性）
      const claim2 = airdropModel.createClaim(airdrop.id, 'user1', 100);
      expect(claim2.id).toBe(claim1.id); // 返回相同的记录

      // 验证用户只领取了一次
      const claims = airdropModel.getUserClaims('user1');
      expect(claims.length).toBe(1);
    });

    it('应该正确记录已领取金额', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Test Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 多个用户领取
      for (let i = 1; i <= 5; i++) {
        airdropModel.createClaim(airdrop.id, `user${i}`, 100);
      }

      // 验证已领取金额
      const updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(updatedAirdrop?.claimedAmount).toBe(500);
      expect(updatedAirdrop?.currentClaims).toBe(5);
    });
  });

  describe('2. 总额耗尽检查', () => {
    it('应该在总额耗尽时拒绝领取', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Limited Airdrop',
        description: 'Test Description',
        totalAmount: 300, // 只够 3 个用户领取
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 前 3 个用户应该成功领取
      for (let i = 1; i <= 3; i++) {
        const claim = airdropModel.createClaim(airdrop.id, `user${i}`, 100);
        expect(claim).toBeDefined();
      }

      // 第 4 个用户应该失败
      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user4', 100);
      }).toThrow('Insufficient airdrop balance');

      // 验证最终状态
      const updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(updatedAirdrop?.claimedAmount).toBe(300);
      expect(updatedAirdrop?.currentClaims).toBe(3);
    });
  });

  describe('3. 并发领取测试', () => {
    it('应该正确处理并发领取请求（模拟）', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Concurrent Test Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 模拟 10 个用户并发领取
      const userIds = Array.from({ length: 10 }, (_, i) => `user${i + 1}`);

      const promises = userIds.map((userId) => {
        return new Promise((resolve) => {
          // 模拟异步操作
          setTimeout(() => {
            try {
              const claim = airdropModel.createClaim(airdrop.id, userId, 100);
              resolve({ success: true, userId, claimId: claim.id });
            } catch (error) {
              resolve({ success: false, userId, error: (error as Error).message });
            }
          }, Math.random() * 10); // 随机延迟 0-10ms
        });
      });

      const results = await Promise.all(promises);

      // 验证所有用户都成功领取（因为总额足够）
      const successCount = results.filter((r: any) => r.success).length;
      expect(successCount).toBe(10);

      // 验证最终状态
      const updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(updatedAirdrop?.claimedAmount).toBe(1000);
      expect(updatedAirdrop?.currentClaims).toBe(10);
    });

    it('应该在总额不足时正确处理并发请求', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Limited Concurrent Test',
        description: 'Test Description',
        totalAmount: 300, // 只够 3 个用户
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 模拟 10 个用户并发领取，但只有 3 个能成功
      const userIds = Array.from({ length: 10 }, (_, i) => `user${i + 1}`);

      const promises = userIds.map((userId) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            try {
              const claim = airdropModel.createClaim(airdrop.id, userId, 100);
              resolve({ success: true, userId, claimId: claim.id });
            } catch (error) {
              resolve({ success: false, userId, error: (error as Error).message });
            }
          }, Math.random() * 5); // 更短的延迟，增加并发冲突概率
        });
      });

      const results = await Promise.all(promises);

      // 验证只有 3 个用户成功
      const successCount = results.filter((r: any) => r.success).length;
      expect(successCount).toBe(3);

      // 验证失败的用户收到正确的错误信息
      const failedResults = results.filter((r: any) => !r.success);
      expect(failedResults.length).toBe(7);
      failedResults.forEach((r: any) => {
        expect(r.error).toContain('Insufficient airdrop balance');
      });

      // 验证最终状态
      const updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(updatedAirdrop?.claimedAmount).toBe(300);
      expect(updatedAirdrop?.currentClaims).toBe(3);
    });
  });

  describe('4. 防重放攻击测试', () => {
    it('应该使用 nonce 防止重放攻击', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Replay Test Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      const nonce = 'unique_nonce_12345';

      // 第一次请求
      const claim1 = airdropModel.createClaim(airdrop.id, 'user1', 100, nonce);
      expect(claim1).toBeDefined();

      // 使用相同的 nonce 再次请求（应该返回相同的结果）
      const claim2 = airdropModel.createClaim(airdrop.id, 'user1', 100, nonce);
      expect(claim2.id).toBe(claim1.id);

      // 验证只记录了一次
      const claims = airdropModel.getUserClaims('user1');
      expect(claims.length).toBe(1);
    });

    it('不同的 nonce 应该被拒绝（用户已领取）', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Nonce Test Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 第一次请求
      const claim1 = airdropModel.createClaim(airdrop.id, 'user1', 100, 'nonce1');
      expect(claim1).toBeDefined();

      // 使用不同的 nonce 再次请求（应该返回第一次的记录）
      const claim2 = airdropModel.createClaim(airdrop.id, 'user1', 100, 'nonce2');
      expect(claim2.id).toBe(claim1.id);
    });
  });

  describe('5. 锁机制测试', () => {
    it('应该正确获取和释放锁', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Lock Test Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 领取应该成功
      const claim = airdropModel.createClaim(airdrop.id, 'user1', 100);
      expect(claim).toBeDefined();

      // 验证锁已被释放
      const lockKey = `user1:${airdrop.id}`;
      const lockExists = (airdropModel as any).claimLocks.has(lockKey);
      expect(lockExists).toBe(false);
    });
  });

  describe('6. 边界条件测试', () => {
    it('应该在空投未激活时拒绝领取', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Inactive Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      // 不激活空投

      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user1', 100);
      }).toThrow('Airdrop is not active');
    });

    it('应该在空投未开始时拒绝领取', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Future Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() + 10000), // 未来时间
        endTime: new Date(Date.now() + 20000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user1', 100);
      }).toThrow('Airdrop is not within the valid time range');
    });

    it('应该在空投已结束时拒绝领取', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Expired Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 20000),
        endTime: new Date(Date.now() - 10000), // 已过期
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user1', 100);
      }).toThrow('Airdrop is not within the valid time range');
    });

    it('应该在领取金额超过每人限额时拒绝', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Limit Test Airdrop',
        description: 'Test Description',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user1', 200); // 超过限额
      }).toThrow('Amount exceeds per-user limit');
    });
  });
});
