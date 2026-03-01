/**
 * 空投服务测试
 * 测试范围：空投创建、激活、领取验证、重复领取防护
 */

import { AirdropService } from '../../src/services/airdrop.service';
import { AccountService } from '../../src/services/account.service';
import { airdropModel } from '../../src/models/Airdrop';
import { AccountModel } from '../../src/models/Account';
import { TokenAccountModel } from '../../src/models/TokenAccount';
import { AirdropStatus } from '../../src/types';

describe('AirdropService', () => {
  let airdropService: AirdropService;
  let accountService: AccountService;

  beforeEach(() => {
    airdropService = new AirdropService();
    accountService = new AccountService();
    // 清空测试数据
    (airdropModel as any).airdrops.clear();
    (airdropModel as any).claims.clear();
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
  });

  afterEach(() => {
    // 清理测试数据
    (airdropModel as any).airdrops.clear();
    (airdropModel as any).claims.clear();
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
  });

  describe('createAirdrop', () => {
    test('应该成功创建空投活动', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60); // 1分钟后开始
      const endTime = new Date(now.getTime() + 1000 * 60 * 60); // 1小时后结束

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

    test('应该拒绝开始时间晚于结束时间的空投', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60 * 60); // 1小时后
      const endTime = new Date(now.getTime() + 1000 * 60); // 1分钟后

      expect(async () => {
        await airdropService.createAirdrop({
          name: '无效空投',
          description: '时间错误',
          totalAmount: 1000,
          perUserAmount: 100,
          startTime,
          endTime,
        });
      }).toThrow('开始时间必须早于结束时间');
    });

    test('应该拒绝无效的金额', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60 * 60);

      // 总金额为 0
      expect(async () => {
        await airdropService.createAirdrop({
          name: '无效空投',
          description: '金额错误',
          totalAmount: 0,
          perUserAmount: 100,
          startTime,
          endTime,
        });
      }).toThrow('金额必须大于0');

      // 每人金额为 0
      expect(async () => {
        await airdropService.createAirdrop({
          name: '无效空投',
          description: '金额错误',
          totalAmount: 1000,
          perUserAmount: 0,
          startTime,
          endTime,
        });
      }).toThrow('金额必须大于0');

      // 负金额
      expect(async () => {
        await airdropService.createAirdrop({
          name: '无效空投',
          description: '金额错误',
          totalAmount: -100,
          perUserAmount: 100,
          startTime,
          endTime,
        });
      }).toThrow('金额必须大于0');
    });

    test('应该支持不同的空投配置', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7天后

      const result = await airdropService.createAirdrop({
        name: '长期空投',
        description: '为期一周的空投活动',
        totalAmount: 1000000,
        perUserAmount: 1000,
        startTime,
        endTime,
      });

      expect(result.totalAmount).toBe(1000000);
      expect(result.perUserAmount).toBe(1000);
    });
  });

  describe('startAirdrop', () => {
    test('应该成功启动空投活动', async () => {
      const airdrop = await createTestAirdrop();

      const result = await airdropService.startAirdrop(airdrop.airdropId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(AirdropStatus.ACTIVE);
    });

    test('应该拒绝启动不存在的空投', async () => {
      expect(async () => {
        await airdropService.startAirdrop('non-existent-id');
      }).toThrow('空投活动不存在');
    });

    test('应该拒绝启动非待处理状态的空投', async () => {
      const airdrop = await createTestAirdrop();
      await airdropService.startAirdrop(airdrop.airdropId);

      // 尝试再次启动
      expect(async () => {
        await airdropService.startAirdrop(airdrop.airdropId);
      }).toThrow('只有待处理状态的空投可以启动');
    });
  });

  describe('claimAirdrop', () => {
    test('应该成功领取空投', async () => {
      const userId = 'test-user-001';
      const airdrop = await createActiveAirdrop();
      await accountService.createAccount(userId);

      const result = await airdropService.claimAirdrop(airdrop.airdropId, userId);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(100);
      expect(result.claimId).toBeDefined();
      expect(result.newBalance).toBe(100);
    });

    test('应该拒绝重复领取', async () => {
      const userId = 'test-user-002';
      const airdrop = await createActiveAirdrop();
      await accountService.createAccount(userId);

      await airdropService.claimAirdrop(airdrop.airdropId, userId);

      expect(async () => {
        await airdropService.claimAirdrop(airdrop.airdropId, userId);
      }).toThrow('您已经领取过此空投');
    });

    test('应该拒绝领取未激活的空投', async () => {
      const userId = 'test-user-003';
      const airdrop = await createTestAirdrop();
      await accountService.createAccount(userId);

      expect(async () => {
        await airdropService.claimAirdrop(airdrop.airdropId, userId);
      }).toThrow('空投活动未激活');
    });

    test('应该拒绝领取尚未开始的空投', async () => {
      const userId = 'test-user-004';

      // 创建一个未来开始的空投
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60 * 60); // 1小时后
      const endTime = new Date(now.getTime() + 1000 * 60 * 60 * 2); // 2小时后

      const airdrop = await airdropService.createAirdrop({
        name: '未来空投',
        description: '未来开始的空投',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      await airdropService.startAirdrop(airdrop.airdropId);
      await accountService.createAccount(userId);

      expect(async () => {
        await airdropService.claimAirdrop(airdrop.airdropId, userId);
      }).toThrow('空投活动尚未开始');
    });

    test('应该拒绝领取已结束的空投', async () => {
      const userId = 'test-user-005';

      // 创建一个已过期的空投
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000 * 60 * 60 * 2); // 2小时前
      const endTime = new Date(now.getTime() - 1000 * 60 * 60); // 1小时前

      const airdrop = await airdropService.createAirdrop({
        name: '已过期空投',
        description: '已过期的空投',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      await airdropService.startAirdrop(airdrop.airdropId);
      await accountService.createAccount(userId);

      expect(async () => {
        await airdropService.claimAirdrop(airdrop.airdropId, userId);
      }).toThrow('空投活动已结束');
    });

    test('应该拒绝领取不存在的空投', async () => {
      const userId = 'test-user-006';
      await accountService.createAccount(userId);

      expect(async () => {
        await airdropService.claimAirdrop('non-existent', userId);
      }).toThrow('空投活动不存在');
    });

    test('多个用户应该可以领取同一个空投', async () => {
      const airdrop = await createActiveAirdrop();

      for (let i = 0; i < 10; i++) {
        const userId = `test-user-${i + 10}`;
        await accountService.createAccount(userId);

        const result = await airdropService.claimAirdrop(airdrop.airdropId, userId);
        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(100);
      }

      const detail = airdropService.getAirdropDetail(airdrop.airdropId);
      expect(detail.claimCount).toBe(10);
      expect(detail.totalClaimed).toBe(1000);
    });
  });

  describe('endAirdrop', () => {
    test('应该成功结束空投活动', async () => {
      const airdrop = await createActiveAirdrop();

      const result = await airdropService.endAirdrop(airdrop.airdropId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(AirdropStatus.COMPLETED);
      expect(result.totalClaimed).toBeGreaterThanOrEqual(0);
    });

    test('应该正确统计已领取数量', async () => {
      const airdrop = await createActiveAirdrop();

      // 多个用户领取
      for (let i = 0; i < 5; i++) {
        const userId = `test-user-${i + 20}`;
        await accountService.createAccount(userId);
        await airdropService.claimAirdrop(airdrop.airdropId, userId);
      }

      const result = await airdropService.endAirdrop(airdrop.airdropId);
      expect(result.totalClaimed).toBe(500);
    });

    test('应该拒绝结束不存在的空投', async () => {
      expect(async () => {
        await airdropService.endAirdrop('non-existent');
      }).toThrow('空投活动不存在');
    });
  });

  describe('cancelAirdrop', () => {
    test('应该成功取消空投活动', async () => {
      const airdrop = await createTestAirdrop();

      const result = await airdropService.cancelAirdrop(airdrop.airdropId, '测试取消');

      expect(result.success).toBe(true);
      expect(result.status).toBe(AirdropStatus.CANCELLED);
    });

    test('应该拒绝取消已完成的空投', async () => {
      const airdrop = await createActiveAirdrop();
      await airdropService.endAirdrop(airdrop.airdropId);

      expect(async () => {
        await airdropService.cancelAirdrop(airdrop.airdropId, '尝试取消');
      }).toThrow('已完成的空投活动无法取消');
    });

    test('应该拒绝取消不存在的空投', async () => {
      expect(async () => {
        await airdropService.cancelAirdrop('non-existent', '测试');
      }).toThrow('空投活动不存在');
    });
  });

  describe('getAirdropDetail', () => {
    test('应该返回完整的空投详情', async () => {
      const airdrop = await createActiveAirdrop();
      const userId = 'test-user-030';
      await accountService.createAccount(userId);
      await airdropService.claimAirdrop(airdrop.airdropId, userId);

      const detail = airdropService.getAirdropDetail(airdrop.airdropId);

      expect(detail).toBeDefined();
      expect(detail.airdrop).toBeDefined();
      expect(detail.claimCount).toBe(1);
      expect(detail.totalClaimed).toBe(100);
      expect(detail.canClaim).toBe(true);
    });

    test('应该正确判断是否可领取', async () => {
      // 待处理状态
      const pendingAirdrop = await createTestAirdrop();
      let detail = airdropService.getAirdropDetail(pendingAirdrop.airdropId);
      expect(detail.canClaim).toBe(false);

      // 活跃状态
      const activeAirdrop = await createActiveAirdrop();
      detail = airdropService.getAirdropDetail(activeAirdrop.airdropId);
      expect(detail.canClaim).toBe(true);

      // 已完成状态
      await airdropService.endAirdrop(activeAirdrop.airdropId);
      detail = airdropService.getAirdropDetail(activeAirdrop.airdropId);
      expect(detail.canClaim).toBe(false);
    });

    test('应该拒绝查询不存在的空投', () => {
      expect(() => {
        airdropService.getAirdropDetail('non-existent');
      }).toThrow('空投活动不存在');
    });
  });

  describe('getClaimableAirdrops', () => {
    test('应该返回可领取的空投列表', async () => {
      const userId = 'test-user-040';
      await accountService.createAccount(userId);

      // 创建多个空投
      await createActiveAirdrop('空投1');
      await createActiveAirdrop('空投2');
      await createActiveAirdrop('空投3');

      const claimables = airdropService.getClaimableAirdrops(userId);

      expect(claimables.length).toBe(3);
      expect(claimables[0]).toHaveProperty('id');
      expect(claimables[0]).toHaveProperty('name');
      expect(claimables[0]).toHaveProperty('perUserAmount');
      expect(claimables[0]).toHaveProperty('remainingTime');
    });

    test('应该排除已领取的空投', async () => {
      const userId = 'test-user-041';
      await accountService.createAccount(userId);

      const airdrop1 = await createActiveAirdrop('空投1');
      await createActiveAirdrop('空投2');

      // 领取第一个空投
      await airdropService.claimAirdrop(airdrop1.airdropId, userId);

      const claimables = airdropService.getClaimableAirdrops(userId);
      expect(claimables.length).toBe(1);
      expect(claimables[0].name).toBe('空投2');
    });

    test('应该只返回活跃且在有效期内的空投', async () => {
      const userId = 'test-user-042';
      await accountService.createAccount(userId);

      // 创建待处理空投
      await createTestAirdrop('待处理空投');

      // 创建活跃空投
      await createActiveAirdrop('活跃空投');

      // 创建已过期空投
      const now = new Date();
      const expiredAirdrop = await airdropService.createAirdrop({
        name: '已过期空投',
        description: '已过期',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime: new Date(now.getTime() - 1000 * 60 * 60 * 2),
        endTime: new Date(now.getTime() - 1000 * 60 * 60),
      });
      await airdropService.startAirdrop(expiredAirdrop.airdropId);

      const claimables = airdropService.getClaimableAirdrops(userId);
      expect(claimables.length).toBe(1);
      expect(claimables[0].name).toBe('活跃空投');
    });
  });

  describe('getUserClaimHistory', () => {
    test('应该返回用户已领取的空投记录', async () => {
      const userId = 'test-user-050';
      await accountService.createAccount(userId);

      const airdrop1 = await createActiveAirdrop('空投1');
      const airdrop2 = await createActiveAirdrop('空投2');

      await airdropService.claimAirdrop(airdrop1.airdropId, userId);
      await airdropService.claimAirdrop(airdrop2.airdropId, userId);

      const history = airdropService.getUserClaimHistory(userId);

      expect(history.length).toBe(2);
      expect(history[0]).toHaveProperty('claimId');
      expect(history[0]).toHaveProperty('airdropName');
      expect(history[0]).toHaveProperty('amount');
      expect(history[0]).toHaveProperty('claimedAt');
    });

    test('对未领取的用户应返回空数组', async () => {
      const userId = 'test-user-051';
      await accountService.createAccount(userId);

      const history = airdropService.getUserClaimHistory(userId);
      expect(history).toEqual([]);
    });
  });

  describe('getAirdropStats', () => {
    test('应该返回所有空投的统计信息', async () => {
      await createActiveAirdrop('空投1');
      await createActiveAirdrop('空投2');

      const airdrop3 = await createTestAirdrop('空投3');
      await airdropService.startAirdrop(airdrop3.airdropId);
      await airdropService.endAirdrop(airdrop3.airdropId);

      const stats = airdropService.getAirdropStats();

      expect(stats.totalAirdrops).toBe(3);
      expect(stats.activeAirdrops).toBe(2);
      expect(stats.completedAirdrops).toBe(1);
    });

    test('应该返回单个空投的统计信息', async () => {
      const airdrop = await createActiveAirdrop();

      const stats = airdropService.getAirdropStats(airdrop.airdropId);

      expect(stats.totalAirdrops).toBe(1);
      expect(stats.activeAirdrops).toBe(1);
    });

    test('应该正确计算已分发总额', async () => {
      const airdrop = await createActiveAirdrop();

      for (let i = 0; i < 5; i++) {
        const userId = `test-user-${i + 60}`;
        await accountService.createAccount(userId);
        await airdropService.claimAirdrop(airdrop.airdropId, userId);
      }

      const stats = airdropService.getAirdropStats(airdrop.airdropId);
      expect(stats.totalDistributed).toBe(500);
    });
  });

  describe('边界条件测试', () => {
    test('应该处理大量用户领取', async () => {
      const airdrop = await createActiveAirdrop();

      // 模拟 100 个用户领取
      for (let i = 0; i < 100; i++) {
        const userId = `test-user-${i + 100}`;
        await accountService.createAccount(userId);
        await airdropService.claimAirdrop(airdrop.airdropId, userId);
      }

      const detail = airdropService.getAirdropDetail(airdrop.airdropId);
      expect(detail.claimCount).toBe(100);
      expect(detail.totalClaimed).toBe(10000);
    });

    test('应该处理并发领取', async () => {
      const airdrop = await createActiveAirdrop();

      // 创建 50 个账户
      const userIds = [];
      for (let i = 0; i < 50; i++) {
        const userId = `test-user-${i + 200}`;
        await accountService.createAccount(userId);
        userIds.push(userId);
      }

      // 并发领取
      const promises = userIds.map((userId) =>
        airdropService.claimAirdrop(airdrop.airdropId, userId)
      );

      await Promise.all(promises);

      const detail = airdropService.getAirdropDetail(airdrop.airdropId);
      expect(detail.claimCount).toBe(50);
    });

    test('应该处理极端时间设置', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 100);
      const endTime = new Date(now.getTime() + 200);

      const airdrop = await airdropService.createAirdrop({
        name: '极短空投',
        description: '持续时间极短的空投',
        totalAmount: 1000,
        perUserAmount: 100,
        startTime,
        endTime,
      });

      expect(airdrop).toBeDefined();
    });
  });

  // 辅助函数
  async function createTestAirdrop(name: string = '测试空投'): Promise<any> {
    const now = new Date();
    const startTime = new Date(now.getTime() + 1000 * 60);
    const endTime = new Date(now.getTime() + 1000 * 60 * 60);

    return await airdropService.createAirdrop({
      name,
      description: '这是一个测试空投',
      totalAmount: 10000,
      perUserAmount: 100,
      startTime,
      endTime,
    });
  }

  async function createActiveAirdrop(name: string = '活跃空投'): Promise<any> {
    const now = new Date();
    const startTime = new Date(now.getTime() - 1000 * 60); // 1分钟前开始
    const endTime = new Date(now.getTime() + 1000 * 60 * 60); // 1小时后结束

    const airdrop = await airdropService.createAirdrop({
      name,
      description: '这是一个活跃的空投',
      totalAmount: 10000,
      perUserAmount: 100,
      startTime,
      endTime,
    });

    await airdropService.startAirdrop(airdrop.airdropId);

    return airdrop;
  }
});
