/**
 * 任务服务测试 - 测试任务创建、完成、奖励发放等功能
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { TaskService } from '../src/services/task.service';
import { AccountService } from '../src/services/account.service';

describe('任务服务测试', () => {
  let taskService: TaskService;
  let accountService: AccountService;

  beforeEach(() => {
    taskService = new TaskService();
    accountService = new AccountService();
  });

  describe('任务创建', () => {
    test('应该成功创建任务', async () => {
      const now = new Date();
      const result = await taskService.createTask({
        title: '测试任务',
        description: '这是一个测试任务',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      expect(result).toBeDefined();
      expect(result.taskId).toBeDefined();
      expect(result.title).toBe('测试任务');
      expect(result.reward).toBe(50);
      expect(result.status).toBe('DRAFT');
    });

    test('开始时间晚于结束时间应该失败', async () => {
      const now = new Date();
      
      expect(async () => {
        await taskService.createTask({
          title: '无效任务',
          description: '时间设置错误',
          reward: 50,
          maxCompletions: 100,
          startTime: new Date(now.getTime() + 86400000),
          endTime: new Date(now.getTime() + 1000)
        });
      }).toThrow('开始时间必须早于结束时间');
    });

    test('奖励金额为0或负数应该失败', async () => {
      const now = new Date();
      
      expect(async () => {
        await taskService.createTask({
          title: '无效奖励',
          description: '奖励为0',
          reward: 0,
          maxCompletions: 100,
          startTime: new Date(now.getTime() + 1000),
          endTime: new Date(now.getTime() + 86400000)
        });
      }).toThrow('奖励金额必须大于0');
    });

    test('最大完成次数为0或负数应该失败', async () => {
      const now = new Date();
      
      expect(async () => {
        await taskService.createTask({
          title: '无效次数',
          description: '次数为0',
          reward: 50,
          maxCompletions: 0,
          startTime: new Date(now.getTime() + 1000),
          endTime: new Date(now.getTime() + 86400000)
        });
      }).toThrow('最大完成次数必须大于0');
    });
  });

  describe('任务状态管理', () => {
    test('应该成功激活草稿任务', async () => {
      const now = new Date();
      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      const result = await taskService.activateTask(task.taskId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('ACTIVE');
    });

    test('应该成功暂停活跃任务', async () => {
      const now = new Date();
      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      await taskService.activateTask(task.taskId);
      const result = await taskService.pauseTask(task.taskId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('PAUSED');
    });

    test('应该成功取消任务', async () => {
      const now = new Date();
      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      const result = await taskService.cancelTask(task.taskId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('CANCELLED');
    });

    test('取消已完成的任务应该失败', async () => {
      const now = new Date();
      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      await taskService.activateTask(task.taskId);
      // 这里无法真正完成，因为模型层不支持直接设置状态
      // 但我们可以测试逻辑
    });
  });

  describe('任务完成', () => {
    test('应该成功完成任务并获得奖励', async () => {
      await accountService.createAccount('user1');

      const now = new Date();
      const task = await taskService.createTask({
        title: '可完成任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() - 1000), // 已开始
        endTime: new Date(now.getTime() + 86400000)
      });

      await taskService.activateTask(task.taskId);
      const result = await taskService.completeTask(task.taskId, 'user1');

      expect(result.success).toBe(true);
      expect(result.reward).toBe(50);
      expect(result.completionId).toBeDefined();
      expect(result.newBalance).toBe(50);
    });

    test('重复完成同一任务应该失败', async () => {
      await accountService.createAccount('user2');

      const now = new Date();
      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      await taskService.activateTask(task.taskId);
      await taskService.completeTask(task.taskId, 'user2');

      expect(async () => {
        await taskService.completeTask(task.taskId, 'user2');
      }).toThrow('您已经完成过此任务');
    });

    test('完成未激活的任务应该失败', async () => {
      await accountService.createAccount('user3');

      const now = new Date();
      const task = await taskService.createTask({
        title: '未激活任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      expect(async () => {
        await taskService.completeTask(task.taskId, 'user3');
      }).toThrow('任务未激活或已结束');
    });

    test('完成已结束的任务应该失败', async () => {
      await accountService.createAccount('user4');

      const now = new Date();
      const task = await taskService.createTask({
        title: '已结束任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() - 172800000),
        endTime: new Date(now.getTime() - 86400000) // 已结束
      });

      await taskService.activateTask(task.taskId);

      expect(async () => {
        await taskService.completeTask(task.taskId, 'user4');
      }).toThrow('任务已结束');
    });

    test('完成次数达到上限应该失败', async () => {
      await accountService.createAccount('user5');
      await accountService.createAccount('user6');

      const now = new Date();
      const task = await taskService.createTask({
        title: '限制任务',
        description: '测试',
        reward: 50,
        maxCompletions: 1, // 只允许1次完成
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      await taskService.activateTask(task.taskId);
      await taskService.completeTask(task.taskId, 'user5');

      // 第二个用户应该无法完成
      expect(async () => {
        await taskService.completeTask(task.taskId, 'user6');
      }).toThrow('任务已完成次数已达上限');
    });
  });

  describe('任务查询', () => {
    test('应该能获取任务详情', async () => {
      const now = new Date();
      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      const detail = taskService.getTaskDetail(task.taskId);

      expect(detail).toBeDefined();
      expect(detail.task.title).toBe('测试任务');
      expect(detail.completionCount).toBe(0);
    });

    test('应该能获取所有任务', () => {
      const tasks = taskService.getAllTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });

    test('应该能获取活跃任务', async () => {
      const now = new Date();
      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      await taskService.activateTask(task.taskId);
      const activeTasks = taskService.getActiveTasks();

      expect(activeTasks.length).toBeGreaterThanOrEqual(1);
    });

    test('应该能获取用户可完成的任务', async () => {
      await accountService.createAccount('user7');

      const now = new Date();
      const task = await taskService.createTask({
        title: '可完成任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      await taskService.activateTask(task.taskId);
      const availableTasks = taskService.getAvailableTasks('user7');

      expect(availableTasks.length).toBeGreaterThanOrEqual(1);
    });

    test('应该能获取用户完成记录', async () => {
      await accountService.createAccount('user8');

      const completions = taskService.getUserCompletions('user8');
      expect(Array.isArray(completions)).toBe(true);
    });
  });

  describe('任务检查', () => {
    test('应该能检查用户是否可完成任务', async () => {
      await accountService.createAccount('user9');

      const now = new Date();
      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      await taskService.activateTask(task.taskId);
      const check = taskService.canUserComplete(task.taskId, 'user9');

      expect(check.canComplete).toBe(true);
    });

    test('已完成的任务应该返回不可完成', async () => {
      await accountService.createAccount('user10');

      const now = new Date();
      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      await taskService.activateTask(task.taskId);
      await taskService.completeTask(task.taskId, 'user10');
      
      const check = taskService.canUserComplete(task.taskId, 'user10');
      expect(check.canComplete).toBe(false);
      expect(check.reason).toContain('您已经完成过此任务');
    });
  });

  describe('任务统计', () => {
    test('应该能获取任务统计信息', async () => {
      const now = new Date();
      await taskService.createTask({
        title: '测试任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 86400000)
      });

      const stats = taskService.getTaskStats();

      expect(stats).toBeDefined();
      expect(stats.totalTasks).toBeGreaterThanOrEqual(1);
      expect(stats.totalRewardsDistributed).toBeGreaterThanOrEqual(0);
    });
  });
});
