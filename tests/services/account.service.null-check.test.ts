/**
 * AccountService 空值检查测试
 * 测试账户不存在的边界情况
 */

import {
  accountService,
  AccountNotFoundError,
  InsufficientBalanceError,
} from '../../src/services/account.service';
import { accountModel } from '../../src/models/Account';
import { TransactionType } from '../../src/types/common';

describe('AccountService - 空值检查测试', () => {
  const testUserId = 'test-user-null-check';
  const nonExistentUserId = 'non-existent-user';

  beforeEach(() => {
    // 重置账户数据
    accountModel.clearAllAccounts();
  });

  describe('addTokens - 账户不存在测试', () => {
    it('当账户不存在时应该抛出 AccountNotFoundError', async () => {
      await expect(
        accountService.addTokens(nonExistentUserId, 100, TransactionType.REWARD, '测试奖励')
      ).rejects.toThrow(AccountNotFoundError);
    });

    it('错误消息应该包含用户ID', async () => {
      await expect(
        accountService.addTokens(nonExistentUserId, 100, TransactionType.REWARD, '测试奖励')
      ).rejects.toThrow(`账户不存在: 用户ID ${nonExistentUserId}`);
    });
  });

  describe('deductTokens - 账户不存在测试', () => {
    it('当账户不存在时应该抛出 AccountNotFoundError', async () => {
      await expect(
        accountService.deductTokens(nonExistentUserId, 50, TransactionType.PENALTY, '测试惩罚')
      ).rejects.toThrow(AccountNotFoundError);
    });

    it('错误消息应该包含用户ID', async () => {
      await expect(
        accountService.deductTokens(nonExistentUserId, 50, TransactionType.PENALTY, '测试惩罚')
      ).rejects.toThrow(`账户不存在: 用户ID ${nonExistentUserId}`);
    });
  });

  describe('freezeTokens - 账户不存在测试', () => {
    it('当账户不存在时应该抛出 AccountNotFoundError', async () => {
      await expect(accountService.freezeTokens(nonExistentUserId, 30, '测试冻结')).rejects.toThrow(
        AccountNotFoundError
      );
    });

    it('错误消息应该包含用户ID', async () => {
      await expect(accountService.freezeTokens(nonExistentUserId, 30, '测试冻结')).rejects.toThrow(
        `账户不存在: 用户ID ${nonExistentUserId}`
      );
    });
  });

  describe('unfreezeTokens - 账户不存在测试', () => {
    it('当账户不存在时应该抛出 AccountNotFoundError', async () => {
      await expect(
        accountService.unfreezeTokens(nonExistentUserId, 30, '测试解冻')
      ).rejects.toThrow(AccountNotFoundError);
    });

    it('错误消息应该包含用户ID', async () => {
      await expect(
        accountService.unfreezeTokens(nonExistentUserId, 30, '测试解冻')
      ).rejects.toThrow(`账户不存在: 用户ID ${nonExistentUserId}`);
    });
  });

  describe('transfer - 账户不存在测试', () => {
    const senderId = 'sender-user';
    const receiverId = 'receiver-user';

    beforeEach(async () => {
      // 创建发送方账户
      await accountService.createAccount(senderId, 1000);
    });

    it('当发送方账户不存在时应该抛出 AccountNotFoundError', async () => {
      await expect(
        accountService.transfer(nonExistentUserId, receiverId, 100, '测试转账')
      ).rejects.toThrow(AccountNotFoundError);
    });

    it('当接收方账户不存在时应该抛出 AccountNotFoundError', async () => {
      // 创建发送方账户
      await accountService.createAccount(senderId, 1000);

      await expect(
        accountService.transfer(senderId, nonExistentUserId, 100, '测试转账')
      ).rejects.toThrow(AccountNotFoundError);
    });

    it('当余额不足时应该抛出 InsufficientBalanceError', async () => {
      // 创建接收方账户
      await accountService.createAccount(receiverId, 0);

      await expect(accountService.transfer(senderId, receiverId, 2000, '测试转账')).rejects.toThrow(
        InsufficientBalanceError
      );
    });

    it('余额不足错误应该包含详细信息', async () => {
      // 创建接收方账户
      await accountService.createAccount(receiverId, 0);

      await expect(accountService.transfer(senderId, receiverId, 2000, '测试转账')).rejects.toThrow(
        /余额不足.*需要 2000.*可用余额仅/
      );
    });
  });

  describe('成功场景 - 验证空值检查不影响正常功能', () => {
    it('addTokens 应该在账户存在时正常工作', async () => {
      await accountService.createAccount(testUserId, 100);

      const result = await accountService.addTokens(
        testUserId,
        50,
        TransactionType.REWARD,
        '测试奖励'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
      expect(result.transactionId).toBeDefined();
    });

    it('deductTokens 应该在账户存在时正常工作', async () => {
      await accountService.createAccount(testUserId, 100);

      const result = await accountService.deductTokens(
        testUserId,
        30,
        TransactionType.PENALTY,
        '测试惩罚'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(70);
      expect(result.transactionId).toBeDefined();
    });

    it('freezeTokens 应该在账户存在时正常工作', async () => {
      await accountService.createAccount(testUserId, 100);

      const result = await accountService.freezeTokens(testUserId, 20, '测试冻结');

      expect(result.success).toBe(true);
      expect(result.frozenAmount).toBe(20);
    });

    it('unfreezeTokens 应该在账户存在时正常工作', async () => {
      await accountService.createAccount(testUserId, 100);
      await accountService.freezeTokens(testUserId, 30, '先冻结');

      const result = await accountService.unfreezeTokens(testUserId, 30, '测试解冻');

      expect(result.success).toBe(true);
      expect(result.unfrozenAmount).toBe(30);
    });

    it('transfer 应该在双方账户都存在且余额充足时正常工作', async () => {
      const senderId = 'sender';
      const receiverId = 'receiver';

      await accountService.createAccount(senderId, 500);
      await accountService.createAccount(receiverId, 100);

      const result = await accountService.transfer(senderId, receiverId, 200, '测试转账');

      expect(result.success).toBe(true);
      expect(result.fromNewBalance).toBe(300);
      expect(result.toNewBalance).toBe(300);
      expect(result.transactionId).toBeDefined();
    });
  });
});
