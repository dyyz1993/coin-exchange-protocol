/**
 * 账户服务测试 - 测试账户创建、余额管理、转账等功能
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { AccountService } from '../src/services/account.service';

describe('账户服务测试', () => {
  let accountService: AccountService;

  beforeEach(() => {
    accountService = new AccountService();
  });

  describe('账户创建', () => {
    test('应该成功创建新用户账户', async () => {
      const result = await accountService.createAccount('user1', {
        email: 'user1@example.com',
        nickname: 'Test User'
      });

      expect(result).toBeDefined();
      expect(result.accountId).toBeDefined();
      expect(result.tokenAccountId).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test('创建账户后应该能查询到账户信息', async () => {
      await accountService.createAccount('user2');
      const accountInfo = accountService.getAccountInfo('user2');

      expect(accountInfo).not.toBeNull();
      expect(accountInfo?.account.userId).toBe('user2');
      expect(accountInfo?.tokenBalance).toBe(0);
    });
  });

  describe('余额查询', () => {
    test('未创建账户的用户查询余额应返回 null', () => {
      const balance = accountService.getTokenBalance('nonexistent');
      expect(balance).toBeNull();
    });

    test('新账户余额应该为 0', async () => {
      await accountService.createAccount('user3');
      const balance = accountService.getTokenBalance('user3');

      expect(balance).not.toBeNull();
      expect(balance?.balance).toBe(0);
      expect(balance?.frozenBalance).toBe(0);
      expect(balance?.availableBalance).toBe(0);
    });
  });

  describe('代币操作', () => {
    test('应该成功增加代币', async () => {
      await accountService.createAccount('user4');
      const result = await accountService.addTokens(
        'user4',
        100,
        'REWARD' as any,
        '测试奖励'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(100);
      expect(result.transactionId).toBeDefined();

      const balance = accountService.getTokenBalance('user4');
      expect(balance?.balance).toBe(100);
    });

    test('应该成功扣除代币', async () => {
      await accountService.createAccount('user5');
      await accountService.addTokens('user5', 100, 'REWARD' as any, '初始奖励');

      const result = await accountService.deductTokens(
        'user5',
        30,
        'PURCHASE' as any,
        '购买商品'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(70);
    });

    test('扣除超过余额的代币应该失败', async () => {
      await accountService.createAccount('user6');
      await accountService.addTokens('user6', 50, 'REWARD' as any, '初始奖励');

      expect(async () => {
        await accountService.deductTokens('user6', 100, 'PURCHASE' as any, '超额购买');
      }).toThrow();
    });
  });

  describe('冻结/解冻功能', () => {
    test('应该成功冻结代币', async () => {
      await accountService.createAccount('user7');
      await accountService.addTokens('user7', 100, 'REWARD' as any, '初始奖励');

      const result = await accountService.freezeTokens('user7', 50, '交易冻结');

      expect(result.success).toBe(true);
      expect(result.frozenAmount).toBe(50);
      expect(result.availableBalance).toBe(50);

      const balance = accountService.getTokenBalance('user7');
      expect(balance?.balance).toBe(100);
      expect(balance?.frozenBalance).toBe(50);
      expect(balance?.availableBalance).toBe(50);
    });

    test('应该成功解冻代币', async () => {
      await accountService.createAccount('user8');
      await accountService.addTokens('user8', 100, 'REWARD' as any, '初始奖励');
      await accountService.freezeTokens('user8', 50, '交易冻结');

      const result = await accountService.unfreezeTokens('user8', 30, '交易完成');

      expect(result.success).toBe(true);
      expect(result.unfrozenAmount).toBe(30);
      expect(result.availableBalance).toBe(80);

      const balance = accountService.getTokenBalance('user8');
      expect(balance?.frozenBalance).toBe(20);
    });
  });

  describe('转账功能', () => {
    test('应该成功在用户之间转账', async () => {
      await accountService.createAccount('sender');
      await accountService.createAccount('receiver');
      await accountService.addTokens('sender', 100, 'REWARD' as any, '初始奖励');

      const result = await accountService.transfer(
        'sender',
        'receiver',
        30,
        '测试转账'
      );

      expect(result.success).toBe(true);
      expect(result.fromNewBalance).toBe(70);
      expect(result.toNewBalance).toBe(30);

      const senderBalance = accountService.getTokenBalance('sender');
      const receiverBalance = accountService.getTokenBalance('receiver');

      expect(senderBalance?.balance).toBe(70);
      expect(receiverBalance?.balance).toBe(30);
    });

    test('余额不足时转账应该失败', async () => {
      await accountService.createAccount('poor_sender');
      await accountService.createAccount('receiver2');
      await accountService.addTokens('poor_sender', 10, 'REWARD' as any, '少量奖励');

      expect(async () => {
        await accountService.transfer('poor_sender', 'receiver2', 100, '超额转账');
      }).toThrow('余额不足');
    });
  });

  describe('余额检查', () => {
    test('应该正确检查余额是否充足', async () => {
      await accountService.createAccount('user9');
      await accountService.addTokens('user9', 100, 'REWARD' as any, '初始奖励');

      expect(accountService.hasEnoughBalance('user9', 50)).toBe(true);
      expect(accountService.hasEnoughBalance('user9', 100)).toBe(true);
      expect(accountService.hasEnoughBalance('user9', 150)).toBe(false);
    });

    test('冻结余额后可用余额应该正确计算', async () => {
      await accountService.createAccount('user10');
      await accountService.addTokens('user10', 100, 'REWARD' as any, '初始奖励');
      await accountService.freezeTokens('user10', 60, '冻结');

      expect(accountService.hasEnoughBalance('user10', 40)).toBe(true);
      expect(accountService.hasEnoughBalance('user10', 50)).toBe(false);
    });
  });

  describe('交易记录', () => {
    test('应该能查询交易记录', async () => {
      await accountService.createAccount('user11');
      await accountService.addTokens('user11', 100, 'REWARD' as any, '奖励1');
      await accountService.addTokens('user11', 50, 'AIRDROP' as any, '空投');
      await accountService.deductTokens('user11', 30, 'PURCHASE' as any, '购买');

      const history = accountService.getTransactionHistory('user11');
      expect(history.length).toBe(3);
    });

    test('应该能按类型筛选交易记录', async () => {
      await accountService.createAccount('user12');
      await accountService.addTokens('user12', 100, 'REWARD' as any, '奖励');
      await accountService.addTokens('user12', 50, 'AIRDROP' as any, '空投');

      const rewardHistory = accountService.getTransactionHistory('user12', {
        type: 'REWARD' as any
      });
      expect(rewardHistory.length).toBe(1);
    });
  });

  describe('账户统计', () => {
    test('应该能获取账户统计信息', async () => {
      await accountService.createAccount('user13');
      await accountService.addTokens('user13', 100, 'REWARD' as any, '奖励1');
      await accountService.addTokens('user13', 50, 'AIRDROP' as any, '空投');
      await accountService.deductTokens('user13', 30, 'PURCHASE' as any, '购买');

      const stats = accountService.getAccountStats('user13');

      expect(stats).not.toBeNull();
      expect(stats?.totalTransactions).toBe(3);
      expect(stats?.totalEarned).toBe(150);
      expect(stats?.totalSpent).toBe(30);
      expect(stats?.accountAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('账户状态管理', () => {
    test('应该能停用账户', async () => {
      await accountService.createAccount('user14');
      const result = await accountService.deactivateAccount('user14', '违规操作');
      expect(result).toBe(true);
    });

    test('应该能激活账户', async () => {
      await accountService.createAccount('user15');
      await accountService.deactivateAccount('user15', '临时停用');
      const result = await accountService.activateAccount('user15');
      expect(result).toBe(true);
    });

    test('停用不存在的账户应该失败', async () => {
      expect(async () => {
        await accountService.deactivateAccount('nonexistent', '测试');
      }).toThrow('账户不存在');
    });
  });

  describe('账户信息更新', () => {
    test('应该能更新账户信息', async () => {
      await accountService.createAccount('user16');
      const updated = accountService.updateAccountInfo('user16', {
        email: 'newemail@example.com',
        nickname: 'New Name'
      });

      expect(updated).toBeDefined();
      const accountInfo = accountService.getAccountInfo('user16');
      expect(accountInfo?.account.email).toBe('newemail@example.com');
    });
  });
});
