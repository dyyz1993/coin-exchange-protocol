/**
 * Task 模型并发测试
 * 测试任务完成并发竞态条件和边界情况
 */

import { TaskModel } from '../../src/models/Task';
import { TaskStatus, TaskCompletionStatus } from '../../src/types/task';

describe('Task 并发测试', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    taskModel = new TaskModel();
  });

  describe('任务完成并发竞态条件', () => {
    it('应该防止并发完成超过最大次数限制', async () => {
      // 创建最大完成次数为 3 的任务
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 10000);

      const task = taskModel.createTask({
        title: '并发测试任务',
        description: '测试并发完成',
        reward: 100,
        maxCompletions: 3,
        startTime,
        endTime,
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟 5 个并发完成请求（超过 maxCompletions）
      const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
      const completionPromises = userIds.map((userId) =>
        Promise.resolve().then(() => {
          try {
            return taskModel.createCompletion(task.id, userId);
          } catch (error) {
            return null; // 返回 null 表示失败
          }
        })
      );

      const results = await Promise.all(completionPromises);

      // 验证只有 3 个成功完成
      const successCount = results.filter((r) => r !== null).length;
      expect(successCount).toBe(3);

      // 验证完成次数不超过 maxCompletions
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBeLessThanOrEqual(task.maxCompletions);
    });

    it('应该防止同一用户重复完成任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 10000);

      const task = taskModel.createTask({
        title: '重复测试任务',
        description: '测试重复完成',
        reward: 50,
        maxCompletions: 10,
        startTime,
        endTime,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 同一用户尝试完成 3 次
      const completionPromises = Array(3)
        .fill(null)
        .map(() =>
          Promise.resolve().then(() => {
            try {
              return taskModel.createCompletion(task.id, 'user1');
            } catch (error) {
              return null;
            }
          })
        );

      const results = await Promise.all(completionPromises);

      // 验证只有 1 个成功
      const successCount = results.filter((r) => r !== null).length;
      expect(successCount).toBe(1);

      // 验证只记录了 1 次完成
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBe(1);
    });

    it('应该在任务未激活时拒绝完成', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 10000);

      const task = taskModel.createTask({
        title: '未激活任务',
        description: '测试未激活',
        reward: 100,
        maxCompletions: 5,
        startTime,
        endTime,
      });

      // 任务状态为 DRAFT，不激活
      const completionPromises = ['user1', 'user2', 'user3'].map((userId) =>
        Promise.resolve().then(() => {
          try {
            return taskModel.createCompletion(task.id, userId);
          } catch (error) {
            return null;
          }
        })
      );

      const results = await Promise.all(completionPromises);

      // 所有请求都应该失败
      const successCount = results.filter((r) => r !== null).length;
      expect(successCount).toBe(0);

      // 验证完成次数为 0
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBe(0);
    });
  });

  describe('边界情况测试', () => {
    it('应该正确处理 maxCompletions 为 0 的任务', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 10000);

      const task = taskModel.createTask({
        title: '零完成次数任务',
        description: '测试边界',
        reward: 100,
        maxCompletions: 0,
        startTime,
        endTime,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 尝试完成任务
      expect(() => {
        taskModel.createCompletion(task.id, 'user1');
      }).toThrow('Task has reached maximum completions');
    });

    it('应该正确处理刚好达到 maxCompletions 的情况', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 10000);

      const task = taskModel.createTask({
        title: '边界测试任务',
        description: '测试刚好达到限制',
        reward: 100,
        maxCompletions: 2,
        startTime,
        endTime,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 完成 2 次
      taskModel.createCompletion(task.id, 'user1');
      taskModel.createCompletion(task.id, 'user2');

      // 第 3 次应该失败
      expect(() => {
        taskModel.createCompletion(task.id, 'user3');
      }).toThrow('Task has reached maximum completions');

      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBe(2);
    });

    it('应该正确处理时间范围外的任务', async () => {
      const now = new Date();

      // 已结束的任务
      const pastTask = taskModel.createTask({
        title: '已结束任务',
        description: '测试时间边界',
        reward: 100,
        maxCompletions: 5,
        startTime: new Date(now.getTime() - 10000),
        endTime: new Date(now.getTime() - 1000),
      });

      taskModel.updateTaskStatus(pastTask.id, TaskStatus.ACTIVE);

      expect(() => {
        taskModel.createCompletion(pastTask.id, 'user1');
      }).toThrow('Task is not within the valid time range');

      // 未开始的任务
      const futureTask = taskModel.createTask({
        title: '未开始任务',
        description: '测试时间边界',
        reward: 100,
        maxCompletions: 5,
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 10000),
      });

      taskModel.updateTaskStatus(futureTask.id, TaskStatus.ACTIVE);

      expect(() => {
        taskModel.createCompletion(futureTask.id, 'user1');
      }).toThrow('Task is not within the valid time range');
    });
  });

  describe('高并发场景测试', () => {
    it('应该在高并发下保持数据一致性', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 10000);

      const task = taskModel.createTask({
        title: '高并发测试任务',
        description: '测试高并发',
        reward: 10,
        maxCompletions: 50,
        startTime,
        endTime,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟 100 个并发请求
      const userIds = Array(100)
        .fill(null)
        .map((_, i) => `user${i}`);

      const completionPromises = userIds.map((userId) =>
        Promise.resolve().then(() => {
          try {
            return taskModel.createCompletion(task.id, userId);
          } catch (error) {
            return null;
          }
        })
      );

      const results = await Promise.all(completionPromises);

      // 验证只有 50 个成功
      const successCount = results.filter((r) => r !== null).length;
      expect(successCount).toBe(50);

      // 验证完成次数不超过 maxCompletions
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBe(50);
    });

    it('应该在高并发下正确记录所有完成', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 10000);

      const task = taskModel.createTask({
        title: '完成记录测试',
        description: '测试完成记录',
        reward: 10,
        maxCompletions: 10,
        startTime,
        endTime,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 10 个用户并发完成
      const userIds = Array(10)
        .fill(null)
        .map((_, i) => `user${i}`);

      const completionPromises = userIds.map((userId) =>
        Promise.resolve().then(() => {
          try {
            return taskModel.createCompletion(task.id, userId);
          } catch (error) {
            return null;
          }
        })
      );

      const results = await Promise.all(completionPromises);
      const successfulCompletions = results.filter((r): r is NonNullable<typeof r> => r !== null);

      // 验证所有成功完成的记录都存在
      expect(successfulCompletions.length).toBe(10);

      // 验证每个完成记录都正确关联了用户
      const userIdSet = new Set(successfulCompletions.map((c) => c.userId));
      expect(userIdSet.size).toBe(10);

      // 验证所有完成记录的状态都是 APPROVED
      successfulCompletions.forEach((completion) => {
        expect(completion.status).toBe(TaskCompletionStatus.APPROVED);
      });
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理高并发请求', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000);
      const endTime = new Date(now.getTime() + 10000);

      const task = taskModel.createTask({
        title: '性能测试任务',
        description: '测试性能',
        reward: 1,
        maxCompletions: 1000,
        startTime,
        endTime,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const userIds = Array(1000)
        .fill(null)
        .map((_, i) => `user${i}`);

      const start = Date.now();

      const completionPromises = userIds.map((userId) =>
        Promise.resolve().then(() => {
          try {
            return taskModel.createCompletion(task.id, userId);
          } catch (error) {
            return null;
          }
        })
      );

      await Promise.all(completionPromises);

      const duration = Date.now() - start;

      // 应该在 1 秒内完成
      expect(duration).toBeLessThan(1000);

      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBe(1000);
    });
  });
});
