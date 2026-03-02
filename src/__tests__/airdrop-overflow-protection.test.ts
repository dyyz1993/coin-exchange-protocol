/**
 * 空投系统溢出保护测试
 * Issue #283 - P0 资金安全：验证 claimedAmount 溢出保护
 *
 * 测试覆盖：
 * 1. 超大数值创建验证
 * 2. 累加溢出检测
 * 3. 安全整数边界检查
 * 4. 并发场景下的溢出保护
 */

import { airdropModel } from '../models/Airdrop';
import { airdropService } from '../services/airdrop.service';
import { AirdropStatus } from '../types';

describe('空投系统溢出保护测试 (Issue #283)', () => {
  beforeEach(() => {
    // 清空所有数据
    (airdropModel as any).airdrops.clear();
    (airdropModel as any).claims.clear();
    (airdropModel as any).userClaims.clear();
  });

  describe('1️⃣ 超大数值创建验证', () => {
    test('❌ 拒绝超大 totalAmount（超过 1e15）', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: '恶意超大空投',
          description: '测试溢出',
          totalAmount: 2e15, // 超过限制
          perUserAmount: 100,
          startTime: new Date(),
          endTime: new Date(Date.now() + 10000),
        });
      }).toThrow(/totalAmount exceeds maximum limit/);
    });

    test('❌ 拒绝超大 perUserAmount（超过 1e12）', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: '恶意超大单次领取',
          description: '测试溢出',
          totalAmount: 1e12,
          perUserAmount: 2e12, // 超过限制
          startTime: new Date(),
          endTime: new Date(Date.now() + 10000),
        });
      }).toThrow(/perUserAmount exceeds maximum limit/);
    });

    test('❌ 拒绝 perUserAmount 大于 totalAmount', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: '不合理空投',
          description: '测试',
          totalAmount: 100,
          perUserAmount: 200, // 大于总额
          startTime: new Date(),
          endTime: new Date(Date.now() + 10000),
        });
      }).toThrow(/perUserAmount cannot exceed totalAmount/);
    });

    test('❌ 拒绝负数 totalAmount', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: '负数空投',
          description: '测试',
          totalAmount: -100,
          perUserAmount: 10,
          startTime: new Date(),
          endTime: new Date(Date.now() + 10000),
        });
      }).toThrow(/totalAmount must be positive/);
    });

    test('❌ 拒绝不安全整数', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: '不安全整数空投',
          description: '测试',
          totalAmount: Number.MAX_SAFE_INTEGER + 1, // 不安全整数
          perUserAmount: 100,
          startTime: new Date(),
          endTime: new Date(Date.now() + 10000),
        });
      }).toThrow(/Amount values must be safe integers/);
    });

    test('✅ 接受边界值（刚好等于最大限制）', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '边界测试空投',
        description: '测试',
        totalAmount: 1e15, // 刚好等于最大限制
        perUserAmount: 1e12, // 刚好等于最大限制
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
      });

      expect(airdrop).toBeDefined();
      expect(airdrop.totalAmount).toBe(1e15);
      expect(airdrop.perUserAmount).toBe(1e12);
    });

    test('✅ 接受合理的大数值', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '大额空投',
        description: '测试',
        totalAmount: 1e10, // 100亿
        perUserAmount: 1e6, // 100万
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
      });

      expect(airdrop).toBeDefined();
      expect(airdrop.totalAmount).toBe(1e10);
      expect(airdrop.perUserAmount).toBe(1e6);
    });
  });

  describe('2️⃣ 累加溢出检测', () => {
    test('❌ 阻止累加溢出（接近 MAX_SAFE_INTEGER）', async () => {
      // 创建一个接近上限的空投
      const airdrop = airdropModel.createAirdrop({
        name: '高风险空投',
        description: '测试溢出',
        totalAmount: 4503599627370496, // MAX_SAFE_AMOUNT
        perUserAmount: 4503599627370496, // 一次性领取全部
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(Date.now() + 10000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 第一次领取应该成功
      const claim1 = await airdropService.claimAirdrop(airdrop.id, 'user1');
      expect(claim1.success).toBe(true);

      // 手动修改 claimedAmount 模拟溢出场景
      const airdropData = airdropModel.getAirdrop(airdrop.id);
      if (airdropData) {
        // 模拟已经领取了接近上限的金额
        (airdropData as any).claimedAmount = 4503599627370490;
      }

      // 第二次领取应该因为溢出检测而失败
      await expect(airdropService.claimAirdrop(airdrop.id, 'user2')).rejects.toThrow(
        /Overflow detected|Unsafe integer|Insufficient airdrop balance/
      );
    });

    test('✅ 正常累加不触发溢出检测', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: '正常累加测试',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(Date.now() + 10000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 多次领取
      for (let i = 1; i <= 5; i++) {
        const result = await airdropService.claimAirdrop(airdrop.id, `user${i}`);
        expect(result.success).toBe(true);
      }

      // 验证累加正确
      const finalAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(finalAirdrop?.claimedAmount).toBe(500);
    });
  });

  describe('3️⃣ 安全整数边界检查', () => {
    test('✅ 确保所有数值操作都是安全整数', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: '安全整数测试',
        description: '测试',
        totalAmount: 100000,
        perUserAmount: 1000,
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(Date.now() + 10000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 进行多次领取
      for (let i = 1; i <= 50; i++) {
        await airdropService.claimAirdrop(airdrop.id, `user${i}`);
      }

      // 验证所有数值都是安全整数
      const finalAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(Number.isSafeInteger(finalAirdrop?.totalAmount)).toBe(true);
      expect(Number.isSafeInteger(finalAirdrop?.claimedAmount)).toBe(true);
      expect(Number.isSafeInteger(finalAirdrop?.perUserAmount)).toBe(true);
      expect(Number.isSafeInteger(finalAirdrop?.currentClaims)).toBe(true);
    });
  });

  describe('4️⃣ 并发场景下的溢出保护', () => {
    test('🔒 并发领取不会导致溢出', async () => {
      const airdrop = airdropModel.createAirdrop({
        name: '并发溢出测试',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(Date.now() + 10000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 模拟 20 个用户并发领取（理论上只能 10 人成功）
      const promises = [];
      for (let i = 1; i <= 20; i++) {
        promises.push(airdropService.claimAirdrop(airdrop.id, `user${i}`).catch((e) => e));
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => !(r instanceof Error)).length;
      const failCount = results.filter((r) => r instanceof Error).length;

      // 验证只有 10 人成功
      expect(successCount).toBe(10);
      expect(failCount).toBe(10);

      // 验证总额正确，没有溢出
      const finalAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(finalAirdrop?.claimedAmount).toBe(1000);
      expect(Number.isSafeInteger(finalAirdrop?.claimedAmount)).toBe(true);
    });
  });

  describe('5️⃣ 极端场景测试', () => {
    test('⚠️ 测试 Number.MAX_SAFE_INTEGER 边界', () => {
      // 尝试创建超大空投
      expect(() => {
        airdropModel.createAirdrop({
          name: '极端测试',
          description: '测试',
          totalAmount: Number.MAX_SAFE_INTEGER,
          perUserAmount: 1,
          startTime: new Date(),
          endTime: new Date(Date.now() + 10000),
        });
      }).toThrow(/totalAmount exceeds maximum limit/);
    });

    test('✅ 测试零值拒绝', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: '零值测试',
          description: '测试',
          totalAmount: 0,
          perUserAmount: 0,
          startTime: new Date(),
          endTime: new Date(Date.now() + 10000),
        });
      }).toThrow(/must be positive/);
    });

    test('✅ 测试浮点数拒绝', () => {
      expect(() => {
        airdropModel.createAirdrop({
          name: '浮点数测试',
          description: '测试',
          totalAmount: 100.5,
          perUserAmount: 10.5,
          startTime: new Date(),
          endTime: new Date(Date.now() + 10000),
        });
      }).toThrow(/must be safe integers/);
    });
  });
});
