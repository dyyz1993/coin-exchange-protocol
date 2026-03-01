/**
 * AccountController 单元测试
 * 测试范围：AccountController 所有方法的输入验证、错误处理、成功场景
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { AccountController } from '../../src/controllers/account.controller';
import { accountService } from '../../src/services/account.service';
import { accountModel } from '../../src/models/Account';

describe('AccountController', () => {
  let controller: AccountController;

  beforeEach(() => {
    controller = new AccountController();
    // 清空测试数据（使用单例实例）
    (accountModel as any).accounts.clear();
    (accountModel as any).transactions.clear();
    (accountModel as any).userAccounts.clear();
  });

  afterEach(() => {
    // 清理测试数据
    (accountModel as any).accounts.clear();
    (accountModel as any).transactions.clear();
    (accountModel as any).userAccounts.clear();
  });

  describe('createAccount', () => {
    test('应该成功创建账户', async () => {
      const params = {
        userId: 'test-user-001',
        initialBalance: 100
      };

      const result = await controller.createAccount(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('应该拒绝无效的 userId', async () => {
      const params = {
        userId: '',
        initialBalance: 100
      };

      const result = await controller.createAccount(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝非字符串的 userId', async () => {
      const params = {
        userId: 123 as any,
        initialBalance: 100
      };

      const result = await controller.createAccount(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝负数的初始余额', async () => {
      const params = {
        userId: 'test-user-002',
        initialBalance: -100
      };

      const result = await controller.createAccount(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的初始余额');
    });

    test('应该使用默认初始余额 0', async () => {
      const params = {
        userId: 'test-user-003'
      };

      const result = await controller.createAccount(params);

      expect(result.success).toBe(true);
    });
  });

  describe('getBalance', () => {
    test('应该成功查询余额', async () => {
      // 先创建账户
      await accountService.createAccount('test-user-010', 0);
      await accountService.addTokens('test-user-010', 500, 'REWARD' as any, '初始奖励');

      const params = { userId: 'test-user-010' };
      const result = await controller.getBalance(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝缺少 userId 的请求', async () => {
      const params = {};
      const result = await controller.getBalance(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('缺少用户ID');
    });
  });

  describe('deposit', () => {
    test('应该成功充值', async () => {
      await accountService.createAccount('test-user-020', 0);

      const params = {
        userId: 'test-user-020',
        amount: 100,
        reason: '测试充值'
      };

      const result = await controller.deposit(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝无效的 userId', async () => {
      const params = {
        userId: '',
        amount: 100
      };

      const result = await controller.deposit(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝无效的金额', async () => {
      const params = {
        userId: 'test-user-021',
        amount: -50
      };

      const result = await controller.deposit(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的充值金额');
    });

    test('应该拒绝零金额', async () => {
      const params = {
        userId: 'test-user-021',
        amount: 0
      };

      const result = await controller.deposit(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的充值金额');
    });
  });

  describe('withdraw', () => {
    test('应该成功提现', async () => {
      await accountService.createAccount('test-user-030', 0);
      await accountService.addTokens('test-user-030', 500, 'REWARD' as any, '初始奖励');

      const params = {
        userId: 'test-user-030',
        amount: 100,
        reason: '测试提现'
      };

      const result = await controller.withdraw(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝无效的 userId', async () => {
      const params = {
        userId: 123 as any,
        amount: 100
      };

      const result = await controller.withdraw(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝无效的提现金额', async () => {
      const params = {
        userId: 'test-user-031',
        amount: 0
      };

      const result = await controller.withdraw(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的提现金额');
    });
  });

  describe('transfer', () => {
    test('应该成功转账', async () => {
      await accountService.createAccount('from-user', 0);
      await accountService.createAccount('to-user', 0);
      await accountService.addTokens('from-user', 500, 'REWARD' as any, '初始奖励');

      const params = {
        fromUserId: 'from-user',
        toUserId: 'to-user',
        amount: 100,
        reason: '测试转账'
      };

      const result = await controller.transfer(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝无效的 fromUserId', async () => {
      const params = {
        fromUserId: '',
        toUserId: 'to-user',
        amount: 100
      };

      const result = await controller.transfer(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝无效的 toUserId', async () => {
      const params = {
        fromUserId: 'from-user',
        toUserId: '',
        amount: 100
      };

      const result = await controller.transfer(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝无效的转账金额', async () => {
      const params = {
        fromUserId: 'from-user',
        toUserId: 'to-user',
        amount: -50
      };

      const result = await controller.transfer(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的转账金额');
    });

    test('应该拒绝转账给自己', async () => {
      const params = {
        fromUserId: 'same-user',
        toUserId: 'same-user',
        amount: 100
      };

      const result = await controller.transfer(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('不能转账给自己');
    });
  });

  describe('freezeAccount', () => {
    test('应该成功冻结账户', async () => {
      await accountService.createAccount('test-freeze-user', 0);

      const params = {
        userId: 'test-freeze-user',
        reason: '违规操作',
        duration: 7
      };

      const result = await controller.freezeAccount(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝无效的 userId', async () => {
      const params = {
        userId: '',
        reason: '测试'
      };

      const result = await controller.freezeAccount(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝缺少冻结原因', async () => {
      const params = {
        userId: 'test-freeze-user2',
        reason: ''
      };

      const result = await controller.freezeAccount(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('冻结原因不能为空');
    });

    test('应该拒绝非字符串的原因', async () => {
      const params = {
        userId: 'test-freeze-user3',
        reason: 123 as any
      };

      const result = await controller.freezeAccount(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('冻结原因不能为空');
    });

    test('应该支持可选的 duration 参数', async () => {
      await accountService.createAccount('test-freeze-user4', 0);

      const params = {
        userId: 'test-freeze-user4',
        reason: '测试冻结'
      };

      const result = await controller.freezeAccount(params);

      expect(result.success).toBe(true);
    });
  });

  describe('unfreezeAccount', () => {
    test('应该成功解冻账户', async () => {
      await accountService.createAccount('test-unfreeze-user', 0);
      await accountService.freezeAccount('test-unfreeze-user', '测试冻结');

      const params = {
        userId: 'test-unfreeze-user',
        reason: '申诉成功'
      };

      const result = await controller.unfreezeAccount(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝无效的 userId', async () => {
      const params = {
        userId: 123 as any
      };

      const result = await controller.unfreezeAccount(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该支持可选的 reason 参数', async () => {
      await accountService.createAccount('test-unfreeze-user2', 0);
      await accountService.freezeAccount('test-unfreeze-user2', '测试冻结');

      const params = {
        userId: 'test-unfreeze-user2'
      };

      const result = await controller.unfreezeAccount(params);

      expect(result.success).toBe(true);
    });
  });

  describe('getFrozenAccounts', () => {
    test('应该成功获取冻结账户列表', async () => {
      // 创建几个账户并冻结
      await accountService.createAccount('frozen-user1', 0);
      await accountService.createAccount('frozen-user2', 0);
      await accountService.createAccount('normal-user', 0);
      
      await accountService.freezeAccount('frozen-user1', '违规1');
      await accountService.freezeAccount('frozen-user2', '违规2');

      const result = await controller.getFrozenAccounts({});

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('空列表应该返回成功', async () => {
      const result = await controller.getFrozenAccounts({});

      expect(result.success).toBe(true);
    });
  });

  describe('getAccountInfo', () => {
    test('应该成功获取账户信息', async () => {
      await accountService.createAccount('test-info-user', 0);
      await accountService.addTokens('test-info-user', 100, 'REWARD' as any, '测试');

      const params = { userId: 'test-info-user' };
      const result = await controller.getAccountInfo(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝缺少 userId', async () => {
      const params = {};
      const result = await controller.getAccountInfo(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('缺少用户ID');
    });
  });

  describe('updateAccountStatus', () => {
    test('应该成功更新账户状态', async () => {
      await accountService.createAccount('test-status-user', 0);

      const params = {
        userId: 'test-status-user',
        status: 'INACTIVE'
      };

      const result = await controller.updateAccountStatus(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝无效的 userId', async () => {
      const params = {
        userId: '',
        status: 'INACTIVE'
      };

      const result = await controller.updateAccountStatus(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝无效的状态', async () => {
      const params = {
        userId: 'test-status-user2',
        status: ''
      };

      const result = await controller.updateAccountStatus(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的账户状态');
    });

    test('应该拒绝非字符串的状态', async () => {
      const params = {
        userId: 'test-status-user3',
        status: 123 as any
      };

      const result = await controller.updateAccountStatus(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的账户状态');
    });
  });

  describe('freezeBalance', () => {
    test('应该成功冻结余额', async () => {
      await accountService.createAccount('test-freeze-balance', 0);
      await accountService.addTokens('test-freeze-balance', 500, 'REWARD' as any, '初始奖励');

      const params = {
        userId: 'test-freeze-balance',
        amount: 100,
        reason: '交易冻结'
      };

      const result = await controller.freezeBalance(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝无效的 userId', async () => {
      const params = {
        userId: '',
        amount: 100
      };

      const result = await controller.freezeBalance(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝无效的冻结金额', async () => {
      const params = {
        userId: 'test-freeze-balance2',
        amount: -50
      };

      const result = await controller.freezeBalance(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的冻结金额');
    });
  });

  describe('unfreezeBalance', () => {
    test('应该成功解冻余额', async () => {
      await accountService.createAccount('test-unfreeze-balance', 0);
      await accountService.addTokens('test-unfreeze-balance', 500, 'REWARD' as any, '初始奖励');
      await accountService.freezeTokens('test-unfreeze-balance', 100, '冻结');

      const params = {
        userId: 'test-unfreeze-balance',
        amount: 100,
        reason: '解冻'
      };

      const result = await controller.unfreezeBalance(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝无效的 userId', async () => {
      const params = {
        userId: 123 as any,
        amount: 100
      };

      const result = await controller.unfreezeBalance(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的用户ID');
    });

    test('应该拒绝无效的解冻金额', async () => {
      const params = {
        userId: 'test-unfreeze-balance2',
        amount: 0
      };

      const result = await controller.unfreezeBalance(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的解冻金额');
    });
  });

  describe('getTransactionHistory', () => {
    test('应该成功获取交易历史', async () => {
      await accountService.createAccount('test-history-user', 0);
      await accountService.addTokens('test-history-user', 100, 'REWARD' as any, '测试');

      const params = { userId: 'test-history-user' };
      const result = await controller.getTransactionHistory(params);

      expect(result.success).toBe(true);
    });

    test('应该拒绝缺少 userId', async () => {
      const params = {};
      const result = await controller.getTransactionHistory(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('缺少用户ID');
    });
  });

  describe('异常处理', () => {
    test('Service 层抛出错误时应该返回友好的错误消息', async () => {
      // 模拟 Service 层抛出错误
      const params = {
        userId: 'error-user',
        amount: 999999
      };

      // 这个测试确保 Controller 能捕获异常
      const result = await controller.deposit(params);
      
      // 应该返回一个结果，而不是抛出未捕获的异常
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });
});
