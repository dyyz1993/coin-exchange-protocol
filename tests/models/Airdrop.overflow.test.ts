/**
 * 🔥 P0 溢出保护测试 - AirdropModel
 * 测试空投系统的溢出保护机制
 */

import { AirdropModel } from '../../src/models/Airdrop';
import { AirdropStatus } from '../../src/types';

describe('AirdropModel - Overflow Protection (P0)', () => {
  let airdropModel: AirdropModel;

  beforeEach(() => {
    airdropModel = new AirdropModel();
  });

  describe('safeAdd - 溢出保护', () => {
    it('应该在加法溢出时抛出错误', () => {
      const largeAmount = Number.MAX_SAFE_INTEGER - 10;
      const airdrop = airdropModel.createAirdrop({
        name: 'Overflow Test Airdrop',
        description: 'Testing overflow protection',
        totalAmount: largeAmount,
        perUserAmount: 100,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 创建大量领取记录以触发溢出
      for (let i = 0; i < 20; i++) {
        try {
          airdropModel.createClaim(airdrop.id, `user_${i}`, 100);
        } catch (error) {
          // 预期会失败，因为余额不足
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    it('应该正确处理接近 MAX_SAFE_INTEGER 的金额', () => {
      const nearMax = Number.MAX_SAFE_INTEGER - 1000;
      const airdrop = airdropModel.createAirdrop({
        name: 'Near Max Test',
        description: 'Testing near MAX_SAFE_INTEGER',
        totalAmount: nearMax,
        perUserAmount: 100,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 正常领取应该成功
      const claim = airdropModel.createClaim(airdrop.id, 'user_1', 100);
      expect(claim.amount).toBe(100);
    });
  });

  describe('safeSubtract - 下溢保护', () => {
    it('应该在减法结果为负数时抛出错误', () => {
      const smallAmount = 100;
      const airdrop = airdropModel.createAirdrop({
        name: 'Small Amount Test',
        description: 'Testing underflow protection',
        totalAmount: smallAmount,
        perUserAmount: 150, // 每个用户领取金额大于总金额
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 尝试领取超过总额的金额
      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user_1', 150);
      }).toThrow('Insufficient airdrop balance');
    });

    it('应该正确处理余额耗尽的情况', () => {
      const totalAmount = 100;
      const perUserAmount = 60;
      const airdrop = airdropModel.createAirdrop({
        name: 'Exhaustion Test',
        description: 'Testing airdrop exhaustion',
        totalAmount,
        perUserAmount,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 第一个用户领取成功
      const claim1 = airdropModel.createClaim(airdrop.id, 'user_1', perUserAmount);
      expect(claim1.amount).toBe(perUserAmount);

      // 第二个用户应该失败（余额不足）
      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user_2', perUserAmount);
      }).toThrow('Insufficient airdrop balance');
    });
  });

  describe('getRemainingAmount - 剩余金额计算', () => {
    it('应该正确计算剩余金额并防止溢出', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Remaining Amount Test',
        description: 'Testing remaining amount calculation',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 初始剩余金额
      expect(airdropModel.getRemainingAmount(airdrop.id)).toBe(1000);

      // 领取一次
      airdropModel.createClaim(airdrop.id, 'user_1', 100);
      expect(airdropModel.getRemainingAmount(airdrop.id)).toBe(900);

      // 再领取一次
      airdropModel.createClaim(airdrop.id, 'user_2', 100);
      expect(airdropModel.getRemainingAmount(airdrop.id)).toBe(800);
    });

    it('应该在大量领取后正确计算剩余金额', () => {
      const totalAmount = 10000;
      const perUserAmount = 100;
      const userCount = 50;
      const airdrop = airdropModel.createAirdrop({
        name: 'Mass Claims Test',
        description: 'Testing with many claims',
        totalAmount,
        perUserAmount,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 创建大量领取
      for (let i = 0; i < userCount; i++) {
        airdropModel.createClaim(airdrop.id, `user_${i}`, perUserAmount);
      }

      // 验证剩余金额
      const expectedRemaining = totalAmount - perUserAmount * userCount;
      expect(airdropModel.getRemainingAmount(airdrop.id)).toBe(expectedRemaining);
    });
  });

  describe('isAirdropExhausted - 空投耗尽检查', () => {
    it('应该正确识别空投已耗尽', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Exhaustion Check Test',
        description: 'Testing exhaustion check',
        totalAmount: 200,
        perUserAmount: 100,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 初始未耗尽
      expect(airdropModel.isAirdropExhausted(airdrop.id)).toBe(false);

      // 领取一次后仍未耗尽
      airdropModel.createClaim(airdrop.id, 'user_1', 100);
      expect(airdropModel.isAirdropExhausted(airdrop.id)).toBe(false);

      // 再领取一次后耗尽
      airdropModel.createClaim(airdrop.id, 'user_2', 100);
      expect(airdropModel.isAirdropExhausted(airdrop.id)).toBe(true);
    });
  });

  describe('createClaim - 完整流程溢出保护', () => {
    it('应该在并发场景下正确处理溢出保护', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Concurrent Test',
        description: 'Testing concurrent claims with overflow protection',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 模拟并发领取
      const claims = [];
      for (let i = 0; i < 15; i++) {
        try {
          const claim = airdropModel.createClaim(airdrop.id, `user_${i}`, 100);
          claims.push(claim);
        } catch (error) {
          // 预期部分会失败
        }
      }

      // 应该只有10个成功的领取（1000 / 100 = 10）
      expect(claims.length).toBe(10);

      // 验证最终剩余金额为0
      expect(airdropModel.getRemainingAmount(airdrop.id)).toBe(0);
    });
  });
});
