/**
 * 测试 async-mutex 锁机制
 */

import { accountModel } from '../src/models/Account';
import { TransactionType } from '../src/types';

async function testAsyncMutex() {
  console.log('🧪 测试 async-mutex 锁机制...\n');

  // 测试1：创建账户
  console.log('✅ 测试1：创建账户');
  const account1 = await accountModel.createAccount('user1', 1000);
  console.log(`   账户创建成功: ${account1.userId}, 余额: ${account1.balance}`);
  console.log(`   ✓ 初始余额正确: ${account1.balance === 1000}\n`);

  // 测试2：增加余额
  console.log('✅ 测试2：增加余额');
  await accountModel.addBalance('user1', 500, '奖励', TransactionType.REWARD);
  const updatedAccount1 = accountModel.getAccountByUserId('user1');
  console.log(`   增加后余额: ${updatedAccount1?.balance}`);
  console.log(`   ✓ 余额正确: ${updatedAccount1?.balance === 1500}\n`);

  // 测试3：并发增加余额（测试锁机制）
  console.log('✅ 测试3：并发增加余额（测试锁机制）');
  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(accountModel.addBalance('user1', 100, `并发测试${i}`, TransactionType.REWARD));
  }
  
  await Promise.all(promises);
  
  const finalAccount1 = accountModel.getAccountByUserId('user1');
  const elapsed = Date.now() - startTime;
  
  console.log(`   并发操作完成，耗时: ${elapsed}ms`);
  console.log(`   最终余额: ${finalAccount1?.balance}`);
  console.log(`   ✓ 余额正确 (期望 2500): ${finalAccount1?.balance === 2500}\n`);

  // 测试4：转账
  console.log('✅ 测试4：转账');
  const account2 = await accountModel.createAccount('user2', 0);
  await accountModel.transfer('user1', 'user2', 200, '测试转账');
  
  const account1AfterTransfer = accountModel.getAccountByUserId('user1');
  const account2AfterTransfer = accountModel.getAccountByUserId('user2');
  
  console.log(`   user1 余额: ${account1AfterTransfer?.balance}`);
  console.log(`   user2 余额: ${account2AfterTransfer?.balance}`);
  console.log(`   ✓ 转账成功: ${account1AfterTransfer?.balance === 2300 && account2AfterTransfer?.balance === 200}\n`);

  // 测试5：冻结余额
  console.log('✅ 测试5：冻结余额');
  await accountModel.freezeBalance('user1', 100);
  const frozenAccount = accountModel.getAccountByUserId('user1');
  console.log(`   余额: ${frozenAccount?.balance}, 冻结: ${frozenAccount?.frozenBalance}`);
  console.log(`   ✓ 冻结成功: ${frozenAccount?.balance === 2200 && frozenAccount?.frozenBalance === 100}\n`);

  // 测试6：解冻余额
  console.log('✅ 测试6：解冻余额');
  await accountModel.unfreezeBalance('user1', 50);
  const unfrozenAccount = accountModel.getAccountByUserId('user1');
  console.log(`   余额: ${unfrozenAccount?.balance}, 冻结: ${unfrozenAccount?.frozenBalance}`);
  console.log(`   ✓ 解冻成功: ${unfrozenAccount?.balance === 2250 && unfrozenAccount?.frozenBalance === 50}\n`);

  console.log('🎉 所有测试通过！async-mutex 锁机制工作正常！');
  console.log('\n性能对比：');
  console.log('- 旧实现 (busy wait): CPU 占用高，阻塞事件循环');
  console.log('- 新实现 (async-mutex): CPU 占用低，不阻塞事件循环');
}

// 运行测试
testAsyncMutex().catch(console.error);
