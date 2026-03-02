/**
 * TaskModel 并发安全测试
 * 验证 Issue #333, #335 的修复
 */

import { TaskModel } from '../models/Task';
import { TaskStatus } from '../types';

describe('TaskModel 并发安全测试', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    taskModel = new TaskModel();
  });

  describe('createCompletion 并发安全', () => {
    it('应该防止同一用户重复完成任务（并发场景）', async () => {
      // 创建任务
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试并发安全',
        reward: 100,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const userId = 'user_concurrent_test';

      // 并发调用 10 次
      const promises = Array(10)
        .fill(null)
        .map(() =>
          taskModel
            .createCompletion(task.id, userId)
            .then(() => ({ success: true }))
            .catch((error) => ({ success: false, error: error.message }))
        );

      const results = await Promise.all(promises);

      // 只有一个成功，其余失败
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(9);

      // 验证失败原因
      const failedResults = results.filter((r) => !r.success) as Array<{
        success: boolean;
        error: string;
      }>;
      expect(failedResults[0].error).toContain('already completed');
    });

    it('应该防止任务超额完成（并发场景）', async () => {
      // 创建最多完成 3 次的任务
      const task = taskModel.createTask({
        title: '限量任务',
        description: '测试并发限制',
        reward: 50,
        maxCompletions: 3,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 10 个不同用户并发完成
      const promises = Array(10)
        .fill(null)
        .map((_, i) =>
          taskModel
            .createCompletion(task.id, `user_${i}`)
            .then(() => ({ success: true }))
            .catch((error) => ({ success: false, error: error.message }))
        );

      const results = await Promise.all(promises);

      // 只有 3 个成功
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      expect(successCount).toBe(3);
      expect(failureCount).toBe(7);

      // 验证任务完成次数
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask?.currentCompletions).toBe(3);
    });

    it('应该在锁保护下正确更新完成计数', async () => {
      const task = taskModel.createTask({
        title: '计数测试',
        description: '验证原子性',
        reward: 10,
        maxCompletions: 5,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 5 个用户并发完成
      const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
      await Promise.all(userIds.map((userId) => taskModel.createCompletion(task.id, userId)));

      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask?.currentCompletions).toBe(5);
    });
  });

  describe('乐观锁机制', () => {
    it('应该支持版本号检查', () => {
      const task = taskModel.createTask({
        title: '版本测试',
        description: '测试乐观锁',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
      });

      const version1 = taskModel.getTaskVersion(task.id);
      expect(version1).toBe(1);

      // 更新任务状态
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const version2 = taskModel.getTaskVersion(task.id);
      expect(version2).toBe(2);
    });

    it('应该在版本不匹配时抛出错误', () => {
      const task = taskModel.createTask({
        title: '乐观锁测试',
        description: '测试版本冲突',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
      });

      // 第一次更新（版本 1）
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, 1);

      // 使用旧版本号更新（应该失败）
      expect(() => {
        taskModel.updateTaskStatus(task.id, TaskStatus.PAUSED, 1);
      }).toThrow('Task has been modified by another operation');
    });
  });

  describe('读取方法返回快照', () => {
    it('getTask 应该返回快照而不是引用', () => {
      const task = taskModel.createTask({
        title: '快照测试',
        description: '测试不可变性',
        reward: 50,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
      });

      const snapshot1 = taskModel.getTask(task.id);
      const snapshot2 = taskModel.getTask(task.id);

      // 修改快照不应影响原数据
      if (snapshot1 && snapshot2) {
        snapshot1.title = '修改的标题';
        expect(snapshot2.title).toBe('快照测试');
      }
    });

    it('getActiveTasks 应该返回快照数组', () => {
      const task = taskModel.createTask({
        title: '活跃任务',
        description: '测试',
        reward: 50,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const activeTasks = taskModel.getActiveTasks();
      expect(activeTasks.length).toBeGreaterThan(0);

      // 修改返回的数组不应影响内部状态
      activeTasks[0].title = '修改的标题';
      const freshTasks = taskModel.getActiveTasks();
      expect(freshTasks[0].title).toBe('活跃任务');
    });
  });

  describe('边界条件测试', () => {
    it('应该正确处理 maxCompletions 为 1 的情况', async () => {
      const task = taskModel.createTask({
        title: '唯一任务',
        description: '只能完成一次',
        reward: 100,
        maxCompletions: 1,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 两个用户并发
      const results = await Promise.all([
        taskModel
          .createCompletion(task.id, 'user1')
          .then(() => ({ success: true }))
          .catch(() => ({ success: false })),
        taskModel
          .createCompletion(task.id, 'user2')
          .then(() => ({ success: true }))
          .catch(() => ({ success: false })),
      ]);

      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBe(1);
    });

    it('应该在任务未激活时拒绝完成', async () => {
      const task = taskModel.createTask({
        title: '草稿任务',
        description: '测试',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
      });

      await expect(taskModel.createCompletion(task.id, 'user1')).rejects.toThrow(
        'Task is not active'
      );
    });
  });

  describe('性能测试', () => {
    it('应该在高并发下保持数据一致性', async () => {
      const task = taskModel.createTask({
        title: '压力测试',
        description: '高并发场景',
        reward: 10,
        maxCompletions: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 100 个并发请求（50 个用户，每个用户尝试 2 次）
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 50; i++) {
        const userId = `stress_user_${i}`;
        // 每个用户尝试 2 次
        promises.push(
          taskModel
            .createCompletion(task.id, userId)
            .then(() => ({ success: true }))
            .catch(() => ({ success: false }))
        );
        promises.push(
          taskModel
            .createCompletion(task.id, userId)
            .then(() => ({ success: true }))
            .catch(() => ({ success: false }))
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.success).length;

      // 应该只有 50 个成功（每个用户只能完成一次）
      expect(successCount).toBe(50);

      // 验证最终状态
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask?.currentCompletions).toBe(50);
    }, 10000); // 10 秒超时
  });
});
