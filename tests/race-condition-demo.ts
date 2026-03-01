/**
 * 竞态条件演示脚本
 *
 * 这个脚本演示 TaskModel.createCompletion() 中的竞态条件问题
 */

import { TaskModel } from '../src/models/Task';
import { TaskStatus } from '../src/types';

console.log('======================================');
console.log('竞态条件验证测试');
console.log('======================================\n');

const taskModel = new TaskModel();

// 创建任务
const task = taskModel.createTask({
  title: '竞态条件测试任务',
  description: '测试并发场景下的完成次数限制',
  reward: 100,
  maxCompletions: 5,
  startTime: new Date(Date.now() - 1000),
  endTime: new Date(Date.now() + 86400000),
});

console.log('✅ 任务创建成功');
console.log(`   ID: ${task.id}`);
console.log(`   最大完成次数: ${task.maxCompletions}`);
console.log(`   奖励: ${task.reward} 金币\n`);

// 激活任务
taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);
console.log('✅ 任务已激活\n');

// 模拟并发请求
console.log('开始模拟 20 个并发完成请求...\n');

const startTime = Date.now();
const promises: Promise<{ success: boolean; userId: string; error?: string }>[] = [];

for (let i = 0; i < 20; i++) {
  const promise = new Promise<{ success: boolean; userId: string; error?: string }>((resolve) => {
    // 使用极短的随机延迟来模拟并发
    setTimeout(() => {
      try {
        taskModel.createCompletion(task.id, `user_${i}`);
        resolve({ success: true, userId: `user_${i}` });
        console.log(`  ✅ User ${i} 完成成功`);
      } catch (error: any) {
        resolve({ success: false, userId: `user_${i}`, error: error.message });
        console.log(`  ❌ User ${i} 完成失败: ${error.message}`);
      }
    }, Math.random() * 5); // 0-5ms 随机延迟
  });
  promises.push(promise);
}

// 等待所有请求完成
Promise.all(promises).then((results) => {
  const duration = Date.now() - startTime;
  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;
  const finalTask = taskModel.getTask(task.id);

  console.log('\n======================================');
  console.log('测试结果');
  console.log('======================================');
  console.log(`⏱️  耗时: ${duration}ms`);
  console.log(`✅ 成功次数: ${successCount}`);
  console.log(`❌ 失败次数: ${failedCount}`);
  console.log(`🎯 预期最大次数: ${task.maxCompletions}`);
  console.log(`📊 实际完成次数: ${finalTask?.currentCompletions}`);
  console.log('======================================\n');

  // 检查是否超过限制
  if (successCount > task.maxCompletions) {
    console.error('🔴🔴🔴 Bug 确认 🔴🔴🔴');
    console.error(`完成次数 ${successCount} 超过了限制 ${task.maxCompletions}！`);
    console.error(`超额完成: ${successCount - task.maxCompletions} 次`);
    console.error(`超额发放奖励: ${(successCount - task.maxCompletions) * task.reward} 金币`);
    console.error('\n这证实了并发竞态条件 Bug 的存在！');
    console.error('建议修复方案：');
    console.error('  1. 使用乐观锁（版本号）');
    console.error('  2. 使用数据库事务和原子操作');
    console.error('  3. 使用分布式锁（Redis）');
    process.exit(1);
  } else {
    console.log('✅ 并发控制正常，未超过限制');
    process.exit(0);
  }
});
