/**
 * FreezeService 单元测试
 * 验证 Issue #290 修复：getAvailableBalance 计算逻辑
 */

import { freezeService } from '../../src/services/freeze.service';
import { accountModel } from '../../src/models/Account';

describe('FreezeService - getAvailableBalance', () => {
  const testUserId = 'test-user-balance';
  const initialBalance = 100;

  beforeEach(() => {
    // 重置测试环境
    const existingAccount = accountModel.getAccountByUserId(testUserId);
    if (!existingAccount) {
      accountModel.createAccount(testUserId, initialBalance);
    }
  });

  it('✅ 应该正确计算可用余额（总余额 - 冻结金额）', () => {
    // 场景：用户余额 100，冻结 30 → 可用余额应该是 70
    const userId = 'user-100-30';
    accountModel.createAccount(userId, 100);

    // 冻结 30
    accountModel.freezeBalance(userId, 30);

    const available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(70);
  });

  it('✅ 应该正确处理无冻结的情况', () => {
    // 场景：用户余额 100，冻结 0 → 可用余额应该是 100
    const userId = 'user-100-0';
    accountModel.createAccount(userId, 100);

    const available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(100);
  });

  it('✅ 应该正确处理全部冻结的情况', () => {
    // 场景：用户余额 100，冻结 100 → 可用余额应该是 0
    const userId = 'user-100-100';
    accountModel.createAccount(userId, 100);

    // 冻结 100
    accountModel.freezeBalance(userId, 100);

    const available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(0);
  });

  it('✅ 应该防止负数余额（数据异常保护）', () => {
    // 场景：数据异常 - 冻结金额超过总余额
    // 虽然正常逻辑不应该出现，但需要防护
    const userId = 'user-negative-test';
    accountModel.createAccount(userId, 50);

    // 模拟异常：强制设置冻结金额大于余额（通过直接操作）
    const account = accountModel.getAccountByUserId(userId);
    if (account) {
      // 模拟异常数据
      accountModel.freezeBalance(userId, 80);
    }

    // 应该返回 0，而不是 -30
    const available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(0);
    expect(available).toBeGreaterThanOrEqual(0);
  });

  it('✅ 不存在的用户应该返回 0', () => {
    const available = freezeService.getAvailableBalance('non-existent-user');
    expect(available).toBe(0);
  });

  it('✅ 多次冻结应该累加冻结金额', () => {
    // 场景：用户余额 100，先冻结 20，再冻结 30 → 可用余额应该是 50
    const userId = 'user-multi-freeze';
    accountModel.createAccount(userId, 100);

    // 第一次冻结 20
    accountModel.freezeBalance(userId, 20);
    let available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(80);

    // 第二次冻结 30
    accountModel.freezeBalance(userId, 30);
    available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(50);
  });

  it('✅ 解冻后可用余额应该恢复', () => {
    // 场景：用户余额 100，冻结 40，解冻 20 → 可用余额应该是 80
    const userId = 'user-unfreeze-test';
    accountModel.createAccount(userId, 100);

    // 冻结 40
    accountModel.freezeBalance(userId, 40);
    let available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(60);

    // 解冻 20
    accountModel.unfreezeBalance(userId, 20);
    available = freezeService.getAvailableBalance(userId);
    expect(available).toBe(80);
  });
});

describe('FreezeService - canFreeze', () => {
  it('✅ 应该正确判断是否可以冻结（考虑已冻结金额）', () => {
    const userId = 'user-can-freeze';
    accountModel.createAccount(userId, 100);

    // 冻结 30
    accountModel.freezeBalance(userId, 30);

    // 可用余额 70，可以冻结 50
    expect(freezeService.canFreeze(userId, 50)).toBe(true);

    // 可用余额 70，不能冻结 80
    expect(freezeService.canFreeze(userId, 80)).toBe(false);

    // 可用余额 70，正好冻结 70
    expect(freezeService.canFreeze(userId, 70)).toBe(true);
  });
});
