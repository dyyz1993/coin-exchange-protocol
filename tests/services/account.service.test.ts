/**
 * 账户服务测试
 * 测试范围：账户创建、余额查询、转账、冻结/解冻
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { AccountService } from '../../src/services/account.service';
import { AccountModel } from '../../src/models/Account';
import { TokenAccountModel } from '../../src/models/TokenAccount';
import { TransactionType } from '../../src/types/token';

describe('AccountService', () => {
  let accountService: AccountService;

  beforeEach(() => {
    accountService = new AccountService();
    // 清空测试数据
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
  });

  afterEach(() => {
    // 清理测试数据
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
  });

  describe('createAccount', () => {
    test('应该成功创建新账户', async () => {
      const userId = 'test-user-001';
      const result = await accountService.createAccount(userId, {
        email: 'test@example.com',
        nickname: 'Test User'
      });

      expect(result).toBeDefined();
      expect(result.accountId).toBeDefined();
      expect(result.tokenAccountId).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test('应该同时创建代币账户', async () => {
      const userId = 'test-user-002';
      await accountService.createAccount(userId);

      const tokenBalance = accountService.getTokenBalance(userId);
      expect(tokenBalance).toBeDefined();
      expect(tokenBalance?.balance).toBe(0);
      expect(tokenBalance?.frozenBalance).toBe(0);
      expect(tokenBalance?.availableBalance).toBe(0);
    });

    test('应该支持可选的初始数据', async () => {
      const userId = 'test-user-003';
      const result = await accountService.createAccount(userId, {
        email: 'optional@example.com',
        phone: '13800138000',
        nickname: 'Optional User'
      });

      expect(result).toBeDefined();
      const accountInfo = accountService.getAccountInfo(userId);
      expect(accountInfo?.account.email).toBe('optional@example.com');
      expect(accountInfo?.account.phone).toBe('13800138000');
      expect(accountInfo?.account.nickname).toBe('Optional User');
    });
  });

  describe('getAccountInfo', () => {
    test('应该返回完整的账户信息', async () => {
      const userId = 'test-user-004';
      await accountService.createAccount(userId);
      
      // 添加一些代币
      await accountService.addTokens(userId, 100, TransactionType.REWARD, '测试奖励');

      const accountInfo = accountService.getAccountInfo(userId);
      
      expect(accountInfo).toBeDefined();
      expect(accountInfo?.account).toBeDefined();
      expect(accountInfo?.tokenBalance).toBe(100);
      expect(accountInfo?.frozenBalance).toBe(0);
      expect(accountInfo?.availableBalance).toBe(100);
    });

    test('对不存在的账户应返回 null', () => {
      const accountInfo = accountService.getAccountInfo('non-existent-user');
      expect(accountInfo).toBeNull();
    });
  });

  describe('getTokenBalance', () => {
    test('应该返回正确的余额信息', async () => {
      const userId = 'test-user-005';
      await accountService.createAccount(userId);
      
      await accountService.addTokens(userId, 500, TransactionType.REWARD, '初始奖励');
      await accountService.freezeTokens(userId, 100, '测试冻结');

      const balance = accountService.getTokenBalance(userId);
      
      expect(balance).toBeDefined();
      expect(balance?.balance).toBe(500);
      expect(balance?.frozenBalance).toBe(100);
      expect(balance?.availableBalance).toBe(400);
    });

    test('对不存在的用户应返回 null', () => {
      const balance = accountService.getTokenBalance('non-existent-user');
      expect(balance).toBeNull();
    });
  });

  describe('addTokens', () => {
    test('应该成功增加代币', async () => {
      const userId = 'test-user-006';
      await accountService.createAccount(userId);

      const result = await accountService.addTokens(
        userId,
        200,
        TransactionType.AIRDROP,
        '空投奖励',
        'airdrop-001'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(200);
      expect(result.transactionId).toBeDefined();

      const balance = accountService.getTokenBalance(userId);
      expect(balance?.balance).toBe(200);
    });

    test('应该支持多次增加代币', async () => {
      const userId = 'test-user-007';
      await accountService.createAccount(userId);

      await accountService.addTokens(userId, 100, TransactionType.REWARD, '奖励1');
      await accountService.addTokens(userId, 50, TransactionType.AIRDROP, '空投');

      const balance = accountService.getTokenBalance(userId);
      expect(balance?.balance).toBe(150);
    });

    test('应该记录交易历史', async () => {
      const userId = 'test-user-008';
      await accountService.createAccount(userId);

      await accountService.addTokens(userId, 100, TransactionType.TASK_REWARD, '任务奖励');
      
      const history = accountService.getTransactionHistory(userId);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].amount).toBe(100);
      expect(history[0].type).toBe(TransactionType.TASK_REWARD);
    });
  });

  describe('deductTokens', () => {
    test('应该成功扣除代币', async () => {
      const userId = 'test-user-009';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 200, TransactionType.REWARD, '初始奖励');

      const result = await accountService.deductTokens(
        userId,
        50,
        TransactionType.PENALTY,
        '惩罚扣除'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);

      const balance = accountService.getTokenBalance(userId);
      expect(balance?.balance).toBe(150);
    });

    test('应该在余额不足时抛出错误', async () => {
      const userId = 'test-user-010';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 50, TransactionType.REWARD, '初始奖励');

      expect(async () => {
        await accountService.deductTokens(userId, 100, TransactionType.PENALTY, '超额扣除');
      }).toThrow();
    });

    test('扣除后应更新交易历史', async () => {
      const userId = 'test-user-011';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 200, TransactionType.REWARD, '初始奖励');

      await accountService.deductTokens(userId, 50, TransactionType.PENALTY, '惩罚');
      
      const history = accountService.getTransactionHistory(userId);
      const deductTx = history.find(tx => tx.amount < 0);
      expect(deductTx).toBeDefined();
      expect(deductTx?.amount).toBe(-50);
    });
  });

  describe('freezeTokens', () => {
    test('应该成功冻结代币', async () => {
      const userId = 'test-user-012';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 500, TransactionType.REWARD, '初始奖励');

      const result = await accountService.freezeTokens(userId, 200, '交易冻结', 'tx-001');

      expect(result.success).toBe(true);
      expect(result.frozenAmount).toBe(200);
      expect(result.availableBalance).toBe(300);

      const balance = accountService.getTokenBalance(userId);
      expect(balance?.frozenBalance).toBe(200);
      expect(balance?.availableBalance).toBe(300);
    });

    test('应该拒绝冻结超过可用余额的金额', async () => {
      const userId = 'test-user-013';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 100, TransactionType.REWARD, '初始奖励');

      expect(async () => {
        await accountService.freezeTokens(userId, 200, '超额冻结');
      }).toThrow();
    });
  });

  describe('unfreezeTokens', () => {
    test('应该成功解冻代币', async () => {
      const userId = 'test-user-014';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 500, TransactionType.REWARD, '初始奖励');
      await accountService.freezeTokens(userId, 200, '冻结');

      const result = await accountService.unfreezeTokens(userId, 200, '解冻');

      expect(result.success).toBe(true);
      expect(result.unfrozenAmount).toBe(200);
      expect(result.availableBalance).toBe(500);

      const balance = accountService.getTokenBalance(userId);
      expect(balance?.frozenBalance).toBe(0);
      expect(balance?.availableBalance).toBe(500);
    });

    test('应该拒绝解冻超过冻结余额的金额', async () => {
      const userId = 'test-user-015';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 500, TransactionType.REWARD, '初始奖励');
      await accountService.freezeTokens(userId, 100, '冻结');

      expect(async () => {
        await accountService.unfreezeTokens(userId, 200, '超额解冻');
      }).toThrow();
    });
  });

  describe('transfer', () => {
    test('应该成功在用户间转账', async () => {
      const fromUserId = 'test-user-016';
      const toUserId = 'test-user-017';
      
      await accountService.createAccount(fromUserId);
      await accountService.createAccount(toUserId);
      await accountService.addTokens(fromUserId, 500, TransactionType.REWARD, '初始奖励');

      const result = await accountService.transfer(
        fromUserId,
        toUserId,
        100,
        '测试转账'
      );

      expect(result.success).toBe(true);
      expect(result.fromNewBalance).toBe(400);
      expect(result.toNewBalance).toBe(100);
      expect(result.transactionId).toBeDefined();
    });

    test('应该在余额不足时拒绝转账', async () => {
      const fromUserId = 'test-user-018';
      const toUserId = 'test-user-019';
      
      await accountService.createAccount(fromUserId);
      await accountService.createAccount(toUserId);
      await accountService.addTokens(fromUserId, 50, TransactionType.REWARD, '初始奖励');

      expect(async () => {
        await accountService.transfer(fromUserId, toUserId, 100, '超额转账');
      }).toThrow('余额不足');
    });

    test('应该考虑冻结余额', async () => {
      const fromUserId = 'test-user-020';
      const toUserId = 'test-user-021';
      
      await accountService.createAccount(fromUserId);
      await accountService.createAccount(toUserId);
      await accountService.addTokens(fromUserId, 500, TransactionType.REWARD, '初始奖励');
      await accountService.freezeTokens(fromUserId, 400, '冻结');

      expect(async () => {
        await accountService.transfer(fromUserId, toUserId, 200, '超额转账');
      }).toThrow('余额不足');
    });

    test('转账应记录交易历史', async () => {
      const fromUserId = 'test-user-022';
      const toUserId = 'test-user-023';
      
      await accountService.createAccount(fromUserId);
      await accountService.createAccount(toUserId);
      await accountService.addTokens(fromUserId, 500, TransactionType.REWARD, '初始奖励');

      await accountService.transfer(fromUserId, toUserId, 100, '测试转账');
      
      const fromHistory = accountService.getTransactionHistory(fromUserId);
      const toHistory = accountService.getTransactionHistory(toUserId);
      
      const transferOut = fromHistory.find(tx => tx.type === TransactionType.TRANSFER_OUT);
      const transferIn = toHistory.find(tx => tx.type === TransactionType.TRANSFER_IN);
      
      expect(transferOut).toBeDefined();
      expect(transferIn).toBeDefined();
    });
  });

  describe('hasEnoughBalance', () => {
    test('应该正确判断余额充足', async () => {
      const userId = 'test-user-024';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 500, TransactionType.REWARD, '初始奖励');

      expect(accountService.hasEnoughBalance(userId, 300)).toBe(true);
      expect(accountService.hasEnoughBalance(userId, 500)).toBe(true);
      expect(accountService.hasEnoughBalance(userId, 600)).toBe(false);
    });

    test('应该考虑冻结余额', async () => {
      const userId = 'test-user-025';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 500, TransactionType.REWARD, '初始奖励');
      await accountService.freezeTokens(userId, 200, '冻结');

      expect(accountService.hasEnoughBalance(userId, 300)).toBe(true);
      expect(accountService.hasEnoughBalance(userId, 400)).toBe(false);
    });

    test('对不存在的用户应返回 false', () => {
      expect(accountService.hasEnoughBalance('non-existent', 100)).toBe(false);
    });
  });

  describe('getAccountStats', () => {
    test('应该返回正确的统计数据', async () => {
      const userId = 'test-user-026';
      await accountService.createAccount(userId);
      
      await accountService.addTokens(userId, 100, TransactionType.REWARD, '奖励1');
      await accountService.addTokens(userId, 200, TransactionType.AIRDROP, '空投');
      await accountService.deductTokens(userId, 50, TransactionType.PENALTY, '惩罚');

      const stats = accountService.getAccountStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats?.totalTransactions).toBe(3);
      expect(stats?.totalEarned).toBe(300);
      expect(stats?.totalSpent).toBe(50);
      expect(stats?.accountAge).toBeGreaterThanOrEqual(0);
    });

    test('对不存在的用户应返回 null', () => {
      const stats = accountService.getAccountStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('updateAccountInfo', () => {
    test('应该成功更新账户信息', async () => {
      const userId = 'test-user-027';
      await accountService.createAccount(userId);

      const updated = accountService.updateAccountInfo(userId, {
        email: 'new@example.com',
        nickname: 'New Name',
        avatar: 'https://example.com/avatar.png'
      });

      expect(updated.email).toBe('new@example.com');
      expect(updated.nickname).toBe('New Name');
      expect(updated.avatar).toBe('https://example.com/avatar.png');
    });
  });

  describe('deactivateAccount & activateAccount', () => {
    test('应该成功停用账户', async () => {
      const userId = 'test-user-028';
      await accountService.createAccount(userId);

      const result = await accountService.deactivateAccount(userId, '违规操作');
      expect(result).toBe(true);

      const accountInfo = accountService.getAccountInfo(userId);
      expect(accountInfo?.account.status).toBe('INACTIVE');
    });

    test('应该成功激活账户', async () => {
      const userId = 'test-user-029';
      await accountService.createAccount(userId);
      await accountService.deactivateAccount(userId, '测试');

      const result = await accountService.activateAccount(userId);
      expect(result).toBe(true);

      const accountInfo = accountService.getAccountInfo(userId);
      expect(accountInfo?.account.status).toBe('ACTIVE');
    });

    test('对不存在的账户应抛出错误', async () => {
      expect(async () => {
        await accountService.deactivateAccount('non-existent', '测试');
      }).toThrow('账户不存在');
    });
  });

  describe('边界条件测试', () => {
    test('应该处理零金额操作', async () => {
      const userId = 'test-user-030';
      await accountService.createAccount(userId);

      // 添加 0 金额
      const result = await accountService.addTokens(userId, 0, TransactionType.REWARD, '零金额');
      expect(result.newBalance).toBe(0);
    });

    test('应该处理极大金额', async () => {
      const userId = 'test-user-031';
      await accountService.createAccount(userId);

      const largeAmount = Number.MAX_SAFE_INTEGER / 2;
      const result = await accountService.addTokens(userId, largeAmount, TransactionType.REWARD, '大金额');
      expect(result.newBalance).toBe(largeAmount);
    });

    test('应该处理并发操作', async () => {
      const userId = 'test-user-032';
      await accountService.createAccount(userId);

      // 模拟并发添加代币
      const promises = Array(10).fill(null).map((_, i) => 
        accountService.addTokens(userId, 10, TransactionType.REWARD, `并发${i}`)
      );

      await Promise.all(promises);

      const balance = accountService.getTokenBalance(userId);
      expect(balance?.balance).toBe(100);
    });
  });
});
