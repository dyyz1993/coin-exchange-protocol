/**
 * 空投服务测试
 * 测试空投创建、领取、状态管理等核心功能
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { airdropService } from '../services/airdrop.service';
import { airdropModel } from '../models/Airdrop';
import { accountModel } from '../models/Account';
import { AirdropStatus } from '../types';

describe('空投服务测试', () => {
  const testUserId = 'test-user-airdrop';
  const adminUserId = 'admin-user';

  beforeEach(() => {
    // 重置测试数据
    const existingAccount = accountModel.getAccountByUserId(testUserId);
    if (!existingAccount) {
      accountModel.createAccount(testUserId, 1000);
    }
  });

  describe('创建空投活动', () => {
    test('应该成功创建空投活动', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000); // 1秒后开始
      const endTime = new Date(now.getTime() + 3600000); // 1小时后结束

      const result = await airdropService.createAirdrop({
        name: '测试空投',
        description: '这是一个测试空投活动',
        totalAmount: 10000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      expect(result).toBeDefined();
      expect(result.airdropId).toBeDefined();
      expect(result.name).toBe('测试空投');
      expect(result.totalAmount).toBe(10000);
      expect(result.perUserAmount).toBe(100);
      expect(result.status).toBe(AirdropStatus.PENDING);
    });

    test('应该拒绝无效的时间范围', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 3600000); // 1小时后开始
      const endTime = new Date(now.getTime() + 1000); // 1秒后结束（早于开始时间）

      await expect(
        airdropService.createAirdrop({
          name: '无效空投',
          description: '时间范围无效',
          totalAmount: 10000,
          perUserAmount: 100,
          startTime,
          endTime,
        })
      ).rejects.toThrow('开始时间必须早于结束时间');
    });

    test('应该拒绝无效的金额', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      await expect(
        airdropService.createAirdrop({
          name: '无效金额空投',
          description: '金额为0',
          totalAmount: 0,
          perUserAmount: 100,
          startTime,
          endTime,
        })
      ).rejects.toThrow('金额必须大于0');

      await expect(
        airdropService.createAirdrop({
          name: '无效金额空投',
          description: '每人金额为0',
          totalAmount: 10000,
          perUserAmount: 0,
          startTime,
          endTime,
        })
      ).rejects.toThrow('金额必须大于0');
    });
  });

  describe('启动空投活动', () => {
    test('应该成功启动待处理状态的空投', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const airdrop = await airdropService.createAirdrop({
        name: '待启动空投',
        description: '测试启动',
        totalAmount: 5000,
        perUserAmount: 50,
        startTime,
        endTime,
      });

      const result = await airdropService.startAirdrop(airdrop.airdropId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(AirdropStatus.ACTIVE);
    });

    test('应该拒绝启动不存在的空投', async () => {
      await expect(airdropService.startAirdrop('non-existent-id')).rejects.toThrow(
        '空投活动不存在'
      );
    });

    test('应该拒绝启动非待处理状态的空投', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const airdrop = await airdropService.createAirdrop({
        name: '测试空投',
        description: '测试重复启动',
        totalAmount: 5000,
        perUserAmount: 50,
        startTime,
        endTime,
      });

      await airdropService.startAirdrop(airdrop.airdropId);

      await expect(airdropService.startAirdrop(airdrop.airdropId)).rejects.toThrow(
        '只有待处理状态的空投可以启动'
      );
    });
  });

  describe('用户领取空投', () => {
    let activeAirdropId: string;

    beforeEach(async () => {
      const now = new Date();
      // 创建已经激活且在有效期内的空投
      const startTime = new Date(now.getTime() - 1000); // 1秒前开始
      const endTime = new Date(now.getTime() + 3600000); // 1小时后结束

      const airdrop = await airdropService.createAirdrop({
        name: '可领取空投',
        description: '测试领取',
        totalAmount: 10000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      await airdropService.startAirdrop(airdrop.airdropId);
      activeAirdropId = airdrop.airdropId;
    });

    test('应该成功领取空投', async () => {
      const initialBalance = accountModel.getAccountByUserId(testUserId)!.balance;

      const result = await airdropService.claimAirdrop(activeAirdropId, testUserId);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(100);
      expect(result.claimId).toBeDefined();
      expect(result.newBalance).toBe(initialBalance + 100);
    });

    test('应该拒绝重复领取', async () => {
      await airdropService.claimAirdrop(activeAirdropId, testUserId);

      await expect(airdropService.claimAirdrop(activeAirdropId, testUserId)).rejects.toThrow(
        '您已经领取过此空投'
      );
    });

    test('应该拒绝领取不存在的空投', async () => {
      await expect(airdropService.claimAirdrop('non-existent-id', testUserId)).rejects.toThrow(
        '空投活动不存在'
      );
    });

    test('应该拒绝领取未激活的空投', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const airdrop = await airdropService.createAirdrop({
        name: '未激活空投',
        description: '测试',
        totalAmount: 10000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      await expect(airdropService.claimAirdrop(airdrop.airdropId, testUserId)).rejects.toThrow(
        '空投活动未激活'
      );
    });
  });

  describe('结束空投活动', () => {
    test('应该成功结束空投活动', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const airdrop = await airdropService.createAirdrop({
        name: '测试结束',
        description: '测试',
        totalAmount: 10000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      await airdropService.startAirdrop(airdrop.airdropId);
      const result = await airdropService.endAirdrop(airdrop.airdropId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(AirdropStatus.COMPLETED);
      expect(result.totalAmount).toBe(10000);
    });
  });

  describe('取消空投活动', () => {
    test('应该成功取消空投活动', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const airdrop = await airdropService.createAirdrop({
        name: '测试取消',
        description: '测试',
        totalAmount: 10000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      const result = await airdropService.cancelAirdrop(airdrop.airdropId, '测试取消');

      expect(result.success).toBe(true);
      expect(result.status).toBe(AirdropStatus.CANCELLED);
    });

    test('应该拒绝取消已完成的空投', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const airdrop = await airdropService.createAirdrop({
        name: '测试取消',
        description: '测试',
        totalAmount: 10000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      await airdropService.startAirdrop(airdrop.airdropId);
      await airdropService.endAirdrop(airdrop.airdropId);

      await expect(airdropService.cancelAirdrop(airdrop.airdropId, '测试取消')).rejects.toThrow(
        '已完成的空投活动无法取消'
      );
    });
  });

  describe('获取空投详情', () => {
    test('应该成功获取空投详情', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const airdrop = await airdropService.createAirdrop({
        name: '测试详情',
        description: '测试',
        totalAmount: 10000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      await airdropService.startAirdrop(airdrop.airdropId);
      const detail = airdropService.getAirdropDetail(airdrop.airdropId);

      expect(detail.airdrop).toBeDefined();
      expect(detail.claimCount).toBe(0);
      expect(detail.totalClaimed).toBe(0);
      expect(detail.canClaim).toBe(true);
    });
  });

  describe('获取空投统计', () => {
    test('应该成功获取空投统计信息', async () => {
      const stats = airdropService.getAirdropStats();

      expect(stats).toHaveProperty('totalAirdrops');
      expect(stats).toHaveProperty('activeAirdrops');
      expect(stats).toHaveProperty('completedAirdrops');
      expect(stats).toHaveProperty('totalDistributed');
    });
  });
});
