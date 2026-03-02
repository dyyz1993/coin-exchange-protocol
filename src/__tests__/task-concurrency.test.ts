/**
 * 任务并发测试 - 验证任务完成次数的并发安全性
 *
 * 测试目标：
 * 1. 验证在并发场景下，任务完成次数不会超过 maxCompletions
 * 2. 验证同一用户不能重复完成任务
 * 3. 验证高并发下的数据一致性
 */

import { taskModel } from '../models/Task';
import { TaskStatus } from '../types';

describe('Task Concurrency Tests', () => {
  beforeEach(() => {
    // 重置任务模型状态
    // 注意：实际实现中可能需要添加 reset() 方法
  });

  describe('基本并发测试', () => {
    it('should not exceed maxCompletions under concurrent access', async () => {
      // 创建任务，maxCompletions = 10
      const task = await taskModel.createTask({
        title: '并发测试任务',
        description: '测试并发完成',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      // 激活任务
      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      // 模拟 20 个用户并发完成
      const userIds = Array.from({ length: 20 }, (_, i) => `user_${i}`);

      const promises = userIds.map((userId) =>
        taskModel.createCompletion(task.id, userId).catch((err) => err)
      );

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successes = results.filter((r) => !(r instanceof Error)).length;
      const failures = results.filter((r) => r instanceof Error).length;

      console.log(`并发测试结果 - 成功: ${successes}, 失败: ${failures}`);

      // 验证：成功次数应该等于 maxCompletions
      const finalTask = taskModel.getTask(task.id);
      expect(finalTask!.currentCompletions).toBe(10);
      expect(successes).toBe(10);
      expect(failures).toBe(10);
    });

    it('should prevent duplicate completions from same user', async () => {
      const task = await taskModel.createTask({
        title: '重复完成测试',
        description: '测试用户重复完成',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      const userId = 'test_user_123';

      // 第一次完成应该成功
      const completion1 = await taskModel.createCompletion(task.id, userId);
      expect(completion1).toBeDefined();
      expect(completion1.userId).toBe(userId);

      // 第二次完成应该失败
      await expect(taskModel.createCompletion(task.id, userId)).rejects.toThrow(
        'User has already completed this task'
      );
    });

    it('should handle concurrent requests from same user', async () => {
      const task = await taskModel.createTask({
        title: '同用户并发测试',
        description: '测试同一用户并发请求',
        reward: 50,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      const userId = 'concurrent_user_456';

      // 同一用户同时发起 10 次完成请求
      const promises = Array.from({ length: 10 }, () =>
        taskModel.createCompletion(task.id, userId).catch((err) => err)
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => !(r instanceof Error)).length;
      const failures = results.filter((r) => r instanceof Error).length;

      console.log(`同用户并发测试 - 成功: ${successes}, 失败: ${failures}`);

      // 验证：只能成功 1 次
      expect(successes).toBe(1);
      expect(failures).toBe(9);

      const finalTask = taskModel.getTask(task.id);
      expect(finalTask!.currentCompletions).toBe(1);
    });
  });

  describe('高并发测试', () => {
    it('should handle high concurrency with 1000 simultaneous requests', async () => {
      const task = await taskModel.createTask({
        title: '高并发测试',
        description: '测试 1000 个并发请求',
        reward: 10,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      // 1000 个并发请求
      const promises = Array.from({ length: 1000 }, (_, i) =>
        taskModel.createCompletion(task.id, `user_${i}`).catch((err) => err)
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => !(r instanceof Error)).length;
      const failures = results.filter((r) => r instanceof Error).length;

      console.log(`高并发测试结果 - 成功: ${successes}/1000`);

      const finalTask = taskModel.getTask(task.id);
      expect(finalTask!.currentCompletions).toBeLessThanOrEqual(100);
      expect(successes).toBeLessThanOrEqual(100);
      expect(finalTask!.currentCompletions).toBe(successes);

      // 验证没有超额完成
      if (finalTask!.currentCompletions > 100) {
        console.error(`❌ 检测到并发问题：完成次数 ${finalTask!.currentCompletions} 超过限制 100`);
      }
    });

    it('should handle burst traffic pattern', async () => {
      const task = await taskModel.createTask({
        title: '突发流量测试',
        description: '测试突发流量模式',
        reward: 5,
        maxCompletions: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      // 第一波：50 个并发请求
      const wave1 = Array.from({ length: 50 }, (_, i) =>
        taskModel.createCompletion(task.id, `wave1_user_${i}`).catch((err) => err)
      );

      const results1 = await Promise.all(wave1);
      const successes1 = results1.filter((r) => !(r instanceof Error)).length;

      console.log(`第一波测试 - 成功: ${successes1}/50`);

      // 第二波：50 个并发请求
      const wave2 = Array.from({ length: 50 }, (_, i) =>
        taskModel.createCompletion(task.id, `wave2_user_${i}`).catch((err) => err)
      );

      const results2 = await Promise.all(wave2);
      const successes2 = results2.filter((r) => !(r instanceof Error)).length;

      console.log(`第二波测试 - 成功: ${successes2}/50`);

      const finalTask = taskModel.getTask(task.id);
      expect(finalTask!.currentCompletions).toBeLessThanOrEqual(50);
      expect(finalTask!.currentCompletions).toBe(successes1 + successes2);
    });
  });

  describe('压力测试', () => {
    it('should maintain consistency under stress', async () => {
      const task = await taskModel.createTask({
        title: '压力测试',
        description: '持续压力测试',
        reward: 1,
        maxCompletions: 1000,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      // 分批执行，每批 100 个
      const batches = 10;
      const batchSize = 100;
      let totalSuccess = 0;

      for (let batch = 0; batch < batches; batch++) {
        const promises = Array.from({ length: batchSize }, (_, i) =>
          taskModel.createCompletion(task.id, `batch_${batch}_user_${i}`).catch((err) => err)
        );

        const results = await Promise.all(promises);
        const batchSuccess = results.filter((r) => !(r instanceof Error)).length;
        totalSuccess += batchSuccess;

        console.log(`批次 ${batch + 1}/${batches} - 成功: ${batchSuccess}/${batchSize}`);
      }

      const finalTask = taskModel.getTask(task.id);
      expect(finalTask!.currentCompletions).toBe(totalSuccess);
      expect(finalTask!.currentCompletions).toBeLessThanOrEqual(1000);

      console.log(`压力测试总结果: ${totalSuccess} 次成功完成`);

      // 验证数据一致性
      const completions = taskModel.getTaskCompletions(task.id);
      expect(completions.length).toBe(finalTask!.currentCompletions);
    });

    it('should handle mixed concurrent operations', async () => {
      const task = await taskModel.createTask({
        title: '混合操作测试',
        description: '测试读取和写入混合并发',
        reward: 10,
        maxCompletions: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      // 混合操作：50 个完成请求 + 100 个读取请求
      const completionPromises = Array.from({ length: 50 }, (_, i) =>
        taskModel.createCompletion(task.id, `user_${i}`).catch((err) => err)
      );

      const readPromises = Array.from({ length: 100 }, () =>
        Promise.resolve(taskModel.getTask(task.id))
      );

      const allPromises = [...completionPromises, ...readPromises];
      const results = await Promise.all(allPromises);

      const completionResults = results.slice(0, 50);
      const successes = completionResults.filter((r) => !(r instanceof Error)).length;

      const finalTask = taskModel.getTask(task.id);
      expect(finalTask!.currentCompletions).toBeLessThanOrEqual(50);
      expect(finalTask!.currentCompletions).toBe(successes);

      console.log(`混合操作测试 - 完成成功: ${successes}/50`);
    });
  });

  describe('边界条件测试', () => {
    it('should handle task with maxCompletions = 1', async () => {
      const task = await taskModel.createTask({
        title: '单人任务',
        description: '只能完成一次',
        reward: 1000,
        maxCompletions: 1,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      // 10 个用户并发完成
      const promises = Array.from({ length: 10 }, (_, i) =>
        taskModel.createCompletion(task.id, `user_${i}`).catch((err) => err)
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => !(r instanceof Error)).length;

      const finalTask = taskModel.getTask(task.id);
      expect(finalTask!.currentCompletions).toBe(1);
      expect(successes).toBe(1);

      console.log(`单人任务测试 - 成功: ${successes}/10`);
    });

    it('should handle task completion exactly at limit', async () => {
      const task = await taskModel.createTask({
        title: '精确限制测试',
        description: '测试达到限制边界',
        reward: 100,
        maxCompletions: 5,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      // 第一轮：5 个用户（应该全部成功）
      const round1 = Array.from({ length: 5 }, (_, i) =>
        taskModel.createCompletion(task.id, `user_round1_${i}`)
      );

      const results1 = await Promise.all(round1);
      const successes1 = results1.filter((r) => !(r instanceof Error)).length;

      // 第二轮：5 个新用户（应该全部失败）
      const round2 = Array.from({ length: 5 }, (_, i) =>
        taskModel.createCompletion(task.id, `user_round2_${i}`).catch((err) => err)
      );

      const results2 = await Promise.all(round2);
      const successes2 = results2.filter((r) => !(r instanceof Error)).length;

      const finalTask = taskModel.getTask(task.id);
      expect(finalTask!.currentCompletions).toBe(5);
      expect(successes1).toBe(5);
      expect(successes2).toBe(0);

      console.log(`精确限制测试 - 第一轮成功: ${successes1}/5, 第二轮成功: ${successes2}/5`);
    });
  });

  describe('性能测试', () => {
    it('should complete operations within acceptable time', async () => {
      const task = await taskModel.createTask({
        title: '性能测试',
        description: '测试操作耗时',
        reward: 10,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      await taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task.version);

      const startTime = Date.now();

      // 100 个并发请求
      const promises = Array.from({ length: 100 }, (_, i) =>
        taskModel.createCompletion(task.id, `user_${i}`).catch((err) => err)
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`性能测试 - 100 个并发请求耗时: ${duration}ms`);
      console.log(`平均每个请求耗时: ${duration / 100}ms`);

      // 性能断言：100 个请求应该在 5 秒内完成
      expect(duration).toBeLessThan(5000);
    });
  });
});
