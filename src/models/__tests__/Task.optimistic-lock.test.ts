/**
 * TaskModel 乐观锁并发测试
 */

import { TaskModel } from '../Task';
import { TaskStatus } from '../../types';

describe('TaskModel - 乐观锁机制', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    taskModel = new TaskModel();
  });

  describe('版本号管理', () => {
    it('创建任务时应该初始化 version 为 1', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      expect(task.version).toBe(1);
    });

    it('getTask 应该返回深拷贝，修改不影响原数据', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      const retrieved = taskModel.getTask(task.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.version).toBe(1);

      // 修改返回的对象
      retrieved!.title = '修改后的标题';

      // 原数据不应该被修改
      const original = taskModel.getTask(task.id);
      expect(original!.title).toBe('测试任务');
    });

    it('getAllTasks 应该返回深拷贝数组', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      const allTasks = taskModel.getAllTasks();
      expect(allTasks).toHaveLength(1);

      // 修改返回的数组元素
      allTasks[0].title = '修改后的标题';

      // 原数据不应该被修改
      const original = taskModel.getTask(task.id);
      expect(original!.title).toBe('测试任务');
    });
  });

  describe('乐观锁验证', () => {
    it('updateTaskStatus 应该验证版本号', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      // 使用正确的版本号更新
      const updated = taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, 1);
      expect(updated.version).toBe(2);
      expect(updated.status).toBe(TaskStatus.ACTIVE);
    });

    it('updateTaskStatus 应该拒绝错误的版本号', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      // 先更新一次，版本号变为 2
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, 1);

      // 使用过期的版本号（1）尝试更新，应该失败
      expect(() => {
        taskModel.updateTaskStatus(task.id, TaskStatus.COMPLETED, 1);
      }).toThrow(/Concurrent modification detected/);
    });

    it('updateTaskStatus 不提供版本号时应该允许更新', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      // 不提供版本号，应该允许更新
      const updated = taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);
      expect(updated.version).toBe(2);
    });

    it('createCompletion 应该验证版本号', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 使用正确的版本号创建完成记录
      const currentTask = taskModel.getTask(task.id);
      const completion = taskModel.createCompletion(task.id, 'user1', currentTask!.version);
      expect(completion).toBeDefined();
      expect(completion.reward).toBe(100);
    });

    it('createCompletion 应该拒绝错误的版本号', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      // 激活任务，版本号变为 2
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 使用过期的版本号（1）尝试创建完成记录，应该失败
      expect(() => {
        taskModel.createCompletion(task.id, 'user1', 1);
      }).toThrow(/Concurrent modification detected/);
    });

    it('createCompletion 不提供版本号时应该允许创建', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 不提供版本号，应该允许创建
      const completion = taskModel.createCompletion(task.id, 'user1');
      expect(completion).toBeDefined();
      expect(completion.reward).toBe(100);
    });
  });

  describe('并发场景测试', () => {
    it('应该能检测到并发更新冲突', async () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      // 模拟两个并发请求读取相同的版本号
      const task1 = taskModel.getTask(task.id);
      const task2 = taskModel.getTask(task.id);

      // 第一个请求成功更新
      const updated1 = taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, task1!.version);
      expect(updated1.version).toBe(2);

      // 第二个请求应该失败（版本号冲突）
      expect(() => {
        taskModel.updateTaskStatus(task.id, TaskStatus.COMPLETED, task2!.version);
      }).toThrow(/Concurrent modification detected/);
    });

    it('应该能检测到并发完成任务冲突', async () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 模拟两个并发请求读取相同的版本号
      const task1 = taskModel.getTask(task.id);
      const task2 = taskModel.getTask(task.id);

      // 第一个请求成功完成
      const completion1 = taskModel.createCompletion(task.id, 'user1', task1!.version);
      expect(completion1).toBeDefined();

      // 第二个请求应该失败（版本号冲突）
      expect(() => {
        taskModel.createCompletion(task.id, 'user2', task2!.version);
      }).toThrow(/Concurrent modification detected/);
    });

    it('版本号应该在每次更新时递增', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      });

      expect(task.version).toBe(1);

      // 第一次更新
      const updated1 = taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, 1);
      expect(updated1.version).toBe(2);

      // 第二次更新
      const updated2 = taskModel.updateTaskStatus(task.id, TaskStatus.PAUSED, 2);
      expect(updated2.version).toBe(3);

      // 第三次更新
      const updated3 = taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE, 3);
      expect(updated3.version).toBe(4);
    });
  });

  describe('深拷贝验证', () => {
    it('getActiveTasks 应该返回深拷贝数组', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 86400000),
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const activeTasks = taskModel.getActiveTasks();
      expect(activeTasks).toHaveLength(1);

      // 修改返回的数组元素
      activeTasks[0].title = '修改后的标题';

      // 原数据不应该被修改
      const original = taskModel.getTask(task.id);
      expect(original!.title).toBe('测试任务');
    });

    it('getCompletion 应该返回深拷贝', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 86400000),
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 创建完成记录
      const completion = taskModel.createCompletion(task.id, 'user1');

      // 获取完成记录
      const retrieved = taskModel.getCompletion(completion.id);
      expect(retrieved).toBeDefined();

      // 修改返回的对象
      retrieved!.reward = 999;

      // 原数据不应该被修改
      const original = taskModel.getCompletion(completion.id);
      expect(original!.reward).toBe(100);
    });

    it('getUserCompletions 应该返回深拷贝数组', () => {
      const task = taskModel.createTask({
        title: '测试任务',
        description: '测试描述',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 86400000),
      });

      // 激活任务
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 创建完成记录
      taskModel.createCompletion(task.id, 'user1');

      // 获取用户完成记录
      const completions = taskModel.getUserCompletions('user1');
      expect(completions).toHaveLength(1);

      // 修改返回的数组元素
      completions[0].reward = 999;

      // 原数据不应该被修改
      const original = taskModel.getUserCompletions('user1');
      expect(original[0].reward).toBe(100);
    });
  });
});
