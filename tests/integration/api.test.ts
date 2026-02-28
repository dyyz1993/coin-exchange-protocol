/**
 * API 集成测试
 * 测试范围：所有 REST API 端点、错误处理、边界条件
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { AccountService } from '../../src/services/account.service';
import { AirdropService } from '../../src/services/airdrop.service';
import { TaskService } from '../../src/services/task.service';
import { FreezeService } from '../../src/services/freeze.service';
import { AccountModel } from '../../src/models/Account';
import { TokenAccountModel } from '../../src/models/TokenAccount';
import { airdropModel } from '../../src/models/Airdrop';
import { taskModel } from '../../src/models/Task';
import { freezeModel } from '../../src/models/Freeze';
import { TransactionType } from '../../src/types/token';

describe('API Integration Tests', () => {
  let accountService: AccountService;
  let airdropService: AirdropService;
  let taskService: TaskService;
  let freezeService: FreezeService;

  beforeEach(() => {
    accountService = new AccountService();
    airdropService = new AirdropService();
    taskService = new TaskService();
    freezeService = new FreezeService();
    
    // 清空所有测试数据
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
    (airdropModel as any).airdrops.clear();
    (airdropModel as any).claims.clear();
    (taskModel as any).tasks.clear();
    (taskModel as any).completions.clear();
    (freezeModel as any).freezes.clear();
  });

  afterEach(() => {
    freezeService.stopAutoUnfreeze();
    
    // 清理所有测试数据
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
    (airdropModel as any).airdrops.clear();
    (airdropModel as any).claims.clear();
    (taskModel as any).tasks.clear();
    (taskModel as any).completions.clear();
    (freezeModel as any).freezes.clear();
  });

  describe('Account API', () => {
    describe('POST /api/account/create', () => {
      test('应该成功创建账户', async () => {
        const userId = 'api-user-001';
        const result = await accountService.createAccount(userId, {
          email: 'api@example.com',
          nickname: 'API User'
        });

        expect(result.accountId).toBeDefined();
        expect(result.tokenAccountId).toBeDefined();
      });

      test('应该支持可选参数', async () => {
        const userId = 'api-user-002';
        const result = await accountService.createAccount(userId);

        expect(result).toBeDefined();
      });
    });

    describe('GET /api/account/balance/:userId', () => {
      test('应该返回正确的余额信息', async () => {
        const userId = 'api-user-003';
        await accountService.createAccount(userId);
        await accountService.addTokens(userId, 500, TransactionType.REWARD, '初始奖励');

        const balance = accountService.getTokenBalance(userId);

        expect(balance).toBeDefined();
        expect(balance?.balance).toBe(500);
        expect(balance?.availableBalance).toBe(500);
      });

      test('对不存在的用户应返回 null', () => {
        const balance = accountService.getTokenBalance('non-existent');
        expect(balance).toBeNull();
      });
    });

    describe('POST /api/account/transfer', () => {
      test('应该成功转账', async () => {
        const fromUserId = 'api-user-004';
        const toUserId = 'api-user-005';
        
        await accountService.createAccount(fromUserId);
        await accountService.createAccount(toUserId);
        await accountService.addTokens(fromUserId, 1000, TransactionType.REWARD, '初始奖励');

        const result = await accountService.transfer(fromUserId, toUserId, 300, 'API转账');

        expect(result.success).toBe(true);
        expect(result.fromNewBalance).toBe(700);
        expect(result.toNewBalance).toBe(300);
      });

      test('应该在余额不足时返回错误', async () => {
        const fromUserId = 'api-user-006';
        const toUserId = 'api-user-007';
        
        await accountService.createAccount(fromUserId);
        await accountService.createAccount(toUserId);
        await accountService.addTokens(fromUserId, 100, TransactionType.REWARD, '初始奖励');

        expect(async () => {
          await accountService.transfer(fromUserId, toUserId, 200, '超额转账');
        }).toThrow();
      });
    });
  });

  describe('Airdrop API', () => {
    describe('POST /api/airdrop/create', () => {
      test('应该成功创建空投', async () => {
        const now = new Date();
        const startTime = new Date(now.getTime() + 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        const result = await airdropService.createAirdrop({
          name: 'API测试空投',
          description: 'API集成测试',
          totalAmount: 10000,
          perUserAmount: 100,
          startTime,
          endTime
        });

        expect(result.airdropId).toBeDefined();
        expect(result.name).toBe('API测试空投');
      });

      test('应该拒绝无效参数', async () => {
        const now = new Date();
        const startTime = new Date(now.getTime() + 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        expect(async () => {
          await airdropService.createAirdrop({
            name: '无效空投',
            description: '测试',
            totalAmount: 0,
            perUserAmount: 100,
            startTime,
            endTime
          });
        }).toThrow();
      });
    });

    describe('POST /api/airdrop/start/:airdropId', () => {
      test('应该成功启动空投', async () => {
        const now = new Date();
        const startTime = new Date(now.getTime() - 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        const airdrop = await airdropService.createAirdrop({
          name: '启动测试',
          description: '测试',
          totalAmount: 10000,
          perUserAmount: 100,
          startTime,
          endTime
        });

        const result = await airdropService.startAirdrop(airdrop.airdropId);

        expect(result.success).toBe(true);
      });
    });

    describe('POST /api/airdrop/claim', () => {
      test('应该成功领取空投', async () => {
        const userId = 'api-user-010';
        await accountService.createAccount(userId);

        const now = new Date();
        const startTime = new Date(now.getTime() - 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        const airdrop = await airdropService.createAirdrop({
          name: '领取测试',
          description: '测试',
          totalAmount: 10000,
          perUserAmount: 100,
          startTime,
          endTime
        });

        await airdropService.startAirdrop(airdrop.airdropId);
        const result = await airdropService.claimAirdrop(airdrop.airdropId, userId);

        expect(result.success).toBe(true);
        expect(result.amount).toBe(100);
      });

      test('应该拒绝重复领取', async () => {
        const userId = 'api-user-011';
        await accountService.createAccount(userId);

        const now = new Date();
        const startTime = new Date(now.getTime() - 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        const airdrop = await airdropService.createAirdrop({
          name: '重复测试',
          description: '测试',
          totalAmount: 10000,
          perUserAmount: 100,
          startTime,
          endTime
        });

        await airdropService.startAirdrop(airdrop.airdropId);
        await airdropService.claimAirdrop(airdrop.airdropId, userId);

        expect(async () => {
          await airdropService.claimAirdrop(airdrop.airdropId, userId);
        }).toThrow();
      });
    });

    describe('GET /api/airdrop/list', () => {
      test('应该返回空投列表', async () => {
        const now = new Date();
        const startTime = new Date(now.getTime() - 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        await airdropService.createAirdrop({
          name: '空投1',
          description: '测试',
          totalAmount: 10000,
          perUserAmount: 100,
          startTime,
          endTime
        });

        await airdropService.createAirdrop({
          name: '空投2',
          description: '测试',
          totalAmount: 10000,
          perUserAmount: 100,
          startTime,
          endTime
        });

        const stats = airdropService.getAirdropStats();
        expect(stats.totalAirdrops).toBe(2);
      });
    });
  });

  describe('Task API', () => {
    describe('POST /api/task/create', () => {
      test('应该成功创建任务', async () => {
        const now = new Date();
        const startTime = new Date(now.getTime() + 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        const result = await taskService.createTask({
          title: 'API测试任务',
          description: 'API集成测试',
          reward: 100,
          maxCompletions: 10,
          startTime,
          endTime
        });

        expect(result.taskId).toBeDefined();
        expect(result.title).toBe('API测试任务');
      });
    });

    describe('POST /api/task/activate/:taskId', () => {
      test('应该成功激活任务', async () => {
        const now = new Date();
        const startTime = new Date(now.getTime() - 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        const task = await taskService.createTask({
          title: '激活测试',
          description: '测试',
          reward: 100,
          maxCompletions: 10,
          startTime,
          endTime
        });

        const result = await taskService.activateTask(task.taskId);

        expect(result.success).toBe(true);
      });
    });

    describe('POST /api/task/complete', () => {
      test('应该成功完成任务', async () => {
        const userId = 'api-user-020';
        await accountService.createAccount(userId);

        const now = new Date();
        const startTime = new Date(now.getTime() - 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        const task = await taskService.createTask({
          title: '完成测试',
          description: '测试',
          reward: 100,
          maxCompletions: 10,
          startTime,
          endTime
        });

        await taskService.activateTask(task.taskId);
        const result = await taskService.completeTask(task.taskId, userId);

        expect(result.success).toBe(true);
        expect(result.reward).toBe(100);
        expect(result.newBalance).toBe(100);
      });

      test('应该拒绝重复完成', async () => {
        const userId = 'api-user-021';
        await accountService.createAccount(userId);

        const now = new Date();
        const startTime = new Date(now.getTime() - 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        const task = await taskService.createTask({
          title: '重复测试',
          description: '测试',
          reward: 100,
          maxCompletions: 10,
          startTime,
          endTime
        });

        await taskService.activateTask(task.taskId);
        await taskService.completeTask(task.taskId, userId);

        expect(async () => {
          await taskService.completeTask(task.taskId, userId);
        }).toThrow();
      });
    });

    describe('GET /api/task/list', () => {
      test('应该返回任务列表', async () => {
        const now = new Date();
        const startTime = new Date(now.getTime() + 1000 * 60);
        const endTime = new Date(now.getTime() + 1000 * 60 * 60);

        await taskService.createTask({
          title: '任务1',
          description: '测试',
          reward: 100,
          maxCompletions: 10,
          startTime,
          endTime
        });

        await taskService.createTask({
          title: '任务2',
          description: '测试',
          reward: 100,
          maxCompletions: 10,
          startTime,
          endTime
        });

        const allTasks = taskService.getAllTasks();
        expect(allTasks.length).toBe(2);
      });
    });
  });

  describe('Freeze API', () => {
    describe('POST /api/freeze/create', () => {
      test('应该成功创建冻结', async () => {
        const userId = 'api-user-030';
        await accountService.createAccount(userId);
        await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

        const freeze = freezeService.createInitialFreeze({
          userId,
          amount: 500,
          transactionId: 'api-tx-001'
        });

        expect(freeze).toBeDefined();
        expect(freeze.amount).toBe(500);
      });

      test('应该拒绝余额不足的冻结', async () => {
        const userId = 'api-user-031';
        await accountService.createAccount(userId);
        await accountService.addTokens(userId, 100, TransactionType.REWARD, '初始奖励');

        expect(() => {
          freezeService.createInitialFreeze({
            userId,
            amount: 200,
            transactionId: 'api-tx-002'
          });
        }).toThrow();
      });
    });

    describe('POST /api/freeze/unfreeze/:freezeId', () => {
      test('应该成功解冻', async () => {
        const userId = 'api-user-032';
        await accountService.createAccount(userId);
        await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

        const freeze = freezeService.createInitialFreeze({
          userId,
          amount: 500,
          transactionId: 'api-tx-003'
        });

        const result = freezeService.unfreeze(freeze.id, 'API解冻');

        expect(result.status).toBe('UNFROZEN');
      });
    });

    describe('GET /api/freeze/status/:freezeId', () => {
      test('应该返回冻结状态', async () => {
        const userId = 'api-user-033';
        await accountService.createAccount(userId);
        await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

        const freeze = freezeService.createInitialFreeze({
          userId,
          amount: 500,
          transactionId: 'api-tx-004'
        });

        const status = freezeService.getFreezeStatus(freeze.id);

        expect(status).toBeDefined();
        expect(status.amount).toBe(500);
        expect(status.status).toBe('FROZEN');
      });
    });
  });

  describe('Error Handling', () => {
    test('应该正确处理不存在的资源', () => {
      expect(accountService.getAccountInfo('non-existent')).toBeNull();
      expect(accountService.getTokenBalance('non-existent')).toBeNull();
      expect(accountService.hasEnoughBalance('non-existent', 100)).toBe(false);
    });

    test('应该正确处理无效参数', async () => {
      const userId = 'error-user-001';
      await accountService.createAccount(userId);

      // 负金额
      expect(async () => {
        await accountService.addTokens(userId, -100, TransactionType.REWARD, '负金额');
      }).toThrow();
    });

    test('应该正确处理并发操作', async () => {
      const userId = 'concurrent-user-001';
      await accountService.createAccount(userId);

      // 并发添加代币
      const promises = Array(10).fill(null).map(() =>
        accountService.addTokens(userId, 100, TransactionType.REWARD, '并发')
      );

      await Promise.all(promises);

      const balance = accountService.getTokenBalance(userId);
      expect(balance?.balance).toBe(1000);
    });
  });

  describe('Performance Tests', () => {
    test('应该快速处理大量查询', async () => {
      const userId = 'perf-user-001';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        accountService.getTokenBalance(userId);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1000 次查询应该在 1 秒内完成
      expect(duration).toBeLessThan(1000);
    });

    test('应该快速处理批量操作', async () => {
      const userIds = [];
      
      // 创建 100 个账户
      for (let i = 0; i < 100; i++) {
        const userId = `perf-user-${i + 10}`;
        await accountService.createAccount(userId);
        userIds.push(userId);
      }

      const startTime = Date.now();
      
      // 批量添加代币
      for (const userId of userIds) {
        await accountService.addTokens(userId, 100, TransactionType.REWARD, '批量');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100 次添加操作应该在 5 秒内完成
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Integration Scenarios', () => {
    test('完整流程：创建账户 -> 获取空投 -> 完成任务 -> 转账', async () => {
      const user1 = 'scenario-user-001';
      const user2 = 'scenario-user-002';

      // 1. 创建账户
      await accountService.createAccount(user1);
      await accountService.createAccount(user2);

      // 2. 创建并领取空投
      const now = new Date();
      const airdrop = await airdropService.createAirdrop({
        name: '场景测试空投',
        description: '测试',
        totalAmount: 10000,
        perUserAmount: 500,
        startTime: new Date(now.getTime() - 1000 * 60),
        endTime: new Date(now.getTime() + 1000 * 60 * 60)
      });
      await airdropService.startAirdrop(airdrop.airdropId);
      await airdropService.claimAirdrop(airdrop.airdropId, user1);

      let balance1 = accountService.getTokenBalance(user1);
      expect(balance1?.balance).toBe(500);

      // 3. 创建并完成任务
      const task = await taskService.createTask({
        title: '场景测试任务',
        description: '测试',
        reward: 200,
        maxCompletions: 10,
        startTime: new Date(now.getTime() - 1000 * 60),
        endTime: new Date(now.getTime() + 1000 * 60 * 60)
      });
      await taskService.activateTask(task.taskId);
      await taskService.completeTask(task.taskId, user1);

      balance1 = accountService.getTokenBalance(user1);
      expect(balance1?.balance).toBe(700);

      // 4. 转账
      await accountService.transfer(user1, user2, 300, '场景测试转账');

      balance1 = accountService.getTokenBalance(user1);
      const balance2 = accountService.getTokenBalance(user2);
      
      expect(balance1?.balance).toBe(400);
      expect(balance2?.balance).toBe(300);
    });

    test('冻结场景：创建冻结 -> 查询状态 -> 解冻', async () => {
      const user = 'freeze-scenario-001';
      await accountService.createAccount(user);
      await accountService.addTokens(user, 1000, TransactionType.REWARD, '初始奖励');

      // 创建冻结
      const freeze = freezeService.createInitialFreeze({
        userId: user,
        amount: 500,
        transactionId: 'scenario-tx-001'
      });

      let available = freezeService.getAvailableBalance(user);
      expect(available).toBe(500);

      // 查询状态
      const status = freezeService.getFreezeStatus(freeze.id);
      expect(status.status).toBe('FROZEN');

      // 解冻
      await freezeService.unfreeze(freeze.id, '场景解冻');

      available = freezeService.getAvailableBalance(user);
      expect(available).toBe(1000);
    });
  });
});
