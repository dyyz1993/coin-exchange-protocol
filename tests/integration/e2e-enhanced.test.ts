/**
 * 端到端测试 - 完整用户流程测试
 * 测试核心业务流程的端到端场景
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { accountService } from '../../src/services/account.service';
import { airdropService } from '../../src/services/airdrop.service';
import { taskService } from '../../src/services/task.service';
import { freezeService } from '../../src/services/freeze.service';

describe('端到端测试 - 账户流程', () => {
  describe('账户创建 → 余额查询 → 转账流程', () => {
    const userId1 = 'e2e-user-1';
    const userId2 = 'e2e-user-2';

    beforeAll(async () => {
      // 初始化账户
      await accountService.createAccount(userId1, 1000);
      await accountService.createAccount(userId2, 500);
    });

    test('完整转账流程', async () => {
      // 1. 查询初始余额
      const balance1 = await accountService.getBalance(userId1);
      const balance2 = await accountService.getBalance(userId2);
      
      expect(balance1.success).toBe(true);
      expect(balance2.success).toBe(true);
      expect(balance1.data?.balance).toBe(1000);
      expect(balance2.data?.balance).toBe(500);

      // 2. 执行转账
      const transferResult = await accountService.transfer(userId1, userId2, 200);
      expect(transferResult.success).toBe(true);

      // 3. 验证转账后余额
      const newBalance1 = await accountService.getBalance(userId1);
      const newBalance2 = await accountService.getBalance(userId2);
      
      expect(newBalance1.data?.balance).toBe(800);
      expect(newBalance2.data?.balance).toBe(700);

      // 4. 查询交易记录
      const transactions1 = await accountService.getTransactions(userId1);
      expect(transactions1.success).toBe(true);
      expect(transactions1.data?.length).toBeGreaterThan(0);
    });

    test('余额不足的转账应该失败', async () => {
      const result = await accountService.transfer(userId1, userId2, 9999);
      expect(result.success).toBe(false);
      expect(result.error).toContain('余额不足');
    });

    test('负数金额转账应该失败', async () => {
      const result = await accountService.transfer(userId1, userId2, -100);
      expect(result.success).toBe(false);
    });
  });

  describe('冻结 → 解冻流程', () => {
    const userId = 'e2e-freeze-user';

    beforeAll(async () => {
      await accountService.createAccount(userId, 1000);
    });

    test('完整冻结解冻流程', async () => {
      // 1. 冻结余额
      const freezeResult = await freezeService.createFreeze(userId, 300, 3600);
      expect(freezeResult.success).toBe(true);

      // 2. 查询冻结状态
      const freezes = await freezeService.getUserFreezes(userId);
      expect(freezes.success).toBe(true);
      expect(freezes.data?.length).toBeGreaterThan(0);

      // 3. 检查可用余额减少
      const balance = await accountService.getBalance(userId);
      expect(balance.data?.availableBalance).toBeLessThan(1000);

      // 4. 尝试转账超过可用余额
      const transferResult = await accountService.transfer(userId, 'other-user', 800);
      expect(transferResult.success).toBe(false);
    });
  });
});

describe('端到端测试 - 空投流程', () => {
  describe('空投创建 → 激活 → 领取流程', () => {
    const userId = 'e2e-airdrop-user';
    let airdropId: string;

    beforeAll(async () => {
      await accountService.createAccount(userId, 0);
    });

    test('完整空投流程', async () => {
      // 1. 创建空投
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000); // 1秒前开始
      const endTime = new Date(now.getTime() + 86400000); // 1天后结束

      const createResult = await airdropService.createAirdrop(
        '测试空投',
        '端到端测试空投',
        1000,
        100,
        startTime,
        endTime
      );
      
      expect(createResult.success).toBe(true);
      airdropId = createResult.data?.id || '';

      // 2. 查询空投详情
      const airdrop = await airdropService.getAirdrop(airdropId);
      expect(airdrop.success).toBe(true);
      expect(airdrop.data?.name).toBe('测试空投');

      // 3. 激活空投
      const activateResult = await airdropService.activateAirdrop(airdropId);
      expect(activateResult.success).toBe(true);

      // 4. 检查用户是否可以领取
      const canClaim = await airdropService.canUserClaim(airdropId, userId);
      expect(canClaim.success).toBe(true);
      expect(canClaim.data?.canClaim).toBe(true);

      // 5. 领取空投
      const claimResult = await airdropService.claimAirdrop(airdropId, userId);
      expect(claimResult.success).toBe(true);
      expect(claimResult.data?.amount).toBe(100);

      // 6. 验证用户余额增加
      const balance = await accountService.getBalance(userId);
      expect(balance.data?.balance).toBe(100);

      // 7. 再次尝试领取应该失败
      const claimAgain = await airdropService.claimAirdrop(airdropId, userId);
      expect(claimAgain.success).toBe(false);
      expect(claimAgain.error).toContain('已领取');

      // 8. 查询领取记录
      const claims = await airdropService.getUserClaims(userId);
      expect(claims.success).toBe(true);
      expect(claims.data?.length).toBeGreaterThan(0);
    });

    test('未激活的空投不能领取', async () => {
      const now = new Date();
      const inactiveAirdrop = await airdropService.createAirdrop(
        '未激活空投',
        '测试用',
        500,
        50,
        new Date(now.getTime() + 86400000),
        new Date(now.getTime() + 172800000)
      );

      const claimResult = await airdropService.claimAirdrop(
        inactiveAirdrop.data?.id || '',
        userId
      );
      
      expect(claimResult.success).toBe(false);
    });
  });
});

describe('端到端测试 - 任务流程', () => {
  describe('任务创建 → 激活 → 完成 → 奖励发放流程', () => {
    const userId = 'e2e-task-user';
    let taskId: string;

    beforeAll(async () => {
      await accountService.createAccount(userId, 0);
    });

    test('完整任务流程', async () => {
      // 1. 创建任务
      const createResult = await taskService.createTask(
        '每日签到',
        '每天签到一次',
        50,
        'daily'
      );
      
      expect(createResult.success).toBe(true);
      taskId = createResult.data?.id || '';

      // 2. 查询任务详情
      const task = await taskService.getTask(taskId);
      expect(task.success).toBe(true);
      expect(task.data?.title).toBe('每日签到');
      expect(task.data?.reward).toBe(50);

      // 3. 激活任务
      const activateResult = await taskService.activateTask(taskId);
      expect(activateResult.success).toBe(true);

      // 4. 检查用户是否可以完成
      const canComplete = await taskService.canUserComplete(taskId, userId);
      expect(canComplete.success).toBe(true);
      expect(canComplete.data?.canComplete).toBe(true);

      // 5. 记录初始余额
      const initialBalance = await accountService.getBalance(userId);
      const initialAmount = initialBalance.data?.balance || 0;

      // 6. 完成任务
      const completeResult = await taskService.completeTask(taskId, userId);
      expect(completeResult.success).toBe(true);

      // 7. 验证奖励发放
      const finalBalance = await accountService.getBalance(userId);
      expect(finalBalance.data?.balance).toBe(initialAmount + 50);

      // 8. 再次尝试完成应该失败（每日任务限制）
      const completeAgain = await taskService.completeTask(taskId, userId);
      expect(completeAgain.success).toBe(false);

      // 9. 查询完成记录
      const completions = await taskService.getUserCompletions(userId);
      expect(completions.success).toBe(true);
      expect(completions.data?.length).toBeGreaterThan(0);
    });

    test('未激活的任务不能完成', async () => {
      const inactiveTask = await taskService.createTask(
        '未激活任务',
        '测试用',
        30,
        'daily'
      );

      const completeResult = await taskService.completeTask(
        inactiveTask.data?.id || '',
        userId
      );
      
      expect(completeResult.success).toBe(false);
    });

    test('暂停的任务不能完成', async () => {
      const task = await taskService.createTask('暂停任务', '测试', 20, 'daily');
      const taskId = task.data?.id || '';
      
      await taskService.activateTask(taskId);
      await taskService.pauseTask(taskId);

      const completeResult = await taskService.completeTask(taskId, userId);
      expect(completeResult.success).toBe(false);
    });
  });
});

describe('端到端测试 - 综合场景', () => {
  test('完整业务流程：空投 → 任务 → 转账', async () => {
    const user1 = 'e2e-comprehensive-1';
    const user2 = 'e2e-comprehensive-2';

    // 1. 初始化账户
    await accountService.createAccount(user1, 0);
    await accountService.createAccount(user2, 0);

    // 2. 创建并领取空投
    const now = new Date();
    const airdrop = await airdropService.createAirdrop(
      '综合测试空投',
      '测试',
      1000,
      200,
      new Date(now.getTime() - 1000),
      new Date(now.getTime() + 86400000)
    );
    
    await airdropService.activateAirdrop(airdrop.data?.id || '');
    await airdropService.claimAirdrop(airdrop.data?.id || '', user1);

    // 3. 完成任务获得奖励
    const task = await taskService.createTask('综合测试任务', '测试', 100, 'daily');
    await taskService.activateTask(task.data?.id || '');
    await taskService.completeTask(task.data?.id || '', user1);

    // 4. 验证 user1 余额
    const balance1 = await accountService.getBalance(user1);
    expect(balance1.data?.balance).toBe(300); // 200(空投) + 100(任务)

    // 5. user1 转账给 user2
    await accountService.transfer(user1, user2, 150);

    // 6. 验证最终余额
    const finalBalance1 = await accountService.getBalance(user1);
    const finalBalance2 = await accountService.getBalance(user2);
    
    expect(finalBalance1.data?.balance).toBe(150);
    expect(finalBalance2.data?.balance).toBe(150);
  });

  test('并发操作测试：多个用户同时领取空投', async () => {
    const userIds = ['concurrent-1', 'concurrent-2', 'concurrent-3'];
    
    // 初始化账户
    for (const userId of userIds) {
      await accountService.createAccount(userId, 0);
    }

    // 创建空投（总量300，每人100）
    const now = new Date();
    const airdrop = await airdropService.createAirdrop(
      '并发测试空投',
      '测试',
      300,
      100,
      new Date(now.getTime() - 1000),
      new Date(now.getTime() + 86400000)
    );
    
    await airdropService.activateAirdrop(airdrop.data?.id || '');

    // 并发领取
    const results = await Promise.all(
      userIds.map(userId => 
        airdropService.claimAirdrop(airdrop.data?.id || '', userId)
      )
    );

    // 所有领取都应该成功
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // 验证每个用户余额
    for (const userId of userIds) {
      const balance = await accountService.getBalance(userId);
      expect(balance.data?.balance).toBe(100);
    }
  });
});
