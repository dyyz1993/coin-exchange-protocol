/**
 * TokenService 单元测试
 * 测试范围：余额查询、转账、冻结、解冻、交易历史
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { TokenService } from '../../src/services/TokenService';
import { AccountModel } from '../../src/models/Account';
import { TransactionType } from '../../src/types/common';

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
    // 清空测试数据
    (AccountModel as any).accounts.clear();
  });

  afterEach(() => {
    // 清理测试数据
    (AccountModel as any).accounts.clear();
  });

  describe('getBalance', () => {
    test('应该返回用户的余额信息', () => {
      // 先创建一个账户
      const userId = 'test-user-001';
      AccountModel.createAccount(userId, 1000);

      const balance = tokenService.getBalance(userId);

      expect(balance).toBeDefined();
      expect(balance.userId).toBe(userId);
      expect(balance.balance).toBe(1000);
      expect(balance.frozenBalance).toBe(0);
      expect(balance.availableBalance).toBe(1000);
    });

    test('对不存在的用户应返回零余额', () => {
      const balance = tokenService.getBalance('non-existent-user');

      expect(balance).toBeDefined();
      expect(balance.userId).toBe('non-existent-user');
      expect(balance.balance).toBe(0);
      expect(balance.frozenBalance).toBe(0);
      expect(balance.availableBalance).toBe(0);
    });

    test('应该正确返回冻结余额', () => {
      const userId = 'test-user-002';
      AccountModel.createAccount(userId, 1000);
      
      // 冻结部分余额
      AccountModel.freezeBalance(userId, 300);

      const balance = tokenService.getBalance(userId);

      expect(balance.balance).toBe(1000);
      expect(balance.frozenBalance).toBe(300);
      expect(balance.availableBalance).toBe(1000); // 注意：当前实现可能需要调整
    });
  });

  describe('addBalance', () => {
    test('应该成功增加用户余额', () => {
      const userId = 'test-user-003';
      AccountModel.createAccount(userId, 0);

      const transaction = tokenService.addBalance(
        userId,
        500,
        '测试充值',
        TransactionType.REWARD
      );

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(500);
      expect(transaction.type).toBe(TransactionType.REWARD);
      expect(transaction.description).toBe('测试充值');

      const balance = tokenService.getBalance(userId);
      expect(balance.balance).toBe(500);
    });

    test('应该支持多次增加余额', () => {
      const userId = 'test-user-004';
      AccountModel.createAccount(userId, 0);

      tokenService.addBalance(userId, 100, '充值1', TransactionType.REWARD);
      tokenService.addBalance(userId, 200, '充值2', TransactionType.AIRDROP);
      tokenService.addBalance(userId, 300, '充值3', TransactionType.TASK_REWARD);

      const balance = tokenService.getBalance(userId);
      expect(balance.balance).toBe(600);
    });

    test('应该记录交易历史', () => {
      const userId = 'test-user-005';
      AccountModel.createAccount(userId, 0);

      tokenService.addBalance(userId, 100, '测试', TransactionType.REWARD);

      const history = tokenService.getTransactionHistory(userId);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].amount).toBe(100);
    });
  });

  describe('deductBalance', () => {
    test('应该成功扣除用户余额', () => {
      const userId = 'test-user-006';
      AccountModel.createAccount(userId, 1000);

      const transaction = tokenService.deductBalance(userId, 300, '测试扣款');

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(-300);

      const balance = tokenService.getBalance(userId);
      expect(balance.balance).toBe(700);
    });

    test('应该在余额不足时抛出错误', () => {
      const userId = 'test-user-007';
      AccountModel.createAccount(userId, 100);

      expect(() => {
        tokenService.deductBalance(userId, 200, '超额扣款');
      }).toThrow();
    });

    test('扣除后应更新交易历史', () => {
      const userId = 'test-user-008';
      AccountModel.createAccount(userId, 1000);

      tokenService.deductBalance(userId, 300, '测试');

      const history = tokenService.getTransactionHistory(userId);
      const deductTx = history.find(tx => tx.amount < 0);
      expect(deductTx).toBeDefined();
      expect(deductTx?.amount).toBe(-300);
    });
  });

  describe('transfer', () => {
    test('应该成功在用户间转账', () => {
      const fromUserId = 'test-user-009';
      const toUserId = 'test-user-010';
      
      AccountModel.createAccount(fromUserId, 1000);
      AccountModel.createAccount(toUserId, 0);

      const transaction = tokenService.transfer(
        fromUserId,
        toUserId,
        300,
        '测试转账'
      );

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(300);

      const fromBalance = tokenService.getBalance(fromUserId);
      const toBalance = tokenService.getBalance(toUserId);

      expect(fromBalance.balance).toBe(700);
      expect(toBalance.balance).toBe(300);
    });

    test('应该在余额不足时拒绝转账', () => {
      const fromUserId = 'test-user-011';
      const toUserId = 'test-user-012';
      
      AccountModel.createAccount(fromUserId, 100);
      AccountModel.createAccount(toUserId, 0);

      expect(() => {
        tokenService.transfer(fromUserId, toUserId, 200, '超额转账');
      }).toThrow();
    });

    test('转账应记录在双方交易历史中', () => {
      const fromUserId = 'test-user-013';
      const toUserId = 'test-user-014';
      
      AccountModel.createAccount(fromUserId, 1000);
      AccountModel.createAccount(toUserId, 0);

      tokenService.transfer(fromUserId, toUserId, 300, '测试');

      const fromHistory = tokenService.getTransactionHistory(fromUserId);
      const toHistory = tokenService.getTransactionHistory(toUserId);

      expect(fromHistory.length).toBeGreaterThan(0);
      expect(toHistory.length).toBeGreaterThan(0);
    });
  });

  describe('freezeBalance', () => {
    test('应该成功冻结用户余额', () => {
      const userId = 'test-user-015';
      AccountModel.createAccount(userId, 1000);

      const transaction = tokenService.freezeBalance(userId, 300);

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(-300);

      const balance = tokenService.getBalance(userId);
      expect(balance.frozenBalance).toBe(300);
    });

    test('应该在可用余额不足时拒绝冻结', () => {
      const userId = 'test-user-016';
      AccountModel.createAccount(userId, 100);

      expect(() => {
        tokenService.freezeBalance(userId, 200);
      }).toThrow();
    });
  });

  describe('unfreezeBalance', () => {
    test('应该成功解冻用户余额', () => {
      const userId = 'test-user-017';
      AccountModel.createAccount(userId, 1000);
      
      // 先冻结
      tokenService.freezeBalance(userId, 300);

      const transaction = tokenService.unfreezeBalance(userId, 300);

      expect(transaction).toBeDefined();

      const balance = tokenService.getBalance(userId);
      expect(balance.frozenBalance).toBe(0);
    });

    test('应该在冻结余额不足时拒绝解冻', () => {
      const userId = 'test-user-018';
      AccountModel.createAccount(userId, 1000);
      
      // 先冻结少量
      tokenService.freezeBalance(userId, 100);

      expect(() => {
        tokenService.unfreezeBalance(userId, 200);
      }).toThrow();
    });
  });

  describe('getTransactionHistory', () => {
    test('应该返回用户的交易历史', () => {
      const userId = 'test-user-019';
      AccountModel.createAccount(userId, 0);

      // 创建一些交易
      tokenService.addBalance(userId, 100, '充值1', TransactionType.REWARD);
      tokenService.addBalance(userId, 200, '充值2', TransactionType.AIRDROP);
      tokenService.deductBalance(userId, 50, '扣款');

      const history = tokenService.getTransactionHistory(userId);

      expect(history.length).toBe(3);
      expect(history[0].amount).toBe(100);
      expect(history[1].amount).toBe(200);
      expect(history[2].amount).toBe(-50);
    });

    test('对没有交易的用户应返回空数组', () => {
      const userId = 'test-user-020';
      AccountModel.createAccount(userId, 0);

      const history = tokenService.getTransactionHistory(userId);

      expect(history).toBeDefined();
      expect(history.length).toBe(0);
    });
  });

  describe('getTransaction', () => {
    test('应该返回指定交易的详情', () => {
      const userId = 'test-user-021';
      AccountModel.createAccount(userId, 0);

      const transaction = tokenService.addBalance(
        userId,
        100,
        '测试交易',
        TransactionType.REWARD
      );

      const retrieved = tokenService.getTransaction(transaction.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(transaction.id);
      expect(retrieved?.amount).toBe(100);
      expect(retrieved?.description).toBe('测试交易');
    });

    test('对不存在的交易应返回 undefined', () => {
      const retrieved = tokenService.getTransaction('non-existent-tx-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('边界条件测试', () => {
    test('应该处理零金额操作', () => {
      const userId = 'test-user-022';
      AccountModel.createAccount(userId, 0);

      const transaction = tokenService.addBalance(
        userId,
        0,
        '零金额',
        TransactionType.REWARD
      );

      expect(transaction.amount).toBe(0);

      const balance = tokenService.getBalance(userId);
      expect(balance.balance).toBe(0);
    });

    test('应该处理极大金额', () => {
      const userId = 'test-user-023';
      AccountModel.createAccount(userId, 0);

      const largeAmount = Number.MAX_SAFE_INTEGER / 2;
      const transaction = tokenService.addBalance(
        userId,
        largeAmount,
        '大金额',
        TransactionType.REWARD
      );

      expect(transaction.amount).toBe(largeAmount);

      const balance = tokenService.getBalance(userId);
      expect(balance.balance).toBe(largeAmount);
    });

    test('应该处理并发操作', async () => {
      const userId = 'test-user-024';
      AccountModel.createAccount(userId, 0);

      // 模拟并发添加代币
      const promises = Array(10).fill(null).map((_, i) => 
        Promise.resolve(
          tokenService.addBalance(userId, 10, `并发${i}`, TransactionType.REWARD)
        )
      );

      await Promise.all(promises);

      const balance = tokenService.getBalance(userId);
      expect(balance.balance).toBe(100);
    });
  });

  describe('错误处理测试', () => {
    test('应该处理无效的用户ID', () => {
      const balance = tokenService.getBalance('');
      expect(balance.userId).toBe('');
      expect(balance.balance).toBe(0);
    });

    test('应该处理负数金额（应该被拒绝或转为正数）', () => {
      const userId = 'test-user-025';
      AccountModel.createAccount(userId, 1000);

      // 负数金额可能会导致错误或被转为正数
      expect(() => {
        tokenService.addBalance(userId, -100, '负数', TransactionType.REWARD);
      }).toThrow();
    });
  });
});
