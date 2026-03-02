/**
 * TaskModel 并发安全性测试
 * 测试目标：识别 TaskModel 中的并发安全隐患
 */

import { TaskModel } from '../../models/Task';
import { TaskStatus } from '../../types';

describe('TaskModel Concurrency Safety Tests', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    taskModel = new TaskModel();
  });

  describe('⚠️ CRITICAL: Race Condition in createCompletion', () => {
    test('✅ 修复后：并发完成任务不会超出最大完成次数', async () => {
      // 创建一个只允许完成 2 次的任务
      const task = taskModel.createTask({
        title: 'Limited Task',
        description: 'Only 2 completions allowed',
        reward: 10,
        maxCompletions: 2,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟 10 个用户并发完成任务
      const concurrentCompletions = Array(10)
        .fill(null)
        .map((_, index) => {
          return taskModel
            .createCompletion(task.id, `user_${index}`)
            .then(() => ({ success: true, userId: `user_${index}` }))
            .catch(() => ({ success: false, userId: `user_${index}` }));
        });

      const results = await Promise.all(concurrentCompletions);
      const successCount = results.filter((r) => r.success).length;

      // ✅ 修复后：currentCompletions 应该等于 maxCompletions
      const finalTask = taskModel.getTask(task.id);

      console.log('Success count:', successCount);
      console.log('Final currentCompletions:', finalTask?.currentCompletions);
      console.log('Max completions:', finalTask?.maxCompletions);

      // ✅ 断言：成功次数应该 <= maxCompletions
      expect(successCount).toBeLessThanOrEqual(2);
      expect(finalTask?.currentCompletions).toBeLessThanOrEqual(2);

      console.log('✅ 并发控制生效：没有超出最大完成次数');
    });

    test('✅ 修复后：并发时用户不能重复完成同一任务', async () => {
      const task = taskModel.createTask({
        title: 'Test Task',
        description: 'Test task',
        reward: 10,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 同一个用户并发完成同一任务
      const userId = 'user_123';
      const concurrentCompletions = Array(5)
        .fill(null)
        .map(() => {
          return taskModel
            .createCompletion(task.id, userId)
            .then(() => ({ success: true }))
            .catch(() => ({ success: false }));
        });

      const results = await Promise.all(concurrentCompletions);
      const successCount = results.filter((r) => r.success).length;

      // ✅ 修复后：只有 1 个请求成功
      expect(successCount).toBe(1);

      // 检查用户的完成记录
      const userCompletions = taskModel.getUserCompletions(userId);
      expect(userCompletions.length).toBe(1);

      console.log('✅ 并发控制生效：用户只能完成一次任务');
    });
  });

  describe('⚠️ HIGH: Missing Optimistic Lock in updateTaskStatus', () => {
    test('BUG: updateTaskStatus 没有并发保护', () => {
      const task = taskModel.createTask({
        title: 'Test Task',
        description: 'Test task',
        reward: 10,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      // 两个并发请求同时更新状态
      // 由于没有版本号检查，两个都会成功
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);
      taskModel.updateTaskStatus(task.id, TaskStatus.CANCELLED);

      // 两个更新都成功了，后面的覆盖前面的
      const finalTask = taskModel.getTask(task.id);
      expect(finalTask?.status).toBe(TaskStatus.CANCELLED);

      // ⚠️ WARNING: 没有检测到并发冲突
      console.log('⚠️ WARNING: No concurrent modification detection in updateTaskStatus');
    });
  });

  describe('Data Integrity Tests', () => {
    test('任务完成计数器应该准确反映实际完成次数', async () => {
      const task = taskModel.createTask({
        title: 'Test Task',
        description: 'Test task',
        reward: 10,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 串行完成 5 次
      for (let i = 0; i < 5; i++) {
        await taskModel.createCompletion(task.id, `user_${i}`);
      }

      const finalTask = taskModel.getTask(task.id);
      expect(finalTask?.currentCompletions).toBe(5);

      const completions = taskModel.getTaskCompletions(task.id);
      expect(completions.length).toBe(5);
    });

    test('用户不能重复完成同一任务（串行场景）', async () => {
      const task = taskModel.createTask({
        title: 'Test Task',
        description: 'Test task',
        reward: 10,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const userId = 'user_123';

      // 第一次应该成功
      const completion1 = await taskModel.createCompletion(task.id, userId);
      expect(completion1).toBeDefined();

      // 第二次应该失败
      await expect(taskModel.createCompletion(task.id, userId)).rejects.toThrow(
        'User has already completed this task'
      );
    });
  });

  describe('Boundary Condition Tests', () => {
    test('达到最大完成次数后应该拒绝新的完成请求', async () => {
      const task = taskModel.createTask({
        title: 'Limited Task',
        description: 'Only 2 completions allowed',
        reward: 10,
        maxCompletions: 2,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 完成 2 次
      await taskModel.createCompletion(task.id, 'user_1');
      await taskModel.createCompletion(task.id, 'user_2');

      // 第 3 次应该失败
      await expect(taskModel.createCompletion(task.id, 'user_3')).rejects.toThrow(
        'Task has reached maximum completions'
      );
    });

    test('任务不在有效时间内应该拒绝完成', async () => {
      const task = taskModel.createTask({
        title: 'Expired Task',
        description: 'Task in the past',
        reward: 10,
        maxCompletions: 100,
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(Date.now() - 1000), // 已过期
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      await expect(taskModel.createCompletion(task.id, 'user_1')).rejects.toThrow(
        'Task is not within the valid time range'
      );
    });
  });
});
