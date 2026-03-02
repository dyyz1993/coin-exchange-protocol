/**
 * AccountService 空值检查测试
 * 测试账户不存在的边界情况
 */

import {
  AccountService,
  AccountNotFoundError,
  InsufficientBalanceError,
} from '../services/account.service';
import { accountModel } from '../models/Account';
import { TransactionType } from '../types/common';

// Mock AccountModel
jest.mock('../models/Account');

describe('AccountService - 空值检查测试', () => {
  let accountService: AccountService;

  beforeEach(() => {
    accountService = new AccountService();
    jest.clearAllMocks();
  });

  describe('addTokens - 添加代币', () => {
    it('当账户不存在时应该抛出 AccountNotFoundError', async () => {
      const userId = 'non-existent-user';
      const amount = 100;

      // Mock addBalance 返回成功的交易
      (accountModel.addBalance as jest.Mock).mockResolvedValue({
        id: 'tx-123',
        amount: amount,
        type: 'REWARD',
        description: '测试添加',
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 返回 null
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue(null);

      // 验证抛出 AccountNotFoundError
      await expect(
        accountService.addTokens(userId, amount, TransactionType.REWARD, '测试添加')
      ).rejects.toThrow(AccountNotFoundError);

      await expect(
        accountService.addTokens(userId, amount, TransactionType.REWARD, '测试添加')
      ).rejects.toThrow(`账户不存在: 用户ID ${userId}`);
    });

    it('当账户存在时应该成功添加代币', async () => {
      const userId = 'test-user';
      const amount = 100;

      // Mock addBalance 返回成功的交易
      (accountModel.addBalance as jest.Mock).mockResolvedValue({
        id: 'tx-123',
        amount: amount,
        type: 'REWARD',
        description: '测试添加',
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 返回账户
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue({
        id: 'account-123',
        userId: userId,
        balance: 200,
        frozenBalance: 0,
        createdAt: new Date(),
      });

      const result = await accountService.addTokens(
        userId,
        amount,
        TransactionType.REWARD,
        '测试添加'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(200);
      expect(result.transactionId).toBe('tx-123');
    });
  });

  describe('deductTokens - 扣除代币', () => {
    it('当账户不存在时应该抛出 AccountNotFoundError', async () => {
      const userId = 'non-existent-user';
      const amount = 50;

      // Mock deductBalance 返回成功的交易
      (accountModel.deductBalance as jest.Mock).mockResolvedValue({
        id: 'tx-456',
        amount: amount,
        type: 'PENALTY',
        description: '测试扣除',
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 返回 null
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue(null);

      // 验证抛出 AccountNotFoundError
      await expect(
        accountService.deductTokens(userId, amount, TransactionType.PENALTY, '测试扣除')
      ).rejects.toThrow(AccountNotFoundError);
    });

    it('当账户存在时应该成功扣除代币', async () => {
      const userId = 'test-user';
      const amount = 50;

      // Mock deductBalance 返回成功的交易
      (accountModel.deductBalance as jest.Mock).mockResolvedValue({
        id: 'tx-456',
        amount: amount,
        type: 'PENALTY',
        description: '测试扣除',
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 返回账户
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue({
        id: 'account-123',
        userId: userId,
        balance: 50,
        frozenBalance: 0,
        createdAt: new Date(),
      });

      const result = await accountService.deductTokens(
        userId,
        amount,
        TransactionType.PENALTY,
        '测试扣除'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(50);
      expect(result.transactionId).toBe('tx-456');
    });
  });

  describe('freezeTokens - 冻结代币', () => {
    it('当账户不存在时应该抛出 AccountNotFoundError', async () => {
      const userId = 'non-existent-user';
      const amount = 30;

      // Mock freezeBalance 返回成功的交易
      (accountModel.freezeBalance as jest.Mock).mockResolvedValue({
        id: 'tx-789',
        amount: amount,
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 返回 null
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue(null);

      // 验证抛出 AccountNotFoundError
      await expect(accountService.freezeTokens(userId, amount, '测试冻结')).rejects.toThrow(
        AccountNotFoundError
      );
    });

    it('当账户存在时应该成功冻结代币', async () => {
      const userId = 'test-user';
      const amount = 30;

      // Mock freezeBalance 返回成功的交易
      (accountModel.freezeBalance as jest.Mock).mockResolvedValue({
        id: 'tx-789',
        amount: amount,
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 返回账户
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue({
        id: 'account-123',
        userId: userId,
        balance: 100,
        frozenBalance: 30,
        createdAt: new Date(),
      });

      const result = await accountService.freezeTokens(userId, amount, '测试冻结');

      expect(result.success).toBe(true);
      expect(result.frozenAmount).toBe(30);
      expect(result.availableBalance).toBe(100);
    });
  });

  describe('unfreezeTokens - 解冻代币', () => {
    it('当账户不存在时应该抛出 AccountNotFoundError', async () => {
      const userId = 'non-existent-user';
      const amount = 20;

      // Mock unfreezeBalance 返回成功的交易
      (accountModel.unfreezeBalance as jest.Mock).mockResolvedValue({
        id: 'tx-012',
        amount: amount,
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 返回 null
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue(null);

      // 验证抛出 AccountNotFoundError
      await expect(accountService.unfreezeTokens(userId, amount, '测试解冻')).rejects.toThrow(
        AccountNotFoundError
      );
    });

    it('当账户存在时应该成功解冻代币', async () => {
      const userId = 'test-user';
      const amount = 20;

      // Mock unfreezeBalance 返回成功的交易
      (accountModel.unfreezeBalance as jest.Mock).mockResolvedValue({
        id: 'tx-012',
        amount: amount,
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 返回账户
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue({
        id: 'account-123',
        userId: userId,
        balance: 100,
        frozenBalance: 10,
        createdAt: new Date(),
      });

      const result = await accountService.unfreezeTokens(userId, amount, '测试解冻');

      expect(result.success).toBe(true);
      expect(result.unfrozenAmount).toBe(20);
      expect(result.availableBalance).toBe(100);
    });
  });

  describe('transfer - 转账', () => {
    it('当发送方账户不存在时应该抛出 InsufficientBalanceError', async () => {
      const fromUserId = 'non-existent-sender';
      const toUserId = 'test-receiver';
      const amount = 100;

      // Mock getTokenBalance 返回 null
      jest.spyOn(accountService, 'getTokenBalance').mockReturnValue(null);

      // 验证抛出 InsufficientBalanceError
      await expect(
        accountService.transfer(fromUserId, toUserId, amount, '测试转账')
      ).rejects.toThrow(InsufficientBalanceError);
    });

    it('当发送方余额不足时应该抛出 InsufficientBalanceError', async () => {
      const fromUserId = 'test-sender';
      const toUserId = 'test-receiver';
      const amount = 100;

      // Mock getTokenBalance 返回余额不足
      jest.spyOn(accountService, 'getTokenBalance').mockReturnValue({
        balance: 50,
        frozenBalance: 0,
        availableBalance: 50,
      });

      // 验证抛出 InsufficientBalanceError
      await expect(
        accountService.transfer(fromUserId, toUserId, amount, '测试转账')
      ).rejects.toThrow(InsufficientBalanceError);

      await expect(
        accountService.transfer(fromUserId, toUserId, amount, '测试转账')
      ).rejects.toThrow(/余额不足/);
    });

    it('当转账后发送方账户不存在时应该抛出 AccountNotFoundError', async () => {
      const fromUserId = 'test-sender';
      const toUserId = 'test-receiver';
      const amount = 50;

      // Mock getTokenBalance 返回足够余额
      jest.spyOn(accountService, 'getTokenBalance').mockReturnValue({
        balance: 100,
        frozenBalance: 0,
        availableBalance: 100,
      });

      // Mock transfer 返回成功的交易
      (accountModel.transfer as jest.Mock).mockResolvedValue({
        id: 'tx-345',
        amount: amount,
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 第一次返回发送方账户，第二次返回 null
      (accountModel.getAccountByUserId as jest.Mock)
        .mockReturnValueOnce({
          id: 'account-123',
          userId: fromUserId,
          balance: 50,
          frozenBalance: 0,
          createdAt: new Date(),
        })
        .mockReturnValueOnce(null);

      // 验证抛出 AccountNotFoundError
      await expect(
        accountService.transfer(fromUserId, toUserId, amount, '测试转账')
      ).rejects.toThrow(AccountNotFoundError);
    });

    it('当转账后接收方账户不存在时应该抛出 AccountNotFoundError', async () => {
      const fromUserId = 'test-sender';
      const toUserId = 'test-receiver';
      const amount = 50;

      // Mock getTokenBalance 返回足够余额
      jest.spyOn(accountService, 'getTokenBalance').mockReturnValue({
        balance: 100,
        frozenBalance: 0,
        availableBalance: 100,
      });

      // Mock transfer 返回成功的交易
      (accountModel.transfer as jest.Mock).mockResolvedValue({
        id: 'tx-345',
        amount: amount,
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 发送方存在，接收方不存在
      (accountModel.getAccountByUserId as jest.Mock)
        .mockReturnValueOnce({
          id: 'account-123',
          userId: fromUserId,
          balance: 50,
          frozenBalance: 0,
          createdAt: new Date(),
        })
        .mockReturnValueOnce({
          id: 'account-123',
          userId: fromUserId,
          balance: 50,
          frozenBalance: 0,
          createdAt: new Date(),
        })
        .mockReturnValueOnce(null);

      // 验证抛出 AccountNotFoundError
      await expect(
        accountService.transfer(fromUserId, toUserId, amount, '测试转账')
      ).rejects.toThrow(AccountNotFoundError);
    });

    it('当账户都存在且余额充足时应该成功转账', async () => {
      const fromUserId = 'test-sender';
      const toUserId = 'test-receiver';
      const amount = 50;

      // Mock getTokenBalance 返回足够余额
      jest.spyOn(accountService, 'getTokenBalance').mockReturnValue({
        balance: 100,
        frozenBalance: 0,
        availableBalance: 100,
      });

      // Mock transfer 返回成功的交易
      (accountModel.transfer as jest.Mock).mockResolvedValue({
        id: 'tx-345',
        amount: amount,
        createdAt: new Date(),
      });

      // Mock getAccountByUserId 返回账户
      (accountModel.getAccountByUserId as jest.Mock)
        .mockReturnValueOnce({
          id: 'account-123',
          userId: fromUserId,
          balance: 50,
          frozenBalance: 0,
          createdAt: new Date(),
        })
        .mockReturnValueOnce({
          id: 'account-123',
          userId: fromUserId,
          balance: 50,
          frozenBalance: 0,
          createdAt: new Date(),
        })
        .mockReturnValueOnce({
          id: 'account-456',
          userId: toUserId,
          balance: 150,
          frozenBalance: 0,
          createdAt: new Date(),
        });

      const result = await accountService.transfer(fromUserId, toUserId, amount, '测试转账');

      expect(result.success).toBe(true);
      expect(result.fromNewBalance).toBe(50);
      expect(result.toNewBalance).toBe(150);
      expect(result.transactionId).toBe('tx-345');
    });
  });

  describe('getAccountInfo - 获取账户信息', () => {
    it('当账户不存在时应该返回 null', () => {
      const userId = 'non-existent-user';

      // Mock getAccountByUserId 返回 null
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue(null);

      const result = accountService.getAccountInfo(userId);

      expect(result).toBeNull();
    });

    it('当账户存在时应该返回账户信息', () => {
      const userId = 'test-user';

      // Mock getAccountByUserId 返回账户
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue({
        id: 'account-123',
        userId: userId,
        balance: 100,
        frozenBalance: 20,
        totalEarned: 200,
        totalSpent: 120,
        createdAt: new Date(),
      });

      const result = accountService.getAccountInfo(userId);

      expect(result).not.toBeNull();
      expect(result?.balance).toBe(100);
      expect(result?.frozenBalance).toBe(20);
      expect(result?.totalEarned).toBe(200);
      expect(result?.totalSpent).toBe(120);
    });
  });

  describe('getTokenBalance - 获取代币余额', () => {
    it('当账户不存在时应该返回 null', () => {
      const userId = 'non-existent-user';

      // Mock getAccountByUserId 返回 null
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue(null);

      const result = accountService.getTokenBalance(userId);

      expect(result).toBeNull();
    });

    it('当账户存在时应该返回余额信息', () => {
      const userId = 'test-user';

      // Mock getAccountByUserId 返回账户
      (accountModel.getAccountByUserId as jest.Mock).mockReturnValue({
        id: 'account-123',
        userId: userId,
        balance: 100,
        frozenBalance: 20,
        createdAt: new Date(),
      });

      const result = accountService.getTokenBalance(userId);

      expect(result).not.toBeNull();
      expect(result?.balance).toBe(100);
      expect(result?.frozenBalance).toBe(20);
      expect(result?.availableBalance).toBe(100);
    });
  });
});
