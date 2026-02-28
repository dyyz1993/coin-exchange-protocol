/**
 * 冻结服务测试 - 测试冻结创建、自动解冻、冻结查询等功能
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { FreezeService } from '../src/services/freeze.service';
import { AccountService } from '../src/services/account.service';

describe('冻结服务测试', () => {
  let freezeService: FreezeService;
  let accountService: AccountService;

  beforeEach(() => {
    freezeService = new FreezeService();
    accountService = new AccountService();
    freezeService.initialize();
  });

  afterEach(() => {
    freezeService.stopAutoUnfreeze();
  });

  describe('初始冻结', () => {
    test('应该成功创建初始冻结', async () => {
      await accountService.createAccount('user1');
      await accountService.addTokens('user1', 100, 'REWARD' as any, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId: 'user1',
        amount: 50,
        transactionId: 'tx_123',
        remark: '测试冻结'
      });

      expect(freeze).toBeDefined();
      expect(freeze.userId).toBe('user1');
      expect(freeze.amount).toBe(50);
      expect(freeze.type).toBe('INITIAL');
      expect(freeze.status).toBe('FROZEN');
    });

    test('余额不足时创建冻结应该失败', async () => {
      await accountService.createAccount('user2');
      await accountService.addTokens('user2', 30, 'REWARD' as any, '少量奖励');

      expect(() => {
        freezeService.createInitialFreeze({
          userId: 'user2',
          amount: 50,
          transactionId: 'tx_124',
          remark: '超额冻结'
        });
      }).toThrow('余额不足');
    });

    test('不存在的用户创建冻结应该失败', async () => {
      expect(() => {
        freezeService.createInitialFreeze({
          userId: 'nonexistent',
          amount: 50,
          transactionId: 'tx_125',
          remark: '测试'
        });
      }).toThrow('用户账户不存在');
    });
  });

  describe('争议冻结', () => {
    test('应该成功创建争议冻结', async () => {
      await accountService.createAccount('user3');
      await accountService.addTokens('user3', 100, 'REWARD' as any, '初始奖励');

      const freeze = freezeService.createDisputeFreeze({
        userId: 'user3',
        amount: 30,
        transactionId: 'tx_126',
        remark: '争议冻结'
      });

      expect(freeze).toBeDefined();
      expect(freeze.type).toBe('DISPUTE');
      expect(freeze.status).toBe('FROZEN');
    });
  });

  describe('解冻功能', () => {
    test('应该成功手动解冻', async () => {
      await accountService.createAccount('user4');
      await accountService.addTokens('user4', 100, 'REWARD' as any, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId: 'user4',
        amount: 50,
        transactionId: 'tx_127',
        remark: '测试冻结'
      });

      const unfrozen = freezeService.manualUnfreeze(freeze.id, '手动解冻');

      expect(unfrozen.status).toBe('UNFROZEN');
      expect(unfrozen.unfrozenAt).toBeDefined();
    });

    test('重复解冻应该失败', async () => {
      await accountService.createAccount('user5');
      await accountService.addTokens('user5', 100, 'REWARD' as any, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId: 'user5',
        amount: 50,
        transactionId: 'tx_128',
        remark: '测试冻结'
      });

      freezeService.manualUnfreeze(freeze.id, '第一次解冻');

      expect(() => {
        freezeService.manualUnfreeze(freeze.id, '重复解冻');
      }).toThrow('冻结已失效或已解冻');
    });

    test('解冻不存在的冻结记录应该失败', async () => {
      expect(() => {
        freezeService.manualUnfreeze('nonexistent', '测试');
      }).toThrow('冻结记录不存在');
    });
  });

  describe('冻结查询', () => {
    test('应该能查询冻结状态', async () => {
      await accountService.createAccount('user6');
      await accountService.addTokens('user6', 100, 'REWARD' as any, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId: 'user6',
        amount: 50,
        transactionId: 'tx_129',
        remark: '测试冻结'
      });

      const status = freezeService.getFreezeStatus(freeze.id);

      expect(status).toBeDefined();
      expect(status.freezeId).toBe(freeze.id);
      expect(status.amount).toBe(50);
      expect(status.remainingTime).toBeGreaterThan(0);
    });

    test('应该能查询用户冻结列表', async () => {
      await accountService.createAccount('user7');
      await accountService.addTokens('user7', 200, 'REWARD' as any, '初始奖励');

      freezeService.createInitialFreeze({
        userId: 'user7',
        amount: 50,
        transactionId: 'tx_130',
        remark: '冻结1'
      });

      freezeService.createDisputeFreeze({
        userId: 'user7',
        amount: 30,
        transactionId: 'tx_131',
        remark: '冻结2'
      });

      const freezes = freezeService.getUserFreezes('user7');
      expect(freezes.length).toBe(2);
    });

    test('应该能按状态筛选冻结记录', async () => {
      await accountService.createAccount('user8');
      await accountService.addTokens('user8', 200, 'REWARD' as any, '初始奖励');

      const freeze1 = freezeService.createInitialFreeze({
        userId: 'user8',
        amount: 50,
        transactionId: 'tx_132',
        remark: '冻结1'
      });

      freezeService.createDisputeFreeze({
        userId: 'user8',
        amount: 30,
        transactionId: 'tx_133',
        remark: '冻结2'
      });

      // 解冻其中一个
      freezeService.manualUnfreeze(freeze1.id, '测试');

      const frozenList = freezeService.getUserFreezes('user8', 'FROZEN' as any);
      expect(frozenList.length).toBe(1);
    });

    test('应该能查询活跃冻结', async () => {
      await accountService.createAccount('user9');
      await accountService.addTokens('user9', 200, 'REWARD' as any, '初始奖励');

      freezeService.createInitialFreeze({
        userId: 'user9',
        amount: 50,
        transactionId: 'tx_134',
        remark: '冻结1'
      });

      const activeFreezes = freezeService.getActiveFreezes('user9');
      expect(activeFreezes.length).toBe(1);
    });

    test('应该能根据交易ID查询冻结', async () => {
      await accountService.createAccount('user10');
      await accountService.addTokens('user10', 100, 'REWARD' as any, '初始奖励');

      freezeService.createInitialFreeze({
        userId: 'user10',
        amount: 50,
        transactionId: 'tx_135',
        remark: '测试冻结'
      });

      const freeze = freezeService.getFreezeByTransactionId('tx_135');
      expect(freeze).toBeDefined();
      expect(freeze?.transactionId).toBe('tx_135');
    });
  });

  describe('余额检查', () => {
    test('应该能获取可用余额', async () => {
      await accountService.createAccount('user11');
      await accountService.addTokens('user11', 100, 'REWARD' as any, '初始奖励');

      freezeService.createInitialFreeze({
        userId: 'user11',
        amount: 30,
        transactionId: 'tx_136',
        remark: '冻结'
      });

      const available = freezeService.getAvailableBalance('user11');
      expect(available).toBe(70);
    });

    test('应该能检查是否可以冻结', async () => {
      await accountService.createAccount('user12');
      await accountService.addTokens('user12', 100, 'REWARD' as any, '初始奖励');

      expect(freezeService.canFreeze('user12', 80)).toBe(true);
      expect(freezeService.canFreeze('user12', 120)).toBe(false);
    });
  });

  describe('批量解冻', () => {
    test('应该能批量解冻多个冻结记录', async () => {
      await accountService.createAccount('user13');
      await accountService.addTokens('user13', 300, 'REWARD' as any, '初始奖励');

      const freeze1 = freezeService.createInitialFreeze({
        userId: 'user13',
        amount: 50,
        transactionId: 'tx_137',
        remark: '冻结1'
      });

      const freeze2 = freezeService.createInitialFreeze({
        userId: 'user13',
        amount: 50,
        transactionId: 'tx_138',
        remark: '冻结2'
      });

      const results = freezeService.unfreezeMultiple([freeze1.id, freeze2.id], '批量解冻');

      expect(results.length).toBe(2);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('冻结统计', () => {
    test('应该能获取冻结统计信息', async () => {
      await accountService.createAccount('user14');
      await accountService.addTokens('user14', 100, 'REWARD' as any, '初始奖励');

      freezeService.createInitialFreeze({
        userId: 'user14',
        amount: 50,
        transactionId: 'tx_139',
        remark: '冻结'
      });

      const stats = freezeService.getFreezeStats();

      expect(stats).toBeDefined();
      expect(stats.totalFrozen).toBeGreaterThanOrEqual(50);
    });
  });
});
