/**
 * 测试 async-mutex 锁机制
 */

import { accountModel } from '../src/models/Account';
import { TransactionType } from '../src/types';

describe('async-mutex 锁机制', () => {
  beforeEach(() => {
    // 清空测试数据
    (accountModel as any).accounts.clear();
  });

  test('应该正确创建账户', async () => {
    const account = await accountModel.createAccount('user1', 1000);
    expect(account.userId).toBe('user1');
    expect(account.balance).toBe(1000);
  });

  test('应该正确增加余额', async () => {
    await accountModel.createAccount('user1', 1000);
    await accountModel.addBalance('user1', 500, '奖励', TransactionType.REWARD);
    const account = accountModel.getAccountByUserId('user1');
    expect(account?.balance).toBe(1500);
  });

  test('应该正确处理并发增加余额（锁机制）', async () => {
    await accountModel.createAccount('user1', 1000);

    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(accountModel.addBalance('user1', 100, `并发测试${i}`, TransactionType.REWARD));
    }

    await Promise.all(promises);

    const account = accountModel.getAccountByUserId('user1');
    expect(account?.balance).toBe(2000); // 1000 + 10 * 100
  });

  test('应该正确处理转账', async () => {
    await accountModel.createAccount('user1', 1000);
    await accountModel.createAccount('user2', 0);
    await accountModel.transfer('user1', 'user2', 200, '测试转账');

    const account1 = accountModel.getAccountByUserId('user1');
    const account2 = accountModel.getAccountByUserId('user2');

    expect(account1?.balance).toBe(800);
    expect(account2?.balance).toBe(200);
  });

  test('应该正确冻结余额', async () => {
    await accountModel.createAccount('user1', 1000);
    await accountModel.freezeBalance('user1', 100);

    const account = accountModel.getAccountByUserId('user1');
    expect(account?.balance).toBe(900);
    expect(account?.frozenBalance).toBe(100);
  });

  test('应该正确解冻余额', async () => {
    await accountModel.createAccount('user1', 1000);
    await accountModel.freezeBalance('user1', 100);
    await accountModel.unfreezeBalance('user1', 50);

    const account = accountModel.getAccountByUserId('user1');
    expect(account?.balance).toBe(950);
    expect(account?.frozenBalance).toBe(50);
  });
});
