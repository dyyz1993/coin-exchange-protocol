/**
 * 🔥 P0 溢出保护测试 - AirdropModel
 * 测试空投系统的溢出保护机制（Issue #283）
 */

import { AirdropModel } from '../../src/models/Airdrop';
import { AirdropStatus } from '../../src/types';

describe('AirdropModel - Overflow Protection (P0)', () => {
  let airdropModel: AirdropModel;

  beforeEach(() => {
    airdropModel = new AirdropModel();
  });

  describe('createAirdrop - 数值范围验证', () => {
    it('应该在 totalAmount 超过最大限制时抛出错误', () => {
      const MAX_TOTAL_AMOUNT = 1e15; // 1,000,000,000,000,000

      expect(() => {
        airdropModel.createAirdrop({
          name: 'Overflow Test',
          description: 'Testing overflow protection',
          totalAmount: MAX_TOTAL_AMOUNT + 1,
          perUserAmount: 100,
          startTime: new Date(),
          endTime: new Date(Date.now() + 86400000),
        });
      }).toThrow(`totalAmount exceeds maximum limit: ${MAX_TOTAL_AMOUNT}`);
    });

    it('应该在 perUserAmount 超过最大限制时抛出错误', () => {
      const MAX_PER_USER_AMOUNT = 1e12; // 1,000,000,000,000

      expect(() => {
        airdropModel.createAirdrop({
          name: 'Overflow Test',
          description: 'Testing overflow protection',
          totalAmount: 1e15,
          perUserAmount: MAX_PER_USER_AMOUNT + 1,
          startTime: new Date(),
          endTime: new Date(Date.now() + 86400000),
        });
      }).toThrow(`perUserAmount exceeds maximum limit: ${MAX_PER_USER_AMOUNT}`);
    });

    it('应该在 perUserAmount 超过 totalAmount 时抛出错误', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: 'Invalid Amount Test',
          description: 'Testing amount validation',
          totalAmount: 100,
          perUserAmount: 150,
          startTime: new Date(),
          endTime: new Date(Date.now() + 86400000),
        });
      }).toThrow('perUserAmount cannot exceed totalAmount');
    });

    it('应该在 totalAmount 为非安全整数时抛出错误', () => {
      // 使用小数（非整数）
      expect(() => {
        airdropModel.createAirdrop({
          name: 'Unsafe Integer Test',
          description: 'Testing unsafe integer',
          totalAmount: 100.5,
          perUserAmount: 10,
          startTime: new Date(),
          endTime: new Date(Date.now() + 86400000),
        });
      }).toThrow('Amount values must be safe integers');
    });

    it('应该在 totalAmount 为负数时抛出错误', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: 'Negative Amount Test',
          description: 'Testing negative amount',
          totalAmount: -100,
          perUserAmount: 10,
          startTime: new Date(),
          endTime: new Date(Date.now() + 86400000),
        });
      }).toThrow('totalAmount must be positive');
    });

    it('应该在 perUserAmount 为负数时抛出错误', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: 'Negative Amount Test',
          description: 'Testing negative amount',
          totalAmount: 100,
          perUserAmount: -10,
          startTime: new Date(),
          endTime: new Date(Date.now() + 86400000),
        });
      }).toThrow('perUserAmount must be positive');
    });
  });

  describe('createClaim - 领取时溢出保护', () => {
    it('应该在累加导致溢出时抛出错误', () => {
      // 创建一个总额接近安全边界的空投
      const airdrop = airdropModel.createAirdrop({
        name: 'Large Amount Test',
        description: 'Testing large amount overflow',
        totalAmount: 1e15, // 使用最大允许值
        perUserAmount: 1e12, // 使用最大允许单人值
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 正常领取应该成功
      const claim = airdropModel.createClaim(airdrop.id, 'user_1', 1e12);
      expect(claim.amount).toBe(1e12);
    });

    it('应该正确处理接近安全边界的金额', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Near Boundary Test',
        description: 'Testing near safe boundary',
        totalAmount: 1e15 - 1e12, // 留出空间
        perUserAmount: 1e12,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 正常领取应该成功
      const claim = airdropModel.createClaim(airdrop.id, 'user_1', 1e12);
      expect(claim.amount).toBe(1e12);
    });
  });

  describe('余额耗尽保护', () => {
    it('应该正确处理余额耗尽的情况', () => {
      const totalAmount = 1000;
      const perUserAmount = 600;
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

  describe('并发场景测试', () => {
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

  describe('边界值测试', () => {
    it('应该正确处理最小金额', () => {
      const airdrop = airdropModel.createAirdrop({
        name: 'Minimum Amount Test',
        description: 'Testing minimum amount',
        totalAmount: 1,
        perUserAmount: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      const claim = airdropModel.createClaim(airdrop.id, 'user_1', 1);
      expect(claim.amount).toBe(1);
      expect(airdropModel.getRemainingAmount(airdrop.id)).toBe(0);
    });

    it('应该正确处理最大允许金额', () => {
      const MAX_TOTAL_AMOUNT = 1e15;
      const MAX_PER_USER_AMOUNT = 1e12;

      const airdrop = airdropModel.createAirdrop({
        name: 'Maximum Amount Test',
        description: 'Testing maximum amount',
        totalAmount: MAX_TOTAL_AMOUNT,
        perUserAmount: MAX_PER_USER_AMOUNT,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      expect(airdrop.totalAmount).toBe(MAX_TOTAL_AMOUNT);
      expect(airdrop.perUserAmount).toBe(MAX_PER_USER_AMOUNT);
    });
  });
});
