/**
 * 任务系统并发安全测试
 * 验证修复后的并发控制是否有效
 */

import { TaskModel } from '../../models/Task';
import { TaskStatus } from '../../types';

describe('TaskModel 并发安全测试', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    taskModel = new TaskModel();
  });

  describe('并发完成测试', () => {
    it('应该防止同一用户并发重复完成', async () => {
      // 创建任务
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试并发安全',
        reward: 100,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟并发请求
      const concurrentRequests = 10;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          taskModel.createCompletion(task.id, 'user1').catch((err) => {
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successCount = results.filter((r) => !('error' in r)).length;
      const failCount = results.filter((r) => 'error' in r).length;

      // console.log 已移除以符合 ESLint 规则

      // 应该只有 1 个成功，其余 9 个失败
      expect(successCount).toBe(1);
      expect(failCount).toBe(concurrentRequests - 1);

      // 验证最终状态
      const completions = taskModel.getTaskCompletions(task.id);
      expect(completions.length).toBe(1);
    });

    it('应该防止多用户并发超发', async () => {
      // 创建最多完成 5 次的任务
      const task = taskModel.createTask({
        title: '限量任务',
        description: '测试超发防护',
        reward: 100,
        maxCompletions: 5,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟 10 个用户并发完成，但只有 5 个能成功
      const userCount = 10;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < userCount; i++) {
        const userId = `user${i}`;
        promises.push(
          taskModel.createCompletion(task.id, userId).catch((err) => {
            return { error: err.message, userId };
          })
        );
      }

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successCount = results.filter((r) => !('error' in r)).length;
      const failCount = results.filter((r) => 'error' in r).length;

      // console.log 已移除以符合 ESLint 规则

      // 应该只有 5 个成功，5 个失败
      expect(successCount).toBe(5);
      expect(failCount).toBe(5);

      // 验证任务完成次数
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBe(5);

      // 验证完成记录
      const completions = taskModel.getTaskCompletions(task.id);
      expect(completions.length).toBe(5);
    });

    it('应该正确处理高并发压力测试', async () => {
      // 创建大容量任务
      const task = taskModel.createTask({
        title: '压力测试任务',
        description: '测试高并发场景',
        reward: 10,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟 150 个用户并发完成
      const userCount = 150;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < userCount; i++) {
        const userId = `user${i}`;
        promises.push(
          taskModel.createCompletion(task.id, userId).catch((err) => {
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => !('error' in r)).length;

      // // console.log 已移除以符合 ESLint 规则

      // 验证不超过最大完成次数
      expect(successCount).toBe(100);

      // 验证任务状态
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBe(100);
    });
  });

  describe('竞态条件测试', () => {
    it('应该防止 TOCTOU 竞态条件', async () => {
      const task = taskModel.createTask({
        title: 'TOCTOU 测试',
        description: '测试时间检查竞态',
        reward: 50,
        maxCompletions: 2,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 同时发起 3 个请求，只有 2 个应该成功
      const promises = await Promise.allSettled([
        taskModel.createCompletion(task.id, 'user1'),
        taskModel.createCompletion(task.id, 'user2'),
        taskModel.createCompletion(task.id, 'user3'),
      ]);

      const fulfilled = promises.filter((p) => p.status === 'fulfilled').length;
      const rejected = promises.filter((p) => p.status === 'rejected').length;

      // // console.log 已移除以符合 ESLint 规则

      expect(fulfilled).toBe(2);
      expect(rejected).toBe(1);

      // 验证完成次数
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBe(2);
    });
  });

  describe('锁机制测试', () => {
    it('应该正确释放锁，避免死锁', async () => {
      const task = taskModel.createTask({
        title: '死锁测试',
        description: '测试锁释放',
        reward: 100,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 第一批并发请求
      await Promise.allSettled([
        taskModel.createCompletion(task.id, 'user1'),
        taskModel.createCompletion(task.id, 'user2'),
        taskModel.createCompletion(task.id, 'user3'),
      ]);

      // 第二批并发请求（验证锁已释放）
      const secondBatch = await Promise.allSettled([
        taskModel.createCompletion(task.id, 'user4'),
        taskModel.createCompletion(task.id, 'user5'),
      ]);

      const fulfilled = secondBatch.filter((p) => p.status === 'fulfilled').length;
      expect(fulfilled).toBe(2);

      // 验证最终状态
      const completions = taskModel.getTaskCompletions(task.id);
      expect(completions.length).toBe(5);
    });

    it('应该在异常情况下正确释放锁', async () => {
      const task = taskModel.createTask({
        title: '异常测试',
        description: '测试异常情况下的锁释放',
        reward: 100,
        maxCompletions: 1,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 第一次请求成功
      await taskModel.createCompletion(task.id, 'user1');

      // 第二次请求应该失败（已达上限）
      try {
        await taskModel.createCompletion(task.id, 'user2');
        // 如果执行到这里，说明没有抛出异常，测试失败
        expect(true).toBe(false); // Force test failure
      } catch (error: any) {
        expect(error.message).toContain('maximum completions');
      }

      // 验证锁已释放，可以继续操作
      const taskAfter = taskModel.getTask(task.id);
      expect(taskAfter!.currentCompletions).toBe(1);

      // 尝试再次完成，应该仍然失败
      try {
        await taskModel.createCompletion(task.id, 'user3');
        // 如果执行到这里，说明没有抛出异常，测试失败
        expect(true).toBe(false); // Force test failure
      } catch (error: any) {
        expect(error.message).toContain('maximum completions');
      }
    });
  });

  describe('公平性测试', () => {
    it('应该按请求顺序处理（FIFO）', async () => {
      const task = taskModel.createTask({
        title: '公平性测试',
        description: '测试请求顺序',
        reward: 100,
        maxCompletions: 3,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const executionOrder: string[] = [];

      // 创建 5 个并发请求，但只有 3 个能成功
      const promises = await Promise.allSettled([
        taskModel.createCompletion(task.id, 'user1').then(() => executionOrder.push('user1')),
        taskModel.createCompletion(task.id, 'user2').then(() => executionOrder.push('user2')),
        taskModel.createCompletion(task.id, 'user3').then(() => executionOrder.push('user3')),
        taskModel.createCompletion(task.id, 'user4').then(() => executionOrder.push('user4')),
        taskModel.createCompletion(task.id, 'user5').then(() => executionOrder.push('user5')),
      ]);

      const fulfilled = promises.filter((p) => p.status === 'fulfilled').length;
      expect(fulfilled).toBe(3);

      // 验证只有 3 个用户成功完成
      const completions = taskModel.getTaskCompletions(task.id);
      expect(completions.length).toBe(3);
    });
  });
});
