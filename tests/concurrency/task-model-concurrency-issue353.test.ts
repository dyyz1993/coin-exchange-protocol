/**
 * TaskModel 并发安全测试（Issue #353）
 *
 * 测试目标：
 * 1. 验证 getTaskMutex 不会产生竞态条件
 * 2. 验证读取方法返回快照，不影响内部数据
 * 3. 验证 createCompletion 在高并发下不会超限
 */

import { TaskModel } from '../../src/models/Task';
import { TaskStatus, TaskType } from '../../src/types';

describe('TaskModel 并发安全测试 (Issue #353)', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    taskModel = new TaskModel();
  });

  describe('1. getTaskMutex 竞态条件测试', () => {
    it('应该并发安全地创建 Mutex', async () => {
      const concurrentRequests = 100;

      // 并发调用 getTaskMutex（通过 createCompletion 间接调用）
      const task = taskModel.createTask({
        title: 'Test Task',
        description: 'Test',
        reward: 10,
        maxCompletions: concurrentRequests,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 并发创建完成记录
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        taskModel.createCompletion(task.id, `user_${i}`)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === 'fulfilled').length;

      // 验证：所有请求都应该成功（因为 maxCompletions = concurrentRequests）
      expect(successful).toBe(concurrentRequests);
    });
  });

  describe('2. 读取方法快照测试', () => {
    it('getTask 应该返回快照，修改不影响内部数据', () => {
      const task = taskModel.createTask({
        title: 'Original Title',
        description: 'Original Description',
        reward: 100,
        maxCompletions: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });

      // 获取快照
      const snapshot = taskModel.getTask(task.id);
      expect(snapshot).toBeDefined();
      expect(snapshot!.title).toBe('Original Title');

      // 修改快照
      snapshot!.title = 'Modified Title';
      snapshot!.currentCompletions = 999;

      // 验证内部数据未受影响
      const taskAgain = taskModel.getTask(task.id);
      expect(taskAgain!.title).toBe('Original Title');
      expect(taskAgain!.currentCompletions).toBe(0);
    });

    it('getActiveTasks 应该返回快照数组，修改不影响内部数据', () => {
      const task = taskModel.createTask({
        title: 'Active Task',
        description: 'Test',
        reward: 50,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 获取活跃任务列表
      const activeTasks = taskModel.getActiveTasks();
      expect(activeTasks.length).toBe(1);
      expect(activeTasks[0].title).toBe('Active Task');

      // 修改快照数组
      activeTasks[0].title = 'Modified Task';
      activeTasks[0].currentCompletions = 999;

      // 验证内部数据未受影响
      const activeTasksAgain = taskModel.getActiveTasks();
      expect(activeTasksAgain[0].title).toBe('Active Task');
      expect(activeTasksAgain[0].currentCompletions).toBe(0);
    });

    it('getAllTasks 应该返回快照数组，修改不影响内部数据', () => {
      taskModel.createTask({
        title: 'Task 1',
        description: 'Test',
        reward: 10,
        maxCompletions: 5,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.DAILY,
      });

      taskModel.createTask({
        title: 'Task 2',
        description: 'Test',
        reward: 20,
        maxCompletions: 5,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.WEEKLY,
      });

      // 获取所有任务
      const allTasks = taskModel.getAllTasks();
      expect(allTasks.length).toBe(2);

      // 修改快照数组
      allTasks[0].title = 'Modified Task 1';
      allTasks[1].reward = 999;

      // 验证内部数据未受影响
      const allTasksAgain = taskModel.getAllTasks();
      expect(allTasksAgain[0].title).toBe('Task 1');
      expect(allTasksAgain[1].reward).toBe(20);
    });
  });

  describe('3. createCompletion 并发安全性测试', () => {
    it('高并发下不应超过 maxCompletions 限制', async () => {
      const task = taskModel.createTask({
        title: 'Concurrent Test Task',
        description: 'Test',
        reward: 10,
        maxCompletions: 5, // 只允许 5 次完成
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 并发发起 20 次完成请求
      const promises = Array.from({ length: 20 }, (_, i) =>
        taskModel.createCompletion(task.id, `user_${i}`)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      // 验证：只有 5 次成功，15 次失败
      expect(successful).toBe(5);
      expect(failed).toBe(15);

      // 验证：任务完成次数正确
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.currentCompletions).toBe(5);
    });

    it('同一用户不应能重复完成任务', async () => {
      const task = taskModel.createTask({
        title: 'Single Completion Task',
        description: 'Test',
        reward: 10,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      // 第一次完成应该成功
      await expect(taskModel.createCompletion(task.id, 'user_123')).resolves.toBeDefined();

      // 第二次完成应该失败
      await expect(taskModel.createCompletion(task.id, 'user_123')).rejects.toThrow(
        'User has already completed this task'
      );
    });

    it('版本号应该正确递增', async () => {
      const task = taskModel.createTask({
        title: 'Version Test Task',
        description: 'Test',
        reward: 10,
        maxCompletions: 10,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 10000),
        type: TaskType.SPECIAL,
      });
      taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

      const initialVersion = task.version;

      // 完成 3 次任务
      await taskModel.createCompletion(task.id, 'user_1');
      await taskModel.createCompletion(task.id, 'user_2');
      await taskModel.createCompletion(task.id, 'user_3');

      // 验证版本号递增
      const updatedTask = taskModel.getTask(task.id);
      expect(updatedTask!.version).toBe(initialVersion + 3);
    });
  });

  describe('4. Mutex 创建竞态条件专项测试', () => {
    it('并发创建 Mutex 不应导致重复创建', async () => {
      const taskIds: string[] = [];

      // 创建 3 个任务
      for (let i = 0; i < 3; i++) {
        const task = taskModel.createTask({
          title: `Task ${i}`,
          description: 'Test',
          reward: 10,
          maxCompletions: 100,
          startTime: new Date(Date.now() - 1000),
          endTime: new Date(Date.now() + 10000),
          type: TaskType.SPECIAL,
        });
        taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);
        taskIds.push(task.id);
      }

      // 对每个任务并发发起 50 次完成请求
      const promises: Promise<any>[] = [];
      taskIds.forEach((taskId) => {
        for (let i = 0; i < 50; i++) {
          promises.push(taskModel.createCompletion(taskId, `user_${taskId}_${i}`));
        }
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === 'fulfilled').length;

      // 验证：每个任务 50 次完成，3 个任务共 150 次
      expect(successful).toBe(150); // 每个 50 次
    });
  });
});
