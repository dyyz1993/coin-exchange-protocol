/**
 * TaskModel 并发安全测试
 *
 * 验证修复 Issue #333, #335：
 * - 防止超额完成
 * - 防止重复奖励
 * - 并发场景下的数据一致性
 */

import { TaskModel } from '../../src/models/Task';
import { TaskStatus, TaskType } from '../../src/types';

describe('TaskModel - 并发安全测试', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    // 每个测试使用新的 TaskModel 实例
    taskModel = new TaskModel();
  });

  describe('防止超额完成', () => {
    it('应该在 maxCompletions=1 时拒绝超额完成', async () => {
      // 创建只有 1 个完成名额的任务
      const task = taskModel.createTask({
        title: '限量任务',
        description: '只能完成一次',
        reward: 100,
        maxCompletions: 1,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟 10 个用户同时完成
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          taskModel.createCompletion(task.id, `user_${i}`).catch((err) => {
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successes = results.filter((r) => r && !('error' in r)).length;
      const failures = results.filter((r) => r && 'error' in r).length;

      console.log('Results:', { successes, failures, results });

      // 只有 1 个应该成功
      expect(successes).toBe(1);
      expect(failures).toBe(9);
    });

    it('应该在 maxCompletions=5 时正确处理并发', async () => {
      // 创建有 5 个完成名额的任务
      const task = taskModel.createTask({
        title: '限量任务（5人）',
        description: '只能完成5次',
        reward: 50,
        maxCompletions: 5,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟 20 个用户同时完成
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          taskModel.createCompletion(task.id, `user_${i}`).catch((err) => {
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successes = results.filter((r) => r && !('error' in r)).length;
      const failures = results.filter((r) => r && 'error' in r).length;

      console.log('Results:', { successes, failures });

      // 只有 5 个应该成功
      expect(successes).toBe(5);
      expect(failures).toBe(15);
    });
  });

  describe('防止重复奖励', () => {
    it('应该防止同一用户重复完成', async () => {
      const task = taskModel.createTask({
        title: '单次任务',
        description: '每个用户只能完成一次',
        reward: 100,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.DAILY,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const userId = 'user_duplicate';

      // 第一次应该成功
      const completion1 = await taskModel.createCompletion(task.id, userId);
      expect(completion1).toBeDefined();
      expect(completion1.userId).toBe(userId);

      // 第二次应该失败
      await expect(taskModel.createCompletion(task.id, userId)).rejects.toThrow(
        'User has already completed this task'
      );

      // 第三次也应该失败
      await expect(taskModel.createCompletion(task.id, userId)).rejects.toThrow(
        'User has already completed this task'
      );
    });

    it('应该在并发场景下防止同一用户重复完成', async () => {
      const task = taskModel.createTask({
        title: '并发测试任务',
        description: '测试并发重复完成',
        reward: 100,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const userId = 'user_concurrent';

      // 同一用户同时发起 10 次完成请求
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          taskModel.createCompletion(task.id, userId).catch((err) => {
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successes = results.filter((r) => r && !('error' in r)).length;
      const failures = results.filter((r) => r && 'error' in r).length;

      console.log('Concurrent duplicate results:', { successes, failures, results });

      // 只有 1 个应该成功
      expect(successes).toBe(1);
      expect(failures).toBe(9);
    });
  });

  describe('数据一致性', () => {
    it('应该确保 currentCompletions 准确', async () => {
      const task = taskModel.createTask({
        title: '一致性测试任务',
        description: '测试数据一致性',
        reward: 50,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 5 个用户完成
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(taskModel.createCompletion(task.id, `user_${i}`));
      }

      await Promise.all(promises);

      // 检查 currentCompletions 是否准确
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask?.currentCompletions).toBe(5);
    });

    it('应该确保版本号正确递增', async () => {
      const task = taskModel.createTask({
        title: '版本号测试任务',
        description: '测试乐观锁',
        reward: 50,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      // 初始版本号应该是 0
      expect(task.version).toBe(0);

      // 更新状态，版本号应该递增
      const updated = taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);
      expect(updated.version).toBe(1);

      // 再次更新
      const updated2 = taskModel.updateTaskStatus(task.id, TaskStatus.PAUSED);
      expect(updated2.version).toBe(2);
    });

    it('应该在版本号不匹配时抛出错误', () => {
      const task = taskModel.createTask({
        title: '乐观锁测试任务',
        description: '测试版本冲突',
        reward: 50,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      // 使用错误的版本号更新
      expect(() => {
        taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, 999);
      }).toThrow('Optimistic lock failed');
    });
  });

  describe('边界场景', () => {
    it('应该正确处理 maxCompletions=0 的任务', async () => {
      const task = taskModel.createTask({
        title: '无名额任务',
        description: '没有人能完成',
        reward: 100,
        maxCompletions: 0,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 任何用户都应该失败
      await expect(taskModel.createCompletion(task.id, 'user_1')).rejects.toThrow(
        'Task has reached maximum completions'
      );
    });

    it('应该正确处理大量并发请求', async () => {
      const task = taskModel.createTask({
        title: '高并发任务',
        description: '测试大量并发',
        reward: 10,
        maxCompletions: 50,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 100 个用户同时完成
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          taskModel.createCompletion(task.id, `user_${i}`).catch((err) => {
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successes = results.filter((r) => r && !('error' in r)).length;
      const failures = results.filter((r) => r && 'error' in r).length;

      console.log('High concurrency results:', { successes, failures });

      // 只有 50 个应该成功
      expect(successes).toBe(50);
      expect(failures).toBe(50);

      // 验证最终状态
      const finalTask = taskModel.getTask(task.id);
      expect(finalTask?.currentCompletions).toBe(50);
    }, 10000); // 增加超时时间
  });
});
