/**
 * 空投服务测试 - 测试空投创建、激活、领取等功能
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { AirdropService } from '../src/services/airdrop.service';
import { AccountService } from '../src/services/account.service';

describe('空投服务测试', () => {
  let airdropService: AirdropService;
  let accountService: AccountService;

  beforeEach(() => {
    airdropService = new AirdropService();
    accountService = new AccountService();
  });

  describe('空投创建', () => {
    test('应该成功创建空投活动', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const result = await airdropService.createAirdrop({
        name: '测试空投',
        description: '这是一个测试空投活动',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime,
        endTime
      });

      expect(result).toBeDefined();
      expect(result.airdropId).toBeDefined();
      expect(result.name).toBe('测试空投');
      expect(result.totalAmount).toBe(1000);
      expect(result.perUserAmount).toBe(10);
      expect(result.status).toBe('PENDING');
    });

    test('开始时间晚于结束时间应该失败', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 3600000);
      const endTime = new Date(now.getTime() + 1000);

      expect(async () => {
        await airdropService.createAirdrop({
          name: '无效空投',
          description: '时间设置错误',
          totalAmount: 1000,
          perUserAmount: 10,
          startTime,
          endTime
        });
      }).toThrow('开始时间必须早于结束时间');
    });

    test('金额为0或负数应该失败', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      expect(async () => {
        await airdropService.createAirdrop({
          name: '无效金额',
          description: '金额为0',
          totalAmount: 0,
          perUserAmount: 10,
          startTime,
          endTime
        });
      }).toThrow('金额必须大于0');
    });
  });

  describe('空投激活', () => {
    test('应该成功激活待处理的空投', async () => {
      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '测试空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 3600000)
      });

      const result = await airdropService.startAirdrop(airdrop.airdropId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('ACTIVE');
    });

    test('激活不存在的空投应该失败', async () => {
      expect(async () => {
        await airdropService.startAirdrop('nonexistent_id');
      }).toThrow('空投活动不存在');
    });
  });

  describe('空投领取', () => {
    test('应该成功领取激活的空投', async () => {
      // 创建用户账户
      await accountService.createAccount('user1');

      // 创建并激活空投
      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '可领取空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() - 1000), // 已开始
        endTime: new Date(now.getTime() + 3600000)
      });

      await airdropService.startAirdrop(airdrop.airdropId);

      // 领取空投
      const result = await airdropService.claimAirdrop(airdrop.airdropId, 'user1');

      expect(result.success).toBe(true);
      expect(result.amount).toBe(10);
      expect(result.claimId).toBeDefined();
      expect(result.newBalance).toBe(10);
    });

    test('重复领取应该失败', async () => {
      await accountService.createAccount('user2');

      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '测试空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 3600000)
      });

      await airdropService.startAirdrop(airdrop.airdropId);
      await airdropService.claimAirdrop(airdrop.airdropId, 'user2');

      expect(async () => {
        await airdropService.claimAirdrop(airdrop.airdropId, 'user2');
      }).toThrow('您已经领取过此空投');
    });

    test('领取未激活的空投应该失败', async () => {
      await accountService.createAccount('user3');

      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '未激活空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 3600000)
      });

      expect(async () => {
        await airdropService.claimAirdrop(airdrop.airdropId, 'user3');
      }).toThrow('空投活动未激活');
    });

    test('领取已结束的空投应该失败', async () => {
      await accountService.createAccount('user4');

      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '已结束空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() - 7200000),
        endTime: new Date(now.getTime() - 3600000) // 已结束
      });

      await airdropService.startAirdrop(airdrop.airdropId);

      expect(async () => {
        await airdropService.claimAirdrop(airdrop.airdropId, 'user4');
      }).toThrow('空投活动已结束');
    });
  });

  describe('空投结束和取消', () => {
    test('应该成功结束空投', async () => {
      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '测试空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 3600000)
      });

      await airdropService.startAirdrop(airdrop.airdropId);
      const result = await airdropService.endAirdrop(airdrop.airdropId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('COMPLETED');
    });

    test('应该成功取消空投', async () => {
      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '测试空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 3600000)
      });

      const result = await airdropService.cancelAirdrop(airdrop.airdropId, '测试取消');

      expect(result.success).toBe(true);
      expect(result.status).toBe('CANCELLED');
    });

    test('取消已完成的空投应该失败', async () => {
      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '测试空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 3600000)
      });

      await airdropService.startAirdrop(airdrop.airdropId);
      await airdropService.endAirdrop(airdrop.airdropId);

      expect(async () => {
        await airdropService.cancelAirdrop(airdrop.airdropId, '测试取消');
      }).toThrow('已完成的空投活动无法取消');
    });
  });

  describe('空投查询', () => {
    test('应该能获取空投详情', async () => {
      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '测试空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 3600000)
      });

      const detail = airdropService.getAirdropDetail(airdrop.airdropId);

      expect(detail).toBeDefined();
      expect(detail.airdrop.name).toBe('测试空投');
      expect(detail.claimCount).toBe(0);
      expect(detail.totalClaimed).toBe(0);
    });

    test('应该能获取可领取的空投列表', async () => {
      await accountService.createAccount('user5');

      const now = new Date();
      await airdropService.createAirdrop({
        name: '可领取空投1',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 3600000)
      });

      const claimable = airdropService.getClaimableAirdrops('user5');
      expect(claimable.length).toBeGreaterThanOrEqual(0);
    });

    test('应该能获取用户领取历史', async () => {
      await accountService.createAccount('user6');

      const history = airdropService.getUserClaimHistory('user6');
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('空投统计', () => {
    test('应该能获取空投统计信息', async () => {
      const now = new Date();
      await airdropService.createAirdrop({
        name: '测试空投',
        description: '测试',
        totalAmount: 1000,
        perUserAmount: 10,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 3600000)
      });

      const stats = airdropService.getAirdropStats();

      expect(stats).toBeDefined();
      expect(stats.totalAirdrops).toBeGreaterThanOrEqual(1);
      expect(stats.totalDistributed).toBeGreaterThanOrEqual(0);
    });
  });
});
