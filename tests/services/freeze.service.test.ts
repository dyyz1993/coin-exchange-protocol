/**
 * 冻结服务测试
 * 测试范围：冻结创建、自动解冻、冻结查询
 */

// Jest 全局变量，无需导入
import { FreezeService } from '../../src/services/freeze.service';
import { AccountService } from '../../src/services/account.service';
import { freezeModel } from '../../src/models/Freeze';
import { AccountModel } from '../../src/models/Account';
import { TokenAccountModel } from '../../src/models/TokenAccount';
import { FreezeType, FreezeStatus, FREEZE_CONFIG } from '../../src/types';
import { TransactionType } from '../../src/types/token';

describe('FreezeService', () => {
  let freezeService: FreezeService;
  let accountService: AccountService;

  beforeEach(() => {
    freezeService = new FreezeService();
    accountService = new AccountService();
    // 清空测试数据
    (freezeModel as any).freezes.clear();
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
  });

  afterEach(() => {
    // 停止自动解冻定时器
    freezeService.stopAutoUnfreeze();
    // 清理测试数据
    (freezeModel as any).freezes.clear();
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
  });

  describe('createInitialFreeze', () => {
    test('应该成功创建初始冻结', async () => {
      const userId = 'test-user-001';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze = await freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-001',
        remark: '交易冻结',
      });

      expect(freeze).toBeDefined();
      expect(freeze.id).toBeDefined();
      expect(freeze.userId).toBe(userId);
      expect(freeze.amount).toBe(500);
      expect(freeze.type).toBe(FreezeType.INITIAL);
      expect(freeze.status).toBe(FreezeStatus.FROZEN);
      expect(freeze.transactionId).toBe('tx-001');
    });

    test('应该拒绝冻结不存在的用户', () => {
      expect(() => {
        freezeService.createInitialFreeze({
          userId: 'non-existent',
          amount: 100,
          transactionId: 'tx-002',
        });
      }).toThrow('用户账户不存在');
    });

    test('应该拒绝冻结超过可用余额的金额', async () => {
      const userId = 'test-user-002';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 100, TransactionType.REWARD, '初始奖励');

      expect(() => {
        freezeService.createInitialFreeze({
          userId,
          amount: 200,
          transactionId: 'tx-003',
        });
      }).toThrow('余额不足');
    });

    test('应该考虑已有的冻结金额', async () => {
      const userId = 'test-user-003';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      // 第一次冻结
      freezeService.createInitialFreeze({
        userId,
        amount: 600,
        transactionId: 'tx-004',
      });

      // 第二次冻结应该考虑第一次冻结
      expect(() => {
        freezeService.createInitialFreeze({
          userId,
          amount: 500,
          transactionId: 'tx-005',
        });
      }).toThrow('余额不足');
    });

    test('应该正确设置冻结过期时间', async () => {
      const userId = 'test-user-004';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const before = new Date();
      const freeze = await freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-006',
      });
      const after = new Date();

      const expectedExpiry = new Date(before.getTime() + FREEZE_CONFIG.INITIAL_DURATION);

      expect(freeze.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry.getTime() - 1000);
      expect(freeze.expiresAt.getTime()).toBeLessThanOrEqual(
        after.getTime() + FREEZE_CONFIG.INITIAL_DURATION + 1000
      );
    });
  });

  describe('createDisputeFreeze', () => {
    test('应该成功创建争议冻结', async () => {
      const userId = 'test-user-005';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze = freezeService.createDisputeFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-007',
        remark: '争议冻结',
      });

      expect(freeze).toBeDefined();
      expect(freeze.type).toBe(FreezeType.DISPUTE);
      expect(freeze.status).toBe(FreezeStatus.FROZEN);
    });

    test('争议冻结时间应该比初始冻结长', async () => {
      const userId = 'test-user-006';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 2000, TransactionType.REWARD, '初始奖励');

      const initialFreeze = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-008',
      });

      const disputeFreeze = freezeService.createDisputeFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-009',
      });

      expect(disputeFreeze.expiresAt.getTime()).toBeGreaterThan(initialFreeze.expiresAt.getTime());
    });
  });

  describe('unfreeze', () => {
    test('应该成功解冻', async () => {
      const userId = 'test-user-007';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-010',
      });

      const result = freezeService.unfreeze(freeze.id, '手动解冻');

      expect(result.status).toBe(FreezeStatus.UNFROZEN);
      expect(result.unfrozenAt).toBeDefined();
      expect(result.unfreezeReason).toBe('手动解冻');
    });

    test('应该拒绝解冻不存在的冻结记录', () => {
      expect(() => {
        freezeService.unfreeze('non-existent', '测试');
      }).toThrow('冻结记录不存在');
    });

    test('应该拒绝重复解冻', async () => {
      const userId = 'test-user-008';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-011',
      });

      await freezeService.unfreeze(freeze.id, '第一次解冻');

      expect(() => {
        freezeService.unfreeze(freeze.id, '第二次解冻');
      }).toThrow('冻结已失效或已解冻');
    });

    test('解冻后应该恢复可用余额', async () => {
      const userId = 'test-user-009';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-012',
      });

      let available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(500);

      await freezeService.unfreeze(freeze.id, '解冻');

      available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(1000);
    });
  });

  describe('manualUnfreeze', () => {
    test('应该成功手动解冻', async () => {
      const userId = 'test-user-010';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-013',
      });

      const result = freezeService.manualUnfreeze(freeze.id, '客服手动解冻');

      expect(result.status).toBe(FreezeStatus.UNFROZEN);
      expect(result.unfreezeReason).toBe('客服手动解冻');
    });
  });

  describe('autoUnfreezeExpired', () => {
    test('应该自动解冻过期的冻结记录', async () => {
      const userId = 'test-user-011';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      // 创建一个已经过期的冻结（模拟）
      const freeze = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-014',
      });

      // 手动设置过期时间为过去
      (freezeModel as any).freezes.get(freeze.id).expiresAt = new Date(Date.now() - 1000);

      const results = freezeService.autoUnfreezeExpired();

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].success).toBe(true);
      expect(results[0].freeze.status).toBe(FreezeStatus.UNFROZEN);
    });

    test('应该跳过未过期的冻结记录', async () => {
      const userId = 'test-user-012';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-015',
      });

      const results = freezeService.autoUnfreezeExpired();

      expect(results.length).toBe(0);
    });

    test('应该处理多个过期冻结记录', async () => {
      const userId = 'test-user-013';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 2000, TransactionType.REWARD, '初始奖励');

      const freeze1 = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-016',
      });

      const freeze2 = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-017',
      });

      // 手动设置过期
      (freezeModel as any).freezes.get(freeze1.id).expiresAt = new Date(Date.now() - 1000);
      (freezeModel as any).freezes.get(freeze2.id).expiresAt = new Date(Date.now() - 1000);

      const results = freezeService.autoUnfreezeExpired();

      expect(results.length).toBe(2);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('getFreezeStatus', () => {
    test('应该返回冻结状态详情', async () => {
      const userId = 'test-user-014';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-018',
      });

      const status = freezeService.getFreezeStatus(freeze.id);

      expect(status).toBeDefined();
      expect(status.freezeId).toBe(freeze.id);
      expect(status.userId).toBe(userId);
      expect(status.amount).toBe(500);
      expect(status.type).toBe(FreezeType.INITIAL);
      expect(status.status).toBe(FreezeStatus.FROZEN);
      expect(status.remainingTime).toBeGreaterThan(0);
    });

    test('解冻后剩余时间应该为0', async () => {
      const userId = 'test-user-015';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-019',
      });

      await freezeService.unfreeze(freeze.id, '解冻');

      const status = freezeService.getFreezeStatus(freeze.id);
      expect(status.remainingTime).toBe(0);
    });

    test('应该拒绝查询不存在的冻结记录', () => {
      expect(() => {
        freezeService.getFreezeStatus('non-existent');
      }).toThrow('冻结记录不存在');
    });
  });

  describe('getUserFreezes', () => {
    test('应该返回用户的所有冻结记录', async () => {
      const userId = 'test-user-016';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 2000, TransactionType.REWARD, '初始奖励');

      await freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-020',
      });

      await freezeService.createDisputeFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-021',
      });

      const freezes = freezeService.getUserFreezes(userId);

      expect(freezes.length).toBe(2);
    });

    test('应该支持按状态过滤', async () => {
      const userId = 'test-user-017';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 2000, TransactionType.REWARD, '初始奖励');

      const freeze1 = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-022',
      });

      await freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-023',
      });

      await freezeService.unfreeze(freeze1.id, '解冻');

      const frozenFreezes = freezeService.getUserFreezes(userId, FreezeStatus.FROZEN);
      const unfrozenFreezes = freezeService.getUserFreezes(userId, FreezeStatus.UNFROZEN);

      expect(frozenFreezes.length).toBe(1);
      expect(unfrozenFreezes.length).toBe(1);
    });
  });

  describe('getActiveFreezes', () => {
    test('应该只返回活跃的冻结记录', async () => {
      const userId = 'test-user-018';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 2000, TransactionType.REWARD, '初始奖励');

      const freeze1 = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-024',
      });

      await freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-025',
      });

      await freezeService.unfreeze(freeze1.id, '解冻');

      const activeFreezes = freezeService.getActiveFreezes(userId);

      expect(activeFreezes.length).toBe(1);
      expect(activeFreezes[0].status).toBe(FreezeStatus.FROZEN);
    });
  });

  describe('getFreezeByTransactionId', () => {
    test('应该根据交易ID查找冻结记录', async () => {
      const userId = 'test-user-019';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-026',
      });

      const found = freezeService.getFreezeByTransactionId('tx-026');

      expect(found).toBeDefined();
      expect(found?.id).toBe(freeze.id);
    });

    test('找不到时应返回 undefined', () => {
      const found = freezeService.getFreezeByTransactionId('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('getAvailableBalance', () => {
    test('应该正确计算可用余额', async () => {
      const userId = 'test-user-020';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      let available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(1000);

      await freezeService.createInitialFreeze({
        userId,
        amount: 300,
        transactionId: 'tx-027',
      });

      available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(700);
    });

    test('对不存在的用户应返回0', () => {
      const available = freezeService.getAvailableBalance('non-existent');
      expect(available).toBe(0);
    });
  });

  describe('canFreeze', () => {
    test('应该正确判断是否可以冻结', async () => {
      const userId = 'test-user-021';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      expect(freezeService.canFreeze(userId, 500)).toBe(true);
      expect(freezeService.canFreeze(userId, 1000)).toBe(true);
      expect(freezeService.canFreeze(userId, 1500)).toBe(false);
    });

    test('应该考虑已有的冻结金额', async () => {
      const userId = 'test-user-022';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      await freezeService.createInitialFreeze({
        userId,
        amount: 600,
        transactionId: 'tx-028',
      });

      expect(freezeService.canFreeze(userId, 400)).toBe(true);
      expect(freezeService.canFreeze(userId, 500)).toBe(false);
    });
  });

  describe('getFreezeStats', () => {
    test('应该返回冻结统计信息', async () => {
      const userId = 'test-user-023';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 2000, TransactionType.REWARD, '初始奖励');

      await freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-029',
      });

      await freezeService.createDisputeFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-030',
      });

      const stats = freezeService.getFreezeStats();

      expect(stats).toBeDefined();
      expect(stats.totalFreezes).toBeGreaterThanOrEqual(2);
      expect(stats.activeFreezes).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getAllActiveFreezes', () => {
    test('应该返回所有活跃的冻结记录', async () => {
      const userId1 = 'test-user-024';
      const userId2 = 'test-user-025';

      await accountService.createAccount(userId1);
      await accountService.createAccount(userId2);
      await accountService.addTokens(userId1, 1000, TransactionType.REWARD, '初始奖励');
      await accountService.addTokens(userId2, 1000, TransactionType.REWARD, '初始奖励');

      await freezeService.createInitialFreeze({
        userId: userId1,
        amount: 500,
        transactionId: 'tx-031',
      });

      await freezeService.createInitialFreeze({
        userId: userId2,
        amount: 500,
        transactionId: 'tx-032',
      });

      const allActive = freezeService.getAllActiveFreezes();

      expect(allActive.length).toBeGreaterThanOrEqual(2);
      expect(allActive.every((f) => f.status === FreezeStatus.FROZEN)).toBe(true);
    });
  });

  describe('unfreezeMultiple', () => {
    test('应该批量解冻多个冻结记录', async () => {
      const userId = 'test-user-026';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 3000, TransactionType.REWARD, '初始奖励');

      const freeze1 = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-033',
      });

      const freeze2 = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-034',
      });

      const freeze3 = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-035',
      });

      const results = freezeService.unfreezeMultiple(
        [freeze1.id, freeze2.id, freeze3.id],
        '批量解冻'
      );

      expect(results.length).toBe(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    test('应该处理部分失败的情况', async () => {
      const userId = 'test-user-027';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const freeze1 = freezeService.createInitialFreeze({
        userId,
        amount: 500,
        transactionId: 'tx-036',
      });

      const results = freezeService.unfreezeMultiple([freeze1.id, 'non-existent'], '批量解冻');

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('边界条件测试', () => {
    test('应该处理大量冻结记录', async () => {
      const userId = 'test-user-028';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 100000, TransactionType.REWARD, '初始奖励');

      // 创建 100 个冻结记录
      for (let i = 0; i < 100; i++) {
        freezeService.createInitialFreeze({
          userId,
          amount: 100,
          transactionId: `tx-${i + 100}`,
        });
      }

      const freezes = freezeService.getUserFreezes(userId);
      expect(freezes.length).toBe(100);

      const available = freezeService.getAvailableBalance(userId);
      expect(available).toBe(0);
    });

    test('应该处理极大冻结金额', async () => {
      const userId = 'test-user-029';
      await accountService.createAccount(userId);

      const largeAmount = Number.MAX_SAFE_INTEGER / 2;
      await accountService.addTokens(userId, largeAmount, TransactionType.REWARD, '大额奖励');

      const freeze = freezeService.createInitialFreeze({
        userId,
        amount: largeAmount / 2,
        transactionId: 'tx-large',
      });

      expect(freeze.amount).toBe(largeAmount / 2);
    });

    test('应该处理并发冻结操作', async () => {
      const userId = 'test-user-030';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 10000, TransactionType.REWARD, '初始奖励');

      // 并发创建 50 个冻结
      const promises = Array(50)
        .fill(null)
        .map((_, i) => {
          return new Promise((resolve) => {
            try {
              const freeze = freezeService.createInitialFreeze({
                userId,
                amount: 100,
                transactionId: `tx-concurrent-${i}`,
              });
              resolve({ success: true, freeze });
            } catch (error) {
              resolve({ success: false, error });
            }
          });
        });

      const results = (await Promise.all(promises)) as any[];
      const successCount = results.filter((r) => r.success).length;

      expect(successCount).toBe(50);
    });

    test('应该处理快速创建和解冻', async () => {
      const userId = 'test-user-031';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 10000, TransactionType.REWARD, '初始奖励');

      for (let i = 0; i < 10; i++) {
        const freeze = freezeService.createInitialFreeze({
          userId,
          amount: 100,
          transactionId: `tx-fast-${i}`,
        });
        await freezeService.unfreeze(freeze.id, '快速解冻');
      }

      const freezes = freezeService.getUserFreezes(userId);
      expect(freezes.length).toBe(10);
      expect(freezes.every((f) => f.status === FreezeStatus.UNFROZEN)).toBe(true);
    });
  });

  describe('定时任务测试', () => {
    test('应该能够启动和停止自动解冻定时任务', () => {
      freezeService.initialize();

      // 验证定时器已启动
      expect((freezeService as any).autoUnfreezeTimer).toBeDefined();

      freezeService.stopAutoUnfreeze();

      // 验证定时器已停止
      expect((freezeService as any).autoUnfreezeTimer).toBeUndefined();
    });
  });
});
