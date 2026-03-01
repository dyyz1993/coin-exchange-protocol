/**
 * 测试初始余额功能
 */

import { accountController } from './src/controllers/account.controller';

async function testInitialBalance() {
  console.log('=== 测试初始余额功能 ===\n');

  // 测试1: 创建账户时设置初始余额为100
  console.log('测试1: 创建账户，初始余额为100');
  const createResult = await accountController.createAccount({
    userId: 'user123',
    initialBalance: 100
  });
  console.log('创建结果:', JSON.stringify(createResult, null, 2));

  // 查询余额
  console.log('\n查询余额:');
  const balanceResult = await accountController.getBalance({ userId: 'user123' });
  console.log('余额结果:', JSON.stringify(balanceResult, null, 2));

  // 验证
  if (balanceResult.success && balanceResult.data?.balance === 100) {
    console.log('\n✅ 测试通过：初始余额设置成功！');
  } else {
    console.log('\n❌ 测试失败：初始余额未正确设置');
    console.log('预期: balance === 100');
    console.log('实际:', balanceResult.data?.balance);
  }

  // 测试2: 创建账户时不设置初始余额（默认为0）
  console.log('\n\n测试2: 创建账户，不设置初始余额');
  const createResult2 = await accountController.createAccount({
    userId: 'user456'
  });
  console.log('创建结果:', JSON.stringify(createResult2, null, 2));

  const balanceResult2 = await accountController.getBalance({ userId: 'user456' });
  console.log('余额结果:', JSON.stringify(balanceResult2, null, 2));

  if (balanceResult2.success && balanceResult2.data?.balance === 0) {
    console.log('\n✅ 测试通过：默认初始余额为0');
  } else {
    console.log('\n❌ 测试失败');
  }

  console.log('\n=== 测试完成 ===');
}

testInitialBalance().catch(console.error);
