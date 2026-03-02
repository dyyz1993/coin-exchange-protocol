/**
 * TaskModel 并发安全测试
 * 验证乐观锁和互斥锁机制是否能防止并发问题
 */

import { TaskModel } from '../Task';
import { TaskStatus, TaskType } from '../../types';

describe('TaskModel Concurrency Safety', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    taskModel = new TaskModel();
  });

  describe('createCompletion - 并发安全测试', () => {
    it('应该防止超额完成（并发请求）', async () => {
      // 创建一个只允许1人完成的任务
      const task = taskModel.createTask({
        title: '限量任务',
        description: '只允许1人完成',
        reward: 100,
        maxCompletions: 1,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟10个用户并发完成同一个任务
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          taskModel.createCompletion(task.id, `user_${i}`).catch((err) => {
            // 记录失败的请求
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);

      // 统计成功和失败的数量
      const successes = results.filter((r) => !('error' in r)).length;
      const failures = results.filter((r) => 'error' in r).length;

      // 应该只有1个成功，9个失败
      expect(successes).toBe(1);
      expect(failures).toBe(9);

      // 验证任务的完成次数
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask?.currentCompletions).toBe(1);
    });

    it('应该防止同一用户重复完成（并发请求）', async () => {
      // 创建一个允许10人完成的任务
      const task = taskModel.createTask({
        title: '普通任务',
        description: '允许10人完成',
        reward: 50,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 同一个用户并发尝试完成10次
      const userId = 'user_duplicate';
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          taskModel.createCompletion(task.id, userId).catch((err) => {
            return { error: err.message };
          })
        );
      }

      const results = await Promise.all(promises);

      // 应该只有1个成功，9个失败
      const successes = results.filter((r) => !('error' in r)).length;
      const failures = results.filter((r) => 'error' in r).length;

      expect(successes).toBe(1);
      expect(failures).toBe(9);

      // 验证用户只有1条完成记录
      const completions = taskModel.getUserCompletions(userId);
      expect(completions.length).toBe(1);
    });

    it('应该在乐观锁版本不匹配时抛出错误', async () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '乐观锁测试',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 使用错误的版本号
      await expect(taskModel.createCompletion(task.id, 'user_1', 999)).rejects.toThrow(
        'Optimistic lock failed'
      );
    });

    it('应该在乐观锁版本匹配时成功', async () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '乐观锁测试',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 获取当前版本号
      const currentVersion = taskModel.getTaskVersion(task.id);

      // 使用正确的版本号
      const completion = await taskModel.createCompletion(task.id, 'user_1', currentVersion);
      expect(completion).toBeDefined();
      expect(completion.userId).toBe('user_1');

      // 验证版本号已递增
      const newVersion = taskModel.getTaskVersion(task.id);
      expect(newVersion).toBe(currentVersion + 1);
    });

    it('应该在多次并发请求中保持数据一致性', async () => {
      // 创建一个允许5人完成的任务
      const task = taskModel.createTask({
        title: '并发测试任务',
        description: '测试并发安全性',
        reward: 100,
        maxCompletions: 5,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 20个用户并发完成
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          taskModel.createCompletion(task.id, `user_${i}`).catch((err) => {
            return { error: err.message };
          })
        );
      }

      await Promise.all(promises);

      // 验证最终状态
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask?.currentCompletions).toBe(5);

      // 验证完成记录数量
      const completions = taskModel.getTaskCompletions(task.id);
      expect(completions.length).toBe(5);

      // 验证每个用户只有1条记录
      const userIds = new Set(completions.map((c) => c.userId));
      expect(userIds.size).toBe(5);
    });
  });

  describe('updateTaskStatus - 乐观锁测试', () => {
    it('应该在版本不匹配时抛出错误', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '状态更新测试',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      // 使用错误的版本号
      expect(() => {
        taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, 999);
      }).toThrow('Optimistic lock failed');
    });

    it('应该在版本匹配时成功更新', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '状态更新测试',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      const currentVersion = taskModel.getTaskVersion(task.id);

      // 使用正确的版本号
      const updatedTask = taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, currentVersion);
      expect(updatedTask.status).toBe(TaskStatus.ACTIVE);
      expect(updatedTask.version).toBe(currentVersion + 1);
    });
  });
});
