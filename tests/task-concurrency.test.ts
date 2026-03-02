/**
 * TaskModel 并发测试
 * 验证 Issue #334 的修复效果
 */

import { TaskModel } from '../src/models/Task';
import { TaskStatus, TaskType } from '../src/types/task';

describe('TaskModel Concurrency Tests', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    taskModel = new TaskModel();
  });

  /**
   * 测试1：并发完成次数不超过限制
   * 场景：maxCompletions = 5，10个并发请求，应该只有5个成功
   */
  test('should not exceed maxCompletions under concurrent access', async () => {
    // 创建任务，最大完成次数为5
    const task = taskModel.createTask({
      title: 'Test Task',
      description: 'Test Description',
      reward: 100,
      maxCompletions: 5,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000),
      type: TaskType.SPECIAL,
    });

    // 激活任务
    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 模拟10个并发请求
    const userIds = Array.from({ length: 10 }, (_, i) => `user_${i}`);
    const promises = userIds.map((userId) =>
      taskModel.createCompletion(task.id, userId).catch((err) => err)
    );

    const results = await Promise.all(promises);

    // 统计成功和失败的数量
    const successes = results.filter((r) => !(r instanceof Error));
    const failures = results.filter((r) => r instanceof Error);

    console.log(`成功: ${successes.length}, 失败: ${failures.length}`);
    console.log(
      `失败原因:`,
      failures.map((f) => (f as Error).message)
    );

    // 验证：应该只有5个成功，5个失败
    expect(successes.length).toBe(5);
    expect(failures.length).toBe(5);

    // 验证：失败的都是因为达到最大完成次数
    failures.forEach((failure) => {
      expect((failure as Error).message).toBe('Task has reached maximum completions');
    });

    // 验证：任务的 currentCompletions 应该准确为5
    const updatedTask = taskModel.getTask(task.id);
    expect(updatedTask?.currentCompletions).toBe(5);
  });

  /**
   * 测试2：同一用户重复完成应该被拒绝
   */
  test('should reject duplicate completion by same user', async () => {
    const task = taskModel.createTask({
      title: 'Test Task',
      description: 'Test Description',
      reward: 100,
      maxCompletions: 10,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000),
      type: TaskType.SPECIAL,
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    const userId = 'user_123';

    // 第一次完成应该成功
    const completion1 = await taskModel.createCompletion(task.id, userId);
    expect(completion1).toBeDefined();
    expect(completion1.userId).toBe(userId);

    // 第二次完成应该失败
    await expect(taskModel.createCompletion(task.id, userId)).rejects.toThrow(
      'User has already completed this task'
    );

    // 验证任务的完成次数仍然是1
    const updatedTask = taskModel.getTask(task.id);
    expect(updatedTask?.currentCompletions).toBe(1);
  });

  /**
   * 测试3：版本号应该在每次更新时递增
   */
  test('should increment version on each update', async () => {
    const task = taskModel.createTask({
      title: 'Test Task',
      description: 'Test Description',
      reward: 100,
      maxCompletions: 5,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000),
      type: TaskType.SPECIAL,
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 初始版本号应该是0
    expect(task.version).toBe(0);

    // 完成一次任务
    await taskModel.createCompletion(task.id, 'user_1');

    let updatedTask = taskModel.getTask(task.id);
    expect(updatedTask?.version).toBe(1);

    // 再完成一次
    await taskModel.createCompletion(task.id, 'user_2');

    updatedTask = taskModel.getTask(task.id);
    expect(updatedTask?.version).toBe(2);
  });

  /**
   * 测试4：高并发压力测试
   */
  test('should handle high concurrency correctly', async () => {
    const task = taskModel.createTask({
      title: 'Stress Test Task',
      description: 'Stress Test Description',
      reward: 100,
      maxCompletions: 100,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000),
      type: TaskType.SPECIAL,
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 200个并发请求，限制100个
    const userIds = Array.from({ length: 200 }, (_, i) => `user_${i}`);
    const promises = userIds.map((userId) =>
      taskModel.createCompletion(task.id, userId).catch((err) => err)
    );

    const results = await Promise.all(promises);

    const successes = results.filter((r) => !(r instanceof Error));
    const failures = results.filter((r) => r instanceof Error);

    console.log(`压力测试 - 成功: ${successes.length}, 失败: ${failures.length}`);

    // 验证：应该只有100个成功
    expect(successes.length).toBe(100);
    expect(failures.length).toBe(100);

    // 验证：任务的 currentCompletions 应该准确为100
    const updatedTask = taskModel.getTask(task.id);
    expect(updatedTask?.currentCompletions).toBe(100);
    expect(updatedTask?.version).toBe(100);
  });

  /**
   * 测试5：并发修改检测
   */
  test('should detect concurrent modification', async () => {
    const task = taskModel.createTask({
      title: 'Test Task',
      description: 'Test Description',
      reward: 100,
      maxCompletions: 10,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 10000),
      type: TaskType.SPECIAL,
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 由于有互斥锁保护，这个测试主要是验证版本号机制
    // 即使有并发，也会被串行化处理
    const promises = [
      taskModel.createCompletion(task.id, 'user_1'),
      taskModel.createCompletion(task.id, 'user_2'),
      taskModel.createCompletion(task.id, 'user_3'),
    ];

    const results = await Promise.all(promises);

    // 所有操作都应该成功（因为被串行化了）
    expect(results.length).toBe(3);
    results.forEach((result) => {
      expect(result).toBeDefined();
      expect(result.userId).toBeDefined();
    });

    // 验证版本号递增
    const updatedTask = taskModel.getTask(task.id);
    expect(updatedTask?.version).toBe(3);
  });
});
