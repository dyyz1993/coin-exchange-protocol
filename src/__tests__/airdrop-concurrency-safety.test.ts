/**
 * 空投并发安全性测试
 *
 * 测试目标：
 * 1. 验证并发领取时的总额控制
 * 2. 验证基于 claims 的实时总额计算
 * 3. 验证不会发生超额领取
 * 4. 验证每人限额控制
 * 5. 验证重复领取防护
 */

import { AirdropModel } from '../models/Airdrop';
import { AirdropStatus } from '../types';

describe('空投并发安全性测试', () => {
  let airdropModel: AirdropModel;

  beforeEach(() => {
    // 每个测试使用新的实例，避免状态污染
    airdropModel = new AirdropModel();
  });

  describe('1️⃣ 基础功能测试', () => {
    test('应该成功创建空投活动', () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const airdrop = airdropModel.createAirdrop({
        name: '测试空投',
        description: '测试空投描述',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      expect(airdrop).toBeDefined();
      expect(airdrop.name).toBe('测试空投');
      expect(airdrop.totalAmount).toBe(1000);
      expect(airdrop.perUserAmount).toBe(100);
      expect(airdrop.claimedAmount).toBe(0);
      expect(airdrop.currentClaims).toBe(0);
      expect(airdrop.status).toBe(AirdropStatus.PENDING);
    });

    test('应该成功激活空投活动', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '测试空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
      });

      const updated = airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);
      expect(updated.status).toBe(AirdropStatus.ACTIVE);
    });
  });

  describe('2️⃣ 并发领取总额检查（核心修复测试）', () => {
    test('🔥 应该基于 claims 实时计算已领取总额，避免超额领取', () => {
      // 创建总额为 100 的空投，每人限额 50
      const airdrop = airdropModel.createAirdrop({
        name: '并发测试空投',
        description: '测试并发领取',
        totalAmount: 100,
        perUserAmount: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 用户1领取 50
      const claim1 = airdropModel.createClaim(airdrop.id, 'user1', 50);
      expect(claim1.amount).toBe(50);

      // 验证 claimedAmount 基于实时 claims 计算
      const updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(updatedAirdrop!.claimedAmount).toBe(50);

      // 用户2领取 50（总额已满）
      const claim2 = airdropModel.createClaim(airdrop.id, 'user2', 50);
      expect(claim2.amount).toBe(50);

      // 验证总额正确
      const finalAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(finalAirdrop!.claimedAmount).toBe(100);

      // 用户3尝试领取应该失败
      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user3', 10);
      }).toThrow('空投金额已耗尽，无法继续领取');
    });

    test('🔥 应该在并发场景下准确计算剩余金额', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '并发场景测试',
        description: '测试剩余金额计算',
        totalAmount: 200,
        perUserAmount: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 模拟多个用户领取
      airdropModel.createClaim(airdrop.id, 'user1', 50);
      airdropModel.createClaim(airdrop.id, 'user2', 30);
      airdropModel.createClaim(airdrop.id, 'user3', 40);

      // 验证总额计算
      const updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(updatedAirdrop!.claimedAmount).toBe(120);

      // 剩余金额应该是 80
      const claims = airdropModel.getAirdropClaims(airdrop.id);
      const totalClaimed = claims.reduce((sum, c) => sum + c.amount, 0);
      const remaining = airdrop.totalAmount - totalClaimed;
      expect(remaining).toBe(80);
    });

    test('🔥 应该防止刚好超过总额的领取', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '边界测试',
        description: '测试边界条件',
        totalAmount: 100,
        perUserAmount: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 用户1领取 50
      airdropModel.createClaim(airdrop.id, 'user1', 50);

      // 用户2领取 40（剩余 10）
      airdropModel.createClaim(airdrop.id, 'user2', 40);

      // 用户3尝试领取 20 应该失败（只有 10 剩余）
      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user3', 20);
      }).toThrow('空投金额已耗尽，无法继续领取');
    });
  });

  describe('3️⃣ 每人限额检查', () => {
    test('应该拒绝超过每人限额的领取请求', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '限额测试',
        description: '测试每人限额',
        totalAmount: 1000,
        perUserAmount: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user1', 100);
      }).toThrow('Amount exceeds per-user limit');
    });

    test('应该允许刚好等于每人限额的领取', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '限额边界测试',
        description: '测试限额边界',
        totalAmount: 1000,
        perUserAmount: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      const claim = airdropModel.createClaim(airdrop.id, 'user1', 50);
      expect(claim.amount).toBe(50);
    });
  });

  describe('4️⃣ 重复领取防护', () => {
    test('应该防止用户重复领取同一空投', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '重复领取测试',
        description: '测试重复领取',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 第一次领取
      airdropModel.createClaim(airdrop.id, 'user1', 50);

      // 第二次领取应该失败
      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user1', 30);
      }).toThrow('User has already claimed this airdrop');
    });

    test('hasUserClaimed 应该正确返回领取状态', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '状态检查测试',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 领取前
      expect(airdropModel.hasUserClaimed('user1', airdrop.id)).toBe(false);

      // 领取
      airdropModel.createClaim(airdrop.id, 'user1', 50);

      // 领取后
      expect(airdropModel.hasUserClaimed('user1', airdrop.id)).toBe(true);
    });
  });

  describe('5️⃣ 状态和时间验证', () => {
    test('应该拒绝非活跃状态的空投领取', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '状态测试',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      // PENDING 状态
      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user1', 50);
      }).toThrow('Airdrop is not active');

      // COMPLETED 状态
      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.COMPLETED);
      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user1', 50);
      }).toThrow('Airdrop is not active');
    });

    test('应该拒绝时间范围外的领取', () => {
      // 未开始的空投
      const futureAirdrop = airdropModel.createAirdrop({
        name: '未来空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() + 10000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(futureAirdrop.id, AirdropStatus.ACTIVE);

      expect(() => {
        airdropModel.createClaim(futureAirdrop.id, 'user1', 50);
      }).toThrow('Airdrop is not within the valid time range');

      // 已结束的空投
      const pastAirdrop = airdropModel.createAirdrop({
        name: '过期空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
      });

      airdropModel.updateAirdropStatus(pastAirdrop.id, AirdropStatus.ACTIVE);

      expect(() => {
        airdropModel.createClaim(pastAirdrop.id, 'user1', 50);
      }).toThrow('Airdrop is not within the valid time range');
    });
  });

  describe('6️⃣ 领取记录查询', () => {
    test('应该正确获取用户的所有领取记录', () => {
      const airdrop1 = airdropModel.createAirdrop({
        name: '空投1',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      const airdrop2 = airdropModel.createAirdrop({
        name: '空投2',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop1.id, AirdropStatus.ACTIVE);
      airdropModel.updateAirdropStatus(airdrop2.id, AirdropStatus.ACTIVE);

      // 用户领取两个空投
      airdropModel.createClaim(airdrop1.id, 'user1', 50);
      airdropModel.createClaim(airdrop2.id, 'user1', 30);

      const userClaims = airdropModel.getUserClaims('user1');
      expect(userClaims.length).toBe(2);
      // 验证领取记录包含两次领取
      const amounts = userClaims.map((c) => c.amount);
      expect(amounts).toContain(50);
      expect(amounts).toContain(30);
    });

    test('应该正确获取空投的所有领取记录', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 多个用户领取
      airdropModel.createClaim(airdrop.id, 'user1', 50);
      airdropModel.createClaim(airdrop.id, 'user2', 30);
      airdropModel.createClaim(airdrop.id, 'user3', 20);

      const airdropClaims = airdropModel.getAirdropClaims(airdrop.id);
      expect(airdropClaims.length).toBe(3);
      expect(airdropClaims.reduce((sum, c) => sum + c.amount, 0)).toBe(100);
    });
  });

  describe('7️⃣ currentClaims 同步测试', () => {
    test('🔥 currentClaims 应该与实际 claims 数量保持同步', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '同步测试',
        description: '测试 currentClaims 同步',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      // 领取前
      let updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(updatedAirdrop!.currentClaims).toBe(0);

      // 第一次领取
      airdropModel.createClaim(airdrop.id, 'user1', 50);
      updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(updatedAirdrop!.currentClaims).toBe(1);

      // 第二次领取
      airdropModel.createClaim(airdrop.id, 'user2', 30);
      updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
      expect(updatedAirdrop!.currentClaims).toBe(2);

      // 验证与实际 claims 数量一致
      const claims = airdropModel.getAirdropClaims(airdrop.id);
      expect(updatedAirdrop!.currentClaims).toBe(claims.length);
    });
  });

  describe('8️⃣ 极端场景测试', () => {
    test('应该正确处理总额为0的空投', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '零总额测试',
        description: '测试',
        totalAmount: 0,
        perUserAmount: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      expect(() => {
        airdropModel.createClaim(airdrop.id, 'user1', 10);
      }).toThrow('空投金额已耗尽，无法继续领取');
    });

    test('应该正确处理小额领取', () => {
      const airdrop = airdropModel.createAirdrop({
        name: '小额测试',
        description: '测试',
        totalAmount: 100,
        perUserAmount: 1,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      });

      airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

      const claim = airdropModel.createClaim(airdrop.id, 'user1', 1);
      expect(claim.amount).toBe(1);
    });
  });
});
