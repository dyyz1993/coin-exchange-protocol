/**
 * 简单的竞态条件验证测试
 */

import { TaskModel } from '../../src/models/Task';
import { TaskStatus } from '../../src/types';

describe('简单竞态条件验证', () => {
  let taskModel: TaskModel;

  beforeEach(() => {
    taskModel = new TaskModel();
  });

  it('基础功能验证', () => {
    // 创建任务
    const task = taskModel.createTask({
      title: '测试任务',
      description: '测试',
      reward: 10,
      maxCompletions: 5,
      startTime: new Date(Date.now() - 1000), // 1秒前开始
      endTime: new Date(Date.now() + 86400000), // 1天后结束
    });

    console.log('任务创建成功:', {
      id: task.id,
      status: task.status,
      startTime: task.startTime,
      endTime: task.endTime,
      maxCompletions: task.maxCompletions,
    });

    // 更新状态为 ACTIVE
    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    // 重新获取任务
    const updatedTask = taskModel.getTask(task.id);
    console.log('更新后的任务状态:', updatedTask?.status);

    // 尝试创建完成记录
    try {
      const completion = taskModel.createCompletion(task.id, 'user_1');
      console.log('✅ 第一次完成成功:', completion.id);
    } catch (error: any) {
      console.error('❌ 第一次完成失败:', error.message);
    }

    // 获取任务状态
    const finalTask = taskModel.getTask(task.id);
    console.log('最终任务状态:', {
      currentCompletions: finalTask?.currentCompletions,
      maxCompletions: finalTask?.maxCompletions,
    });

    expect(finalTask?.currentCompletions).toBe(1);
  });

  it('🔴 竞态条件验证：并发完成可能超限', async () => {
    // 创建任务
    const task = taskModel.createTask({
      title: '并发测试',
      description: '测试并发',
      reward: 10,
      maxCompletions: 5,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 86400000),
    });

    // 激活任务
    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    console.log('\n========================================');
    console.log('开始并发测试...');
    console.log('任务 ID:', task.id);
    console.log('最大完成次数:', task.maxCompletions);
    console.log('========================================\n');

    // 模拟 20 个并发请求
    const promises: Promise<{ success: boolean; userId: string; error?: string }>[] = [];

    for (let i = 0; i < 20; i++) {
      const promise = new Promise<{ success: boolean; userId: string; error?: string }>(
        (resolve) => {
          // 使用 setTimeout 模拟并发（极短延迟）
          setTimeout(() => {
            try {
              taskModel.createCompletion(task.id, `user_${i}`);
              resolve({ success: true, userId: `user_${i}` });
            } catch (error: any) {
              resolve({ success: false, userId: `user_${i}`, error: error.message });
            }
          }, Math.random() * 2); // 0-2ms 随机延迟
        }
      );
      promises.push(promise);
    }

    // 等待所有并发请求完成
    const results = await Promise.all(promises);

    // 统计结果
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;
    const finalTask = taskModel.getTask(task.id);

    console.log('\n========================================');
    console.log('🔴 并发测试结果：');
    console.log('========================================');
    console.log(`✅ 成功次数: ${successCount}`);
    console.log(`❌ 失败次数: ${failedCount}`);
    console.log(`🎯 预期最大次数: ${task.maxCompletions}`);
    console.log(`📊 实际完成次数: ${finalTask?.currentCompletions}`);
    console.log('========================================\n');

    // 输出失败原因
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0 && failures.length < 5) {
      console.log('失败原因示例:');
      failures.forEach((f) => {
        console.log(`  - ${f.userId}: ${f.error}`);
      });
    }

    // 🔴 关键验证：检查是否超过限制
    if (successCount > task.maxCompletions) {
      console.error('\n🔴🔴🔴 Bug 确认 🔴🔴🔴');
      console.error(`完成次数 ${successCount} 超过了限制 ${task.maxCompletions}！`);
      console.error(`超额完成: ${successCount - task.maxCompletions} 次`);
      console.error(`超额发放奖励: ${(successCount - task.maxCompletions) * task.reward} 金币`);
      console.error('这证实了并发竞态条件 Bug 的存在！\n');
    } else {
      console.log('✅ 并发控制正常，未超过限制');
    }

    // 测试应该通过（即使有 Bug 也记录下来）
    expect(successCount).toBeGreaterThan(0);
    expect(finalTask?.currentCompletions).toBe(successCount);

    // ⚠️ 注意：这个断言可能会因为竞态条件而失败
    // expect(successCount).toBeLessThanOrEqual(task.maxCompletions);
  });

  it('对照组：顺序执行', () => {
    const task = taskModel.createTask({
      title: '顺序测试',
      description: '测试',
      reward: 10,
      maxCompletions: 5,
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 86400000),
    });

    taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

    let successCount = 0;
    for (let i = 0; i < 10; i++) {
      try {
        taskModel.createCompletion(task.id, `user_${i}`);
        successCount++;
      } catch (error) {
        // 预期会失败
      }
    }

    const finalTask = taskModel.getTask(task.id);
    console.log('\n========================================');
    console.log('✅ 顺序执行测试结果：');
    console.log('========================================');
    console.log(`成功次数: ${successCount}`);
    console.log(`预期次数: ${task.maxCompletions}`);
    console.log(`实际完成次数: ${finalTask?.currentCompletions}`);
    console.log('========================================\n');

    // 顺序执行应该精确控制
    expect(successCount).toBe(task.maxCompletions);
    expect(finalTask?.currentCompletions).toBe(task.maxCompletions);
  });
});
