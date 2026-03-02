/**
 * 任务并发测试
 *
 * 测试目标：验证任务完成次数在高并发场景下的正确性
 * Issue: #238
 */

import { taskModel } from '../src/models/Task';
import { taskService } from '../src/services/task.service';
import { TaskStatus } from '../src/types';

describe('Task Concurrency Tests', () => {
  beforeEach(() => {
    // 重置任务模型状态
    // 注意：实际实现中可能需要添加 reset 方法
  });

  /**
   * 测试场景 1: 基础并发测试
   * 目标：验证 maxCompletions 限制在并发场景下是否生效
   */
  it('should not exceed maxCompletions under concurrent access', async () => {
    // 创建任务：maxCompletions = 10
    const task = taskModel.createTask({
      title: 'Concurrent Test Task',
      description: 'Test task for concurrency',
      reward: 100,
      maxCompletions: 10,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000), // 24小时后
    });

    // 激活任务
    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 并发执行：100个用户同时尝试完成任务
    const userIds = Array.from({ length: 100 }, (_, i) => `user_${i}`);

    const promises = userIds.map((userId) =>
      taskService.completeTask(task.id, userId).catch((err) => err)
    );

    const results = await Promise.all(promises);

    // 统计成功和失败的数量
    const successes = results.filter((r) => !(r instanceof Error));
    const failures = results.filter((r) => r instanceof Error);

    console.log(`✅ 成功: ${successes.length}, ❌ 失败: ${failures.length}`);

    // ✅ 期望：只有10个成功，90个失败
    expect(successes.length).toBe(10);
    expect(failures.length).toBe(90);

    // ✅ 期望：currentCompletions 正好是 10
    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBe(10);
  });

  /**
   * 测试场景 2: 高并发压力测试
   * 目标：在极高并发下验证系统稳定性
   */
  it('should handle high concurrency pressure', async () => {
    const task = taskModel.createTask({
      title: 'High Pressure Test',
      description: 'Test with high concurrency',
      reward: 50,
      maxCompletions: 5,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000),
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 使用更激进的并发策略
    const concurrentBatches = 20;
    const usersPerBatch = 50;

    const allPromises = [];

    for (let batch = 0; batch < concurrentBatches; batch++) {
      const batchPromises = Array.from({ length: usersPerBatch }, (_, i) => {
        const userId = `batch_${batch}_user_${i}`;
        return taskService.completeTask(task.id, userId).catch((err) => err);
      });
      allPromises.push(...batchPromises);
    }

    const results = await Promise.all(allPromises);
    const successes = results.filter((r) => !(r instanceof Error));

    console.log(`✅ 高并发测试 - 成功: ${successes.length}/1000`);

    // ✅ 即使1000个请求并发，也不应该超过5个成功
    expect(successes.length).toBeLessThanOrEqual(5);

    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBeLessThanOrEqual(5);
  });

  /**
   * 测试场景 3: 边界条件测试
   * 目标：测试 maxCompletions = 1 的极端情况
   */
  it('should handle boundary conditions correctly', async () => {
    // 测试 maxCompletions = 1 的极端情况
    const task = taskModel.createTask({
      title: 'Single Completion Task',
      description: 'Only one user can complete',
      reward: 1000,
      maxCompletions: 1,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000),
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    const [result1, result2] = await Promise.all([
      taskService.completeTask(task.id, 'user_1').catch((err) => err),
      taskService.completeTask(task.id, 'user_2').catch((err) => err),
    ]);

    // ✅ 只有一个应该成功
    const successCount = [result1, result2].filter((r) => !(r instanceof Error)).length;
    expect(successCount).toBe(1);

    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBe(1);
  });

  /**
   * 测试场景 4: 时序测试
   * 目标：故意创建延迟来放大竞态条件
   */
  it('should detect race condition in timing attack', async () => {
    const task = taskModel.createTask({
      title: 'Timing Attack Test',
      description: 'Test with random delays',
      reward: 100,
      maxCompletions: 10,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000),
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 故意创建延迟来放大竞态条件
    const delayedComplete = async (userId: string, delayMs: number) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return taskService.completeTask(task.id, userId).catch((err) => err);
    };

    // 所有请求几乎同时到达（随机延迟0-10ms）
    const promises = Array.from({ length: 20 }, (_, i) =>
      delayedComplete(`user_${i}`, Math.random() * 10)
    );

    const results = await Promise.all(promises);
    const successes = results.filter((r) => !(r instanceof Error));

    console.log(`✅ 时序测试 - 成功: ${successes.length}/20`);

    // ✅ 即使有随机延迟，也不应该超过限制
    expect(successes.length).toBeLessThanOrEqual(10);

    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBeLessThanOrEqual(10);
  });

  /**
   * 测试场景 5: 重复完成测试
   * 目标：验证同一用户不能重复完成同一任务
   */
  it('should prevent duplicate completions by same user', async () => {
    const task = taskModel.createTask({
      title: 'Duplicate Prevention Test',
      description: 'Test duplicate completion prevention',
      reward: 100,
      maxCompletions: 10,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000),
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 同一用户尝试完成10次
    const promises = Array.from({ length: 10 }, () =>
      taskService.completeTask(task.id, 'user_1').catch((err) => err)
    );

    const results = await Promise.all(promises);
    const successes = results.filter((r) => !(r instanceof Error));

    console.log(`✅ 重复完成测试 - 成功: ${successes.length}/10`);

    // ✅ 只应该有1个成功
    expect(successes.length).toBe(1);

    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBe(1);
  });

  /**
   * 测试场景 6: 极限压力测试
   * 目标：测试系统在极限情况下的表现
   */
  it('should handle extreme pressure', async () => {
    const task = taskModel.createTask({
      title: 'Extreme Pressure Test',
      description: 'Test with extreme concurrency',
      reward: 10,
      maxCompletions: 3,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000),
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 极限并发：10000个请求
    const promises = Array.from({ length: 10000 }, (_, i) =>
      taskService.completeTask(task.id, `extreme_user_${i}`).catch((err) => err)
    );

    const start = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    const successes = results.filter((r) => !(r instanceof Error));

    console.log(`✅ 极限压力测试 - 成功: ${successes.length}/10000, 耗时: ${duration}ms`);

    // ✅ 即使10000个请求，也不应该超过3个成功
    expect(successes.length).toBeLessThanOrEqual(3);

    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBeLessThanOrEqual(3);

    // ✅ 性能要求：应该在合理时间内完成
    expect(duration).toBeLessThan(10000); // 10秒
  });

  /**
   * 测试场景 7: 并发创建任务测试
   * 目标：验证并发创建任务的安全性
   */
  it('should handle concurrent task creation', async () => {
    const promises = Array.from({ length: 100 }, (_, i) => {
      return taskModel.createTask({
        title: `Concurrent Task ${i}`,
        description: 'Test concurrent creation',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });
    });

    const tasks = await Promise.all(promises);

    // ✅ 所有任务都应该创建成功
    expect(tasks.length).toBe(100);

    // ✅ 每个任务应该有唯一的ID
    const taskIds = tasks.map((t) => t.id);
    const uniqueIds = new Set(taskIds);
    expect(uniqueIds.size).toBe(100);
  });

  /**
   * 测试场景 8: 混合并发测试
   * 目标：测试多种操作同时进行的情况
   */
  it('should handle mixed concurrent operations', async () => {
    const task = taskModel.createTask({
      title: 'Mixed Operations Test',
      description: 'Test mixed operations',
      reward: 100,
      maxCompletions: 20,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000),
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 混合操作：完成、查询、检查
    const operations = [
      // 50个完成操作
      ...Array.from({ length: 50 }, (_, i) =>
        taskService.completeTask(task.id, `mixed_user_${i}`).catch((err) => err)
      ),
      // 30个查询操作
      ...Array.from({ length: 30 }, () => taskService.getTaskDetail(task.id)),
      // 20个检查操作
      ...Array.from({ length: 20 }, (_, i) =>
        taskService.canUserComplete(task.id, `mixed_user_${i}`)
      ),
    ];

    const results = await Promise.all(operations);

    const completions = results.slice(0, 50);
    const successes = completions.filter((r) => !(r instanceof Error));

    console.log(`✅ 混合测试 - 完成成功: ${successes.length}/50`);

    // ✅ 完成次数不应该超过限制
    expect(successes.length).toBeLessThanOrEqual(20);

    const finalTask = taskModel.getTask(task.id);
    expect(finalTask!.currentCompletions).toBeLessThanOrEqual(20);
  });
});

/**
 * 性能基准测试
 */
describe('Task Performance Benchmarks', () => {
  it('should complete 1000 operations within acceptable time', async () => {
    const task = taskModel.createTask({
      title: 'Performance Test',
      description: 'Test performance',
      reward: 10,
      maxCompletions: 1000,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000),
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    const start = Date.now();

    const promises = Array.from({ length: 1000 }, (_, i) =>
      taskService.completeTask(task.id, `perf_user_${i}`).catch((err) => err)
    );

    await Promise.all(promises);

    const duration = Date.now() - start;

    console.log(`✅ 性能基准 - 1000次操作耗时: ${duration}ms`);
    console.log(`   平均每次操作: ${(duration / 1000).toFixed(2)}ms`);

    // ✅ 性能要求：1000次操作应该在5秒内完成
    expect(duration).toBeLessThan(5000);
  });
});
