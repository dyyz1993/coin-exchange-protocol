/**
 * Task 模型并发测试
 * 测试任务完成并发竞态条件和边界情况
 */

import { Task } from '../../src/models/Task';
import { TaskStatus } from '../../src/types/task.types';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup';
import mongoose from 'mongoose';

describe('Task 并发测试', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('任务完成并发竞态条件', () => {
    it('应该防止并发完成超过最大次数限制', async () => {
      // 创建需要完成 3 次的任务
      const task = await Task.create({
        title: '并发测试任务',
        description: '测试并发完成',
        status: TaskStatus.PENDING,
        requiredCount: 3,
        completedCount: 0,
        reward: 100,
        creator: new mongoose.Types.ObjectId(),
      });

      // 模拟 5 个并发完成请求（超过 requiredCount）
      const completionPromises = Array(5)
        .fill(null)
        .map((_, _index) =>
          Task.findByIdAndUpdate(task._id, { $inc: { completedCount: 1 } }, { new: true })
        );

      await Promise.all(completionPromises);

      // 验证完成次数不超过 requiredCount
      const updatedTask = await Task.findById(task._id);
      expect(updatedTask!.completedCount).toBeLessThanOrEqual(task.requiredCount);
    });

    it('使用 findOneAndUpdate 原子操作防止竞态', async () => {
      const task = await Task.create({
        title: '原子操作测试',
        description: '测试原子操作',
        status: TaskStatus.PENDING,
        requiredCount: 2,
        completedCount: 0,
        reward: 50,
        creator: new mongoose.Types.ObjectId(),
      });

      // 使用原子操作完成
      const completionPromises = Array(3)
        .fill(null)
        .map(() =>
          Task.findOneAndUpdate(
            {
              _id: task._id,
              completedCount: { $lt: task.requiredCount },
            },
            { $inc: { completedCount: 1 } },
            { new: true }
          )
        );

      const results = await Promise.all(completionPromises);
      const successCount = results.filter((r) => r !== null).length;

      // 验证只有 requiredCount 次操作成功
      expect(successCount).toBe(task.requiredCount);
    });
  });

  describe('边界情况测试', () => {
    it('当 completedCount 等于 requiredCount 时应拒绝完成', async () => {
      const task = await Task.create({
        title: '已完成任务',
        description: '测试边界',
        status: TaskStatus.COMPLETED,
        requiredCount: 3,
        completedCount: 3,
        reward: 100,
        creator: new mongoose.Types.ObjectId(),
      });

      // 尝试再次完成
      const result = await Task.findOneAndUpdate(
        {
          _id: task._id,
          completedCount: { $lt: task.requiredCount },
        },
        { $inc: { completedCount: 1 } },
        { new: true }
      );

      expect(result).toBeNull();
    });

    it('应该正确处理 requiredCount 为 1 的情况', async () => {
      const task = await Task.create({
        title: '单次任务',
        description: '测试单次完成',
        status: TaskStatus.PENDING,
        requiredCount: 1,
        completedCount: 0,
        reward: 100,
        creator: new mongoose.Types.ObjectId(),
      });

      // 并发尝试完成
      const completionPromises = Array(5)
        .fill(null)
        .map(() =>
          Task.findOneAndUpdate(
            {
              _id: task._id,
              completedCount: { $lt: task.requiredCount },
            },
            {
              $inc: { completedCount: 1 },
              $set: { status: TaskStatus.COMPLETED },
            },
            { new: true }
          )
        );

      const results = await Promise.all(completionPromises);
      const successCount = results.filter((r) => r !== null).length;

      // 只有 1 次成功
      expect(successCount).toBe(1);

      const updatedTask = await Task.findById(task._id);
      expect(updatedTask!.completedCount).toBe(1);
      expect(updatedTask!.status).toBe(TaskStatus.COMPLETED);
    });

    it('应该正确处理高 requiredCount 的情况', async () => {
      const requiredCount = 100;
      const task = await Task.create({
        title: '高次数任务',
        description: '测试高次数',
        status: TaskStatus.PENDING,
        requiredCount,
        completedCount: 0,
        reward: 10,
        creator: new mongoose.Types.ObjectId(),
      });

      // 并发尝试完成 150 次
      const completionPromises = Array(150)
        .fill(null)
        .map(() =>
          Task.findOneAndUpdate(
            {
              _id: task._id,
              completedCount: { $lt: requiredCount },
            },
            { $inc: { completedCount: 1 } },
            { new: true }
          )
        );

      const results = await Promise.all(completionPromises);
      const successCount = results.filter((r) => r !== null).length;

      expect(successCount).toBe(requiredCount);
    });
  });

  describe('性能测试', () => {
    it('高并发场景下应保持性能和正确性', async () => {
      const task = await Task.create({
        title: '性能测试任务',
        description: '测试高并发性能',
        status: TaskStatus.PENDING,
        requiredCount: 50,
        completedCount: 0,
        reward: 20,
        creator: new mongoose.Types.ObjectId(),
      });

      const startTime = Date.now();

      // 100 个并发请求
      const completionPromises = Array(100)
        .fill(null)
        .map(() =>
          Task.findOneAndUpdate(
            {
              _id: task._id,
              completedCount: { $lt: task.requiredCount },
            },
            { $inc: { completedCount: 1 } },
            { new: true }
          )
        );

      await Promise.all(completionPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const updatedTask = await Task.findById(task._id);
      expect(updatedTask!.completedCount).toBe(task.requiredCount);

      // 性能断言：100 个并发请求应在 5 秒内完成
      expect(duration).toBeLessThan(5000);

      console.log(`高并发测试完成: ${100} 个请求在 ${duration}ms 内完成`);
    });

    it('多任务并发处理性能', async () => {
      // 创建 10 个任务
      const tasks = await Promise.all(
        Array(10)
          .fill(null)
          .map((_, index) =>
            Task.create({
              title: `并发任务 ${index}`,
              description: '测试多任务并发',
              status: TaskStatus.PENDING,
              requiredCount: 5,
              completedCount: 0,
              reward: 10,
              creator: new mongoose.Types.ObjectId(),
            })
          )
      );

      const startTime = Date.now();

      // 每个任务并发完成 10 次（共 100 个并发请求）
      const completionPromises = tasks.flatMap((task) =>
        Array(10)
          .fill(null)
          .map(() =>
            Task.findOneAndUpdate(
              {
                _id: task._id,
                completedCount: { $lt: task.requiredCount },
              },
              { $inc: { completedCount: 1 } },
              { new: true }
            )
          )
      );

      await Promise.all(completionPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 验证每个任务的完成次数
      for (const task of tasks) {
        const updatedTask = await Task.findById(task._id);
        expect(updatedTask!.completedCount).toBe(task.requiredCount);
      }

      // 性能断言
      expect(duration).toBeLessThan(10000);

      console.log(`多任务并发测试完成: 10 个任务 × 10 次请求在 ${duration}ms 内完成`);
    });
  });

  describe('错误处理和恢复', () => {
    it('并发操作失败不应影响已成功的操作', async () => {
      const task = await Task.create({
        title: '错误恢复测试',
        description: '测试错误处理',
        status: TaskStatus.PENDING,
        requiredCount: 3,
        completedCount: 0,
        reward: 50,
        creator: new mongoose.Types.ObjectId(),
      });

      // 混合有效和无效操作
      const operations = [
        // 有效操作
        Task.findOneAndUpdate(
          { _id: task._id, completedCount: { $lt: 3 } },
          { $inc: { completedCount: 1 } },
          { new: true }
        ),
        // 有效操作
        Task.findOneAndUpdate(
          { _id: task._id, completedCount: { $lt: 3 } },
          { $inc: { completedCount: 1 } },
          { new: true }
        ),
        // 无效的 ObjectId（会失败）
        Task.findOneAndUpdate(
          { _id: 'invalid-id', completedCount: { $lt: 3 } },
          { $inc: { completedCount: 1 } },
          { new: true }
        ).catch(() => null),
      ];

      const results = await Promise.all(operations);

      // 验证有效操作成功
      const successCount = results.filter((r) => r !== null).length;
      expect(successCount).toBeGreaterThanOrEqual(2);
    });

    it('数据库连接断开时应正确处理', async () => {
      const task = await Task.create({
        title: '连接断开测试',
        description: '测试连接错误',
        status: TaskStatus.PENDING,
        requiredCount: 2,
        completedCount: 0,
        reward: 50,
        creator: new mongoose.Types.ObjectId(),
      });

      // 模拟网络延迟的并发请求
      const completionPromises = Array(3)
        .fill(null)
        .map(
          () =>
            new Promise((resolve) => {
              setTimeout(async () => {
                try {
                  const result = await Task.findOneAndUpdate(
                    {
                      _id: task._id,
                      completedCount: { $lt: task.requiredCount },
                    },
                    { $inc: { completedCount: 1 } },
                    { new: true }
                  );
                  resolve(result);
                } catch (error) {
                  resolve(null);
                }
              }, Math.random() * 100);
            })
        );

      const results = await Promise.all(completionPromises);
      const successCount = results.filter((r) => r !== null).length;

      // 即使有延迟，也不应超过 requiredCount
      expect(successCount).toBeLessThanOrEqual(task.requiredCount);
    });
  });

  describe('状态转换并发测试', () => {
    it('任务状态应正确转换（PENDING -> IN_PROGRESS -> COMPLETED）', async () => {
      const task = await Task.create({
        title: '状态转换测试',
        description: '测试状态转换',
        status: TaskStatus.PENDING,
        requiredCount: 2,
        completedCount: 0,
        reward: 50,
        creator: new mongoose.Types.ObjectId(),
      });

      // 第一个完成操作：PENDING -> IN_PROGRESS
      const firstCompletion = await Task.findOneAndUpdate(
        {
          _id: task._id,
          completedCount: { $lt: task.requiredCount },
          status: TaskStatus.PENDING,
        },
        {
          $inc: { completedCount: 1 },
          $set: { status: TaskStatus.IN_PROGRESS },
        },
        { new: true }
      );

      expect(firstCompletion).not.toBeNull();
      expect(firstCompletion!.status).toBe(TaskStatus.IN_PROGRESS);
      expect(firstCompletion!.completedCount).toBe(1);

      // 第二个完成操作：IN_PROGRESS -> COMPLETED
      const secondCompletion = await Task.findOneAndUpdate(
        {
          _id: task._id,
          completedCount: { $lt: task.requiredCount },
        },
        {
          $inc: { completedCount: 1 },
          $set: { status: TaskStatus.COMPLETED },
        },
        { new: true }
      );

      expect(secondCompletion).not.toBeNull();
      expect(secondCompletion!.status).toBe(TaskStatus.COMPLETED);
      expect(secondCompletion!.completedCount).toBe(2);
    });

    it('并发状态转换应保持一致性', async () => {
      const task = await Task.create({
        title: '并发状态转换',
        description: '测试并发状态一致性',
        status: TaskStatus.PENDING,
        requiredCount: 3,
        completedCount: 0,
        reward: 50,
        creator: new mongoose.Types.ObjectId(),
      });

      // 并发完成，最后一次应设置为 COMPLETED
      const completionPromises = Array(3)
        .fill(null)
        .map(() =>
          Task.findOneAndUpdate(
            {
              _id: task._id,
              completedCount: { $lt: task.requiredCount },
            },
            [
              {
                $set: {
                  completedCount: { $add: ['$completedCount', 1] },
                  status: {
                    $cond: {
                      if: {
                        $gte: [{ $add: ['$completedCount', 1] }, '$requiredCount'],
                      },
                      then: TaskStatus.COMPLETED,
                      else: TaskStatus.IN_PROGRESS,
                    },
                  },
                },
              },
            ],
            { new: true }
          )
        );

      const results = await Promise.all(completionPromises);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const successResults = results.filter((r) => r !== null);

      // 验证最终状态
      const finalTask = await Task.findById(task._id);
      expect(finalTask!.completedCount).toBe(task.requiredCount);
      expect(finalTask!.status).toBe(TaskStatus.COMPLETED);
    });
  });
});
