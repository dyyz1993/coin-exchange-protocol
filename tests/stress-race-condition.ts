/**
 * 压力测试 - 竞态条件验证
 *
 * 使用更激进的策略来验证竞态条件
 */

import { TaskModel } from '../src/models/Task';
import { TaskStatus } from '../src/types';

console.log('======================================');
console.log('竞态条件压力测试');
console.log('======================================\n');

// 测试多次以增加发现竞态条件的概率
const testRuns = 10;
let bugDetected = false;

async function runTest(iteration: number): Promise<boolean> {
  const taskModel = new TaskModel();

  // 创建任务
  const task = taskModel.createTask({
    title: `压力测试 ${iteration}`,
    description: '测试并发场景下的完成次数限制',
    reward: 100,
    maxCompletions: 3, // 降低限制，增加竞争
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 86400000),
  });

  // 激活任务
  taskModel.updateTaskStatus(task.id, TaskStatus.ACTIVE);

  // 使用更激进的并发策略：100个请求，几乎同时到达
  const promises: Promise<{ success: boolean; userId: string }>[] = [];

  for (let i = 0; i < 100; i++) {
    const promise = new Promise<{ success: boolean; userId: string }>((resolve) => {
      // 极短延迟，几乎同时到达
      setTimeout(() => {
        try {
          taskModel.createCompletion(task.id, `user_${i}`);
          resolve({ success: true, userId: `user_${i}` });
        } catch (error) {
          resolve({ success: false, userId: `user_${i}` });
        }
      }, Math.random() * 1); // 0-1ms 极短延迟
    });
    promises.push(promise);
  }

  const results = await Promise.all(promises);
  const successCount = results.filter((r) => r.success).length;
  const finalTask = taskModel.getTask(task.id);

  console.log(
    `测试 #${iteration}: 成功=${successCount}, 限制=${task.maxCompletions}, 实际=${finalTask?.currentCompletions}`
  );

  // 检查是否超过限制
  if (successCount > task.maxCompletions) {
    console.error(`\n🔴 Bug 检测！测试 #${iteration}`);
    console.error(`   超额完成: ${successCount - task.maxCompletions} 次`);
    console.error(`   超额奖励: ${(successCount - task.maxCompletions) * task.reward} 金币`);
    return true;
  }

  return false;
}

(async () => {
  console.log('开始运行 10 轮压力测试...\n');

  for (let i = 1; i <= testRuns; i++) {
    const hasBug = await runTest(i);
    if (hasBug) {
      bugDetected = true;
      break;
    }
  }

  console.log('\n======================================');
  if (bugDetected) {
    console.error('🔴 结论: 检测到并发竞态条件 Bug！');
    console.error('建议修复方案：');
    console.error('  1. 使用乐观锁（版本号）');
    console.error('  2. 使用数据库事务和原子操作');
    console.error('  3. 使用分布式锁（Redis）');
    process.exit(1);
  } else {
    console.log('✅ 结论: 未检测到竞态条件问题');
    console.log('   (可能是 JavaScript 单线程特性导致的)');
    console.log('   建议: 在生产环境使用数据库事务确保原子性');
    process.exit(0);
  }
})();
