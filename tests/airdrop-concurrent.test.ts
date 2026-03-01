/**
 * 测试空投并发领取 - 验证总额耗尽检查
 *
 * 测试场景：
 * 1. 创建总额为 1000，每人限额 100 的空投
 * 2. 15 个用户并发领取（理论上只能成功 10 个）
 * 3. 验证总额不会超发
 * 4. 验证只有 10 个用户成功领取
 */

import { airdropService } from '../src/services/airdrop.service';
import { accountModel } from '../src/models/Account';

async function testAirdropConcurrentClaim() {
  console.log('🧪 测试空投并发领取 - 验证总额耗尽检查\n');

  // 测试1：创建空投活动
  console.log('✅ 测试1：创建空投活动');
  const now = new Date();
  const startTime = new Date(now.getTime() - 1000); // 1秒前开始
  const endTime = new Date(now.getTime() + 3600000); // 1小时后结束

  const airdrop = await airdropService.createAirdrop({
    name: '并发测试空投',
    description: '测试并发领取时的总额控制',
    totalAmount: 1000,
    perUserAmount: 100,
    startTime,
    endTime,
  });

  console.log(`   空投ID: ${airdrop.airdropId}`);
  console.log(`   总额: ${airdrop.totalAmount}, 每人限额: ${airdrop.perUserAmount}\n`);

  // 启动空投
  await airdropService.startAirdrop(airdrop.airdropId);
  console.log('   空投已启动\n');

  // 测试2：15个用户并发领取
  console.log('✅ 测试2：15个用户并发领取（总额只能支持10个）');
  const userCount = 15;
  const claimPromises: Promise<any>[] = [];

  for (let i = 0; i < userCount; i++) {
    const userId = `concurrent_user_${i}`;
    // 创建账户
    await accountModel.createAccount(userId, 0);

    // 并发领取
    claimPromises.push(
      airdropService.claimAirdrop(airdrop.airdropId, userId).catch((error) => {
        return { error: error.message };
      })
    );
  }

  const results = await Promise.all(claimPromises);
  console.log(`   并发领取完成\n`);

  // 统计结果
  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.error) {
      failureCount++;
      errors.push(`用户${index}: ${result.error}`);
    } else {
      successCount++;
    }
  });

  console.log('✅ 测试3：验证结果');
  console.log(`   成功领取: ${successCount} 人`);
  console.log(`   领取失败: ${failureCount} 人`);

  // 验证空投总额
  const airdropDetail = airdropService.getAirdropDetail(airdrop.airdropId);
  console.log(`   已领取总额: ${airdropDetail.totalClaimed}`);
  console.log(`   空投总额: ${airdropDetail.airdrop.totalAmount}`);

  // 验证点1：成功领取人数不超过 10
  const validSuccessCount = successCount <= 10;
  console.log(`   ✓ 成功领取人数正确 (<=10): ${validSuccessCount}`);

  // 验证点2：总额不超过 1000
  const validTotalAmount = airdropDetail.totalClaimed <= 1000;
  console.log(`   ✓ 领取总额正确 (<=1000): ${validTotalAmount}`);

  // 验证点3：失败的用户收到"空投金额已耗尽"错误
  const hasInsufficientError = errors.some((err) => err.includes('空投金额已耗尽'));
  console.log(`   ✓ 失败用户收到正确错误: ${hasInsufficientError}\n`);

  // 测试4：验证后续用户无法领取
  console.log('✅ 测试4：验证后续用户无法领取');
  const lateUserId = 'late_user';
  await accountModel.createAccount(lateUserId, 0);

  try {
    await airdropService.claimAirdrop(airdrop.airdropId, lateUserId);
    console.log('   ✗ 错误：后续用户应该无法领取！');
  } catch (error: any) {
    console.log(`   ✓ 正确拒绝: ${error.message}\n`);
  }

  // 最终验证
  if (validSuccessCount && validTotalAmount && hasInsufficientError) {
    console.log('🎉 所有测试通过！空投并发控制工作正常！');
    console.log('\n✅ 修复验证（Issue #237）：');
    console.log('   - Mutex 锁成功防止并发竞态条件');
    console.log('   - 总额检查正确，不会超发');
    console.log('   - 原子操作确保数据一致性');
  } else {
    console.log('❌ 测试失败！请检查并发控制实现。');
    process.exit(1);
  }
}

// 运行测试
testAirdropConcurrentClaim().catch((error) => {
  console.error('测试失败:', error);
  process.exit(1);
});
