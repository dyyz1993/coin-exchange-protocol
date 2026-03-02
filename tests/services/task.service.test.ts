/**
 * 任务服务测试
 * 测试范围：任务创建、完成、奖励发放
 */

import { TaskService } from '../../src/services/task.service';
import { AccountService } from '../../src/services/account.service';
import { taskModel } from '../../src/models/Task';
import { AccountModel } from '../../src/models/Account';
import { TokenAccountModel } from '../../src/models/TokenAccount';
import { TaskStatus } from '../../src/types';

describe('TaskService', () => {
  let taskService: TaskService;
  let accountService: AccountService;

  beforeEach(() => {
    taskService = new TaskService();
    accountService = new AccountService();
    // 清空测试数据
    (taskModel as any).tasks.clear();
    (taskModel as any).completions.clear();
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
  });

  afterEach(() => {
    // 清理测试数据
    (taskModel as any).tasks.clear();
    (taskModel as any).completions.clear();
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
  });

  describe('createTask', () => {
    test('应该成功创建任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60 * 60);

      const result = await taskService.createTask({
        title: '测试任务',
        description: '这是一个测试任务',
        reward: 100,
        maxCompletions: 10,
        startTime,
        endTime,
      });

      expect(result).toBeDefined();
      expect(result.taskId).toBeDefined();
      expect(result.title).toBe('测试任务');
      expect(result.reward).toBe(100);
      expect(result.status).toBe(TaskStatus.DRAFT);
    });

    test('应该拒绝开始时间晚于结束时间的任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60);

      expect(async () => {
        await taskService.createTask({
          title: '无效任务',
          description: '时间错误',
          reward: 100,
          maxCompletions: 10,
          startTime,
          endTime,
        });
      }).toThrow('开始时间必须早于结束时间');
    });

    test('应该拒绝无效的奖励金额', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60 * 60);

      expect(async () => {
        await taskService.createTask({
          title: '无效任务',
          description: '奖励为0',
          reward: 0,
          maxCompletions: 10,
          startTime,
          endTime,
        });
      }).toThrow('奖励金额必须大于0');

      expect(async () => {
        await taskService.createTask({
          title: '无效任务',
          description: '奖励为负',
          reward: -100,
          maxCompletions: 10,
          startTime,
          endTime,
        });
      }).toThrow('奖励金额必须大于0');
    });

    test('应该拒绝无效的最大完成次数', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60 * 60);

      expect(async () => {
        await taskService.createTask({
          title: '无效任务',
          description: '完成次数为0',
          reward: 100,
          maxCompletions: 0,
          startTime,
          endTime,
        });
      }).toThrow('最大完成次数必须大于0');
    });

    test('应该支持不同的任务配置', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30); // 30天后

      const result = await taskService.createTask({
        title: '长期任务',
        description: '为期一个月的任务',
        reward: 1000,
        maxCompletions: 1000,
        startTime,
        endTime,
      });

      expect(result.reward).toBe(1000);
    });
  });

  describe('activateTask', () => {
    test('应该成功激活任务', async () => {
      const task = await createTestTask();

      const result = await taskService.activateTask(task.taskId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(TaskStatus.ACTIVE);
    });

    test('应该拒绝激活不存在的任务', async () => {
      expect(async () => {
        await taskService.activateTask('non-existent-id');
      }).toThrow('任务不存在');
    });

    test('应该拒绝激活非草稿状态的任务', async () => {
      const task = await createTestTask();
      await taskService.activateTask(task.taskId);

      expect(async () => {
        await taskService.activateTask(task.taskId);
      }).toThrow('只有草稿状态的任务可以激活');
    });
  });

  describe('pauseTask', () => {
    test('应该成功暂停任务', async () => {
      const task = await createActiveTask();

      const result = await taskService.pauseTask(task.taskId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(TaskStatus.PAUSED);
    });

    test('应该拒绝暂停不存在的任务', async () => {
      expect(async () => {
        await taskService.pauseTask('non-existent-id');
      }).toThrow('任务不存在');
    });

    test('应该拒绝暂停非活跃状态的任务', async () => {
      const task = await createTestTask();

      expect(async () => {
        await taskService.pauseTask(task.taskId);
      }).toThrow('只有活跃状态的任务可以暂停');
    });
  });

  describe('cancelTask', () => {
    test('应该成功取消任务', async () => {
      const task = await createTestTask();

      const result = await taskService.cancelTask(task.taskId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(TaskStatus.CANCELLED);
    });

    test('应该拒绝取消已完成的任务', async () => {
      const task = await createActiveTask();
      await taskService.cancelTask(task.taskId);

      expect(async () => {
        await taskService.cancelTask(task.taskId);
      }).toThrow('已完成的任务无法取消');
    });

    test('应该拒绝取消不存在的任务', async () => {
      expect(async () => {
        await taskService.cancelTask('non-existent');
      }).toThrow('任务不存在');
    });
  });

  describe('completeTask', () => {
    test('应该成功完成任务并获得奖励', async () => {
      const userId = 'test-user-001';
      const task = await createActiveTask();
      await accountService.createAccount(userId);

      const result = await taskService.completeTask(task.taskId, userId);

      expect(result.success).toBe(true);
      expect(result.reward).toBe(100);
      expect(result.completionId).toBeDefined();
      expect(result.newBalance).toBe(100);
    });

    test('应该拒绝重复完成同一任务', async () => {
      const userId = 'test-user-002';
      const task = await createActiveTask();
      await accountService.createAccount(userId);

      await taskService.completeTask(task.taskId, userId);

      expect(async () => {
        await taskService.completeTask(task.taskId, userId);
      }).toThrow('您已经完成过此任务');
    });

    test('应该拒绝完成未激活的任务', async () => {
      const userId = 'test-user-003';
      const task = await createTestTask();
      await accountService.createAccount(userId);

      expect(async () => {
        await taskService.completeTask(task.taskId, userId);
      }).toThrow('任务未激活或已结束');
    });

    test('应该拒绝完成尚未开始的任务', async () => {
      const userId = 'test-user-004';

      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60 * 60 * 2);

      const task = await taskService.createTask({
        title: '未来任务',
        description: '未来开始的任务',
        reward: 100,
        maxCompletions: 10,
        startTime,
        endTime,
      });

      await taskService.activateTask(task.taskId);
      await accountService.createAccount(userId);

      expect(async () => {
        await taskService.completeTask(task.taskId, userId);
      }).toThrow('任务尚未开始');
    });

    test('应该拒绝完成已结束的任务', async () => {
      const userId = 'test-user-005';

      const now = new Date();
      const startTime = new Date(now.getTime() - 1000 * 60 * 60 * 2);
      const endTime = new Date(now.getTime() - 1000 * 60 * 60);

      const task = await taskService.createTask({
        title: '已过期任务',
        description: '已过期的任务',
        reward: 100,
        maxCompletions: 10,
        startTime,
        endTime,
      });

      await taskService.activateTask(task.taskId);
      await accountService.createAccount(userId);

      expect(async () => {
        await taskService.completeTask(task.taskId, userId);
      }).toThrow('任务已结束');
    });

    test('应该在达到完成上限后拒绝新完成', async () => {
      const task = await createActiveTaskWithLimit(2);

      // 两个不同用户完成
      for (let i = 0; i < 2; i++) {
        const userId = `test-user-${i + 10}`;
        await accountService.createAccount(userId);
        await taskService.completeTask(task.taskId, userId);
      }

      // 第三个用户应该无法完成
      const userId3 = 'test-user-12';
      await accountService.createAccount(userId3);

      expect(async () => {
        await taskService.completeTask(task.taskId, userId3);
      }).toThrow('任务已完成次数已达上限');
    });

    test('应该拒绝完成不存在的任务', async () => {
      const userId = 'test-user-006';
      await accountService.createAccount(userId);

      expect(async () => {
        await taskService.completeTask('non-existent', userId);
      }).toThrow('任务不存在');
    });
  });

  describe('getTaskDetail', () => {
    test('应该返回完整的任务详情', async () => {
      const task = await createActiveTask();
      const userId = 'test-user-020';
      await accountService.createAccount(userId);
      await taskService.completeTask(task.taskId, userId);

      const detail = taskService.getTaskDetail(task.taskId);

      expect(detail).toBeDefined();
      expect(detail.task).toBeDefined();
      expect(detail.completionCount).toBe(1);
      expect(detail.canComplete).toBe(true);
    });

    test('应该正确判断是否可完成', async () => {
      // 草稿状态
      const draftTask = await createTestTask();
      let detail = taskService.getTaskDetail(draftTask.taskId);
      expect(detail.canComplete).toBe(false);

      // 活跃状态
      const activeTask = await createActiveTask();
      detail = taskService.getTaskDetail(activeTask.taskId);
      expect(detail.canComplete).toBe(true);

      // 已取消状态
      await taskService.cancelTask(activeTask.taskId);
      detail = taskService.getTaskDetail(activeTask.taskId);
      expect(detail.canComplete).toBe(false);
    });

    test('应该拒绝查询不存在的任务', () => {
      expect(() => {
        taskService.getTaskDetail('non-existent');
      }).toThrow('任务不存在');
    });
  });

  describe('getAllTasks & getActiveTasks', () => {
    test('应该返回所有任务', async () => {
      await createTestTask('任务1');
      await createTestTask('任务2');
      await createActiveTask('任务3');

      const allTasks = taskService.getAllTasks();
      expect(allTasks.length).toBe(3);
    });

    test('应该只返回活跃任务', async () => {
      await createTestTask('草稿任务');
      await createActiveTask('活跃任务1');
      await createActiveTask('活跃任务2');

      const activeTasks = taskService.getActiveTasks();
      expect(activeTasks.length).toBe(2);
      expect(activeTasks.every((t) => t.status === TaskStatus.ACTIVE)).toBe(true);
    });
  });

  describe('getAvailableTasks', () => {
    test('应该返回用户可完成的任务', async () => {
      const userId = 'test-user-030';
      await accountService.createAccount(userId);

      await createActiveTask('任务1');
      await createActiveTask('任务2');
      await createActiveTask('任务3');

      const available = taskService.getAvailableTasks(userId);
      expect(available.length).toBe(3);
      expect(available[0]).toHaveProperty('id');
      expect(available[0]).toHaveProperty('title');
      expect(available[0]).toHaveProperty('reward');
      expect(available[0]).toHaveProperty('remainingSlots');
    });

    test('应该排除用户已完成的任务', async () => {
      const userId = 'test-user-031';
      await accountService.createAccount(userId);

      const task1 = await createActiveTask('任务1');
      await createActiveTask('任务2');

      await taskService.completeTask(task1.taskId, userId);

      const available = taskService.getAvailableTasks(userId);
      expect(available.length).toBe(1);
      expect(available[0].title).toBe('任务2');
    });
  });

  describe('getUserCompletions', () => {
    test('应该返回用户完成记录', async () => {
      const userId = 'test-user-040';
      await accountService.createAccount(userId);

      const task1 = await createActiveTask('任务1');
      const task2 = await createActiveTask('任务2');

      await taskService.completeTask(task1.taskId, userId);
      await taskService.completeTask(task2.taskId, userId);

      const completions = taskService.getUserCompletions(userId);

      expect(completions.length).toBe(2);
      expect(completions[0]).toHaveProperty('completionId');
      expect(completions[0]).toHaveProperty('taskTitle');
      expect(completions[0]).toHaveProperty('reward');
      expect(completions[0]).toHaveProperty('status');
    });

    test('对未完成的用户应返回空数组', async () => {
      const userId = 'test-user-041';
      await accountService.createAccount(userId);

      const completions = taskService.getUserCompletions(userId);
      expect(completions).toEqual([]);
    });
  });

  describe('canUserComplete', () => {
    test('应该正确判断用户是否可完成任务', async () => {
      const userId = 'test-user-050';
      await accountService.createAccount(userId);

      const task = await createActiveTask();

      const result = taskService.canUserComplete(task.taskId, userId);
      expect(result.canComplete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    test('应该返回不可完成的原因', async () => {
      const userId = 'test-user-051';
      await accountService.createAccount(userId);

      // 草稿任务
      const draftTask = await createTestTask();
      let result = taskService.canUserComplete(draftTask.taskId, userId);
      expect(result.canComplete).toBe(false);
      expect(result.reason).toBe('任务未激活或已结束');

      // 已完成的任务
      const task = await createActiveTask();
      await taskService.completeTask(task.taskId, userId);
      result = taskService.canUserComplete(task.taskId, userId);
      expect(result.canComplete).toBe(false);
      expect(result.reason).toBe('您已经完成过此任务');
    });

    test('应该正确处理不存在的任务', () => {
      const result = taskService.canUserComplete('non-existent', 'user-001');
      expect(result.canComplete).toBe(false);
      expect(result.reason).toBe('任务不存在');
    });
  });

  describe('getTaskStats', () => {
    test('应该返回所有任务的统计信息', async () => {
      await createActiveTask('任务1');
      await createActiveTask('任务2');
      await createTestTask('任务3');

      const stats = taskService.getTaskStats();

      expect(stats.totalTasks).toBe(3);
      expect(stats.activeTasks).toBe(2);
    });

    test('应该返回单个任务的统计信息', async () => {
      const task = await createActiveTask();

      const stats = taskService.getTaskStats(task.taskId);

      expect(stats.totalTasks).toBe(1);
      expect(stats.activeTasks).toBe(1);
    });

    test('应该正确计算已分发奖励总额', async () => {
      const task = await createActiveTask();

      for (let i = 0; i < 5; i++) {
        const userId = `test-user-${i + 60}`;
        await accountService.createAccount(userId);
        await taskService.completeTask(task.taskId, userId);
      }

      const stats = taskService.getTaskStats(task.taskId);
      expect(stats.totalRewardsDistributed).toBe(500);
    });
  });

  describe('边界条件测试', () => {
    test('应该处理大量用户完成任务', async () => {
      const task = await createActiveTaskWithLimit(100);

      for (let i = 0; i < 100; i++) {
        const userId = `test-user-${i + 100}`;
        await accountService.createAccount(userId);
        await taskService.completeTask(task.taskId, userId);
      }

      const detail = taskService.getTaskDetail(task.taskId);
      expect(detail.completionCount).toBe(100);
    });

    test('应该处理并发任务完成', async () => {
      const task = await createActiveTaskWithLimit(50);

      // 创建 50 个账户
      const userIds = [];
      for (let i = 0; i < 50; i++) {
        const userId = `test-user-${i + 200}`;
        await accountService.createAccount(userId);
        userIds.push(userId);
      }

      // 并发完成
      const promises = userIds.map((userId) => taskService.completeTask(task.taskId, userId));

      await Promise.all(promises);

      const detail = taskService.getTaskDetail(task.taskId);
      expect(detail.completionCount).toBe(50);
    });

    test('应该处理极端奖励金额', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60 * 60);

      const task = await taskService.createTask({
        title: '高额奖励任务',
        description: '奖励很高',
        reward: 1000000,
        maxCompletions: 10,
        startTime,
        endTime,
      });

      expect(task.reward).toBe(1000000);
    });

    test('应该处理极端完成次数限制', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60);
      const endTime = new Date(now.getTime() + 1000 * 60 * 60);

      const task = await taskService.createTask({
        title: '无限任务',
        description: '完成次数很多',
        reward: 10,
        maxCompletions: 10000,
        startTime,
        endTime,
      });

      expect(task).toBeDefined();
    });
  });

  // 辅助函数
  async function createTestTask(title: string = '测试任务'): Promise<any> {
    const now = new Date();
    const startTime = new Date(now.getTime() + 1000 * 60);
    const endTime = new Date(now.getTime() + 1000 * 60 * 60);

    return await taskService.createTask({
      title,
      description: '这是一个测试任务',
      reward: 100,
      maxCompletions: 10,
      startTime,
      endTime,
    });
  }

  async function createActiveTask(title: string = '活跃任务'): Promise<any> {
    const now = new Date();
    const startTime = new Date(now.getTime() - 1000 * 60);
    const endTime = new Date(now.getTime() + 1000 * 60 * 60);

    const task = await taskService.createTask({
      title,
      description: '这是一个活跃的任务',
      reward: 100,
      maxCompletions: 10,
      startTime,
      endTime,
    });

    await taskService.activateTask(task.taskId);

    return task;
  }

  async function createActiveTaskWithLimit(maxCompletions: number): Promise<any> {
    const now = new Date();
    const startTime = new Date(now.getTime() - 1000 * 60);
    const endTime = new Date(now.getTime() + 1000 * 60 * 60);

    const task = await taskService.createTask({
      title: '限制任务',
      description: '完成次数有限',
      reward: 100,
      maxCompletions,
      startTime,
      endTime,
    });

    await taskService.activateTask(task.taskId);

    return task;
  }
});
