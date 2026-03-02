/**
 * 任务服务测试
 * 测试任务创建、完成、奖励发放等核心功能
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { taskService } from '../services/task.service';
import { accountModel } from '../models/Account';
import { TaskStatus } from '../types';

describe('任务服务测试', () => {
  const testUserId = 'test-user-task';

  beforeEach(() => {
    // 重置测试数据
    const existingAccount = accountModel.getAccountByUserId(testUserId);
    if (!existingAccount) {
      accountModel.createAccount(testUserId, 1000);
    }
  });

  describe('创建任务', () => {
    test('应该成功创建任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const result = await taskService.createTask({
        title: '测试任务',
        description: '这是一个测试任务',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      expect(result).toBeDefined();
      expect(result.taskId).toBeDefined();
      expect(result.title).toBe('测试任务');
      expect(result.reward).toBe(50);
      expect(result.status).toBe(TaskStatus.DRAFT);
    });

    test('应该拒绝无效的时间范围', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 3600000);
      const endTime = new Date(now.getTime() + 1000);

      await expect(
        taskService.createTask({
          title: '无效任务',
          description: '时间范围无效',
          reward: 50,
          maxCompletions: 100,
          startTime,
          endTime,
        })
      ).rejects.toThrow('开始时间必须早于结束时间');
    });

    test('应该拒绝无效的奖励金额', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      await expect(
        taskService.createTask({
          title: '无效奖励',
          description: '奖励为0',
          reward: 0,
          maxCompletions: 100,
          startTime,
          endTime,
        })
      ).rejects.toThrow('奖励金额必须大于0');
    });

    test('应该拒绝无效的最大完成次数', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      await expect(
        taskService.createTask({
          title: '无效次数',
          description: '次数为0',
          reward: 50,
          maxCompletions: 0,
          startTime,
          endTime,
        })
      ).rejects.toThrow('最大完成次数必须大于0');
    });
  });

  describe('激活任务', () => {
    test('应该成功激活草稿状态的任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '待激活任务',
        description: '测试激活',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      const result = await taskService.activateTask(task.taskId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(TaskStatus.ACTIVE);
    });

    test('应该拒绝激活不存在的任务', async () => {
      await expect(taskService.activateTask('non-existent-id')).rejects.toThrow('任务不存在');
    });

    test('应该拒绝激活非草稿状态的任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '测试任务',
        description: '测试重复激活',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      await taskService.activateTask(task.taskId);

      await expect(taskService.activateTask(task.taskId)).rejects.toThrow(
        '只有草稿状态的任务可以激活'
      );
    });
  });

  describe('暂停任务', () => {
    test('应该成功暂停活跃状态的任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '测试暂停',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      await taskService.activateTask(task.taskId);
      const result = await taskService.pauseTask(task.taskId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(TaskStatus.PAUSED);
    });

    test('应该拒绝暂停非活跃状态的任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '测试暂停',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      await expect(taskService.pauseTask(task.taskId)).rejects.toThrow(
        '只有活跃状态的任务可以暂停'
      );
    });
  });

  describe('取消任务', () => {
    test('应该成功取消任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '测试取消',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      const result = await taskService.cancelTask(task.taskId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(TaskStatus.CANCELLED);
    });
  });

  describe('用户完成任务', () => {
    let activeTaskId: string;

    beforeEach(async () => {
      const now = new Date();
      // 创建已经激活且在有效期内的任务
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '可完成任务',
        description: '测试完成',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      await taskService.activateTask(task.taskId);
      activeTaskId = task.taskId;
    });

    test('应该成功完成任务并获得奖励', async () => {
      const initialBalance = accountModel.getAccountByUserId(testUserId)!.balance;

      const result = await taskService.completeTask(activeTaskId, testUserId);

      expect(result.success).toBe(true);
      expect(result.reward).toBe(50);
      expect(result.completionId).toBeDefined();
      expect(result.newBalance).toBe(initialBalance + 50);
    });

    test('应该拒绝重复完成同一任务', async () => {
      await taskService.completeTask(activeTaskId, testUserId);

      await expect(taskService.completeTask(activeTaskId, testUserId)).rejects.toThrow(
        '您已经完成过此任务'
      );
    });

    test('应该拒绝完成不存在的任务', async () => {
      await expect(taskService.completeTask('non-existent-id', testUserId)).rejects.toThrow(
        '任务不存在'
      );
    });

    test('应该拒绝完成未激活的任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '未激活任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      await expect(taskService.completeTask(task.taskId, testUserId)).rejects.toThrow(
        '任务未激活或已结束'
      );
    });
  });

  describe('获取任务详情', () => {
    test('应该成功获取任务详情', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '测试详情',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      await taskService.activateTask(task.taskId);
      const detail = taskService.getTaskDetail(task.taskId);

      expect(detail.task).toBeDefined();
      expect(detail.completionCount).toBe(0);
      expect(detail.canComplete).toBe(true);
    });
  });

  describe('检查用户是否可完成任务', () => {
    test('应该正确返回可完成状态', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '测试检查',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      await taskService.activateTask(task.taskId);
      const result = taskService.canUserComplete(task.taskId, testUserId);

      expect(result.canComplete).toBe(true);
    });

    test('应该正确返回不可完成状态和原因', async () => {
      const result = taskService.canUserComplete('non-existent-id', testUserId);

      expect(result.canComplete).toBe(false);
      expect(result.reason).toBe('任务不存在');
    });
  });

  describe('获取任务统计', () => {
    test('应该成功获取任务统计信息', () => {
      const stats = taskService.getTaskStats();

      expect(stats).toHaveProperty('totalTasks');
      expect(stats).toHaveProperty('activeTasks');
      expect(stats).toHaveProperty('completedTasks');
      expect(stats).toHaveProperty('totalRewardsDistributed');
    });
  });

  describe('获取用户可完成的任务列表', () => {
    test('应该返回用户可完成的任务列表', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 3600000);

      const task = await taskService.createTask({
        title: '可完成任务',
        description: '测试',
        reward: 50,
        maxCompletions: 100,
        startTime,
        endTime,
      });

      await taskService.activateTask(task.taskId);
      const availableTasks = taskService.getAvailableTasks(testUserId);

      expect(availableTasks.length).toBeGreaterThan(0);
      expect(availableTasks[0]).toHaveProperty('id');
      expect(availableTasks[0]).toHaveProperty('title');
      expect(availableTasks[0]).toHaveProperty('reward');
    });
  });
});
