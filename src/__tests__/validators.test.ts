/**
 * 验证工具类单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  validateAmount,
  validateNonNegativeAmount,
  validateUserId,
  validateAccountId,
  validateCurrency,
  validateOrderParams,
  validateFreezeParams,
  validateTransferParams,
  ValidationError,
} from '../utils/validators';

describe('Validators', () => {
  describe('validateAmount', () => {
    it('应该接受有效的正数金额', () => {
      expect(() => validateAmount(100, 'amount')).not.toThrow();
      expect(() => validateAmount(0.01, 'amount')).not.toThrow();
      expect(() => validateAmount(999999.99, 'amount')).not.toThrow();
    });

    it('应该拒绝非数字类型', () => {
      expect(() => validateAmount('100', 'amount')).toThrow(ValidationError);
      expect(() => validateAmount(null, 'amount')).toThrow(ValidationError);
      expect(() => validateAmount(undefined, 'amount')).toThrow(ValidationError);
    });

    it('应该拒绝非有限数', () => {
      expect(() => validateAmount(NaN, 'amount')).toThrow(ValidationError);
      expect(() => validateAmount(Infinity, 'amount')).toThrow(ValidationError);
      expect(() => validateAmount(-Infinity, 'amount')).toThrow(ValidationError);
    });

    it('应该拒绝非正数', () => {
      expect(() => validateAmount(0, 'amount')).toThrow(ValidationError);
      expect(() => validateAmount(-100, 'amount')).toThrow(ValidationError);
    });

    it('应该拒绝超过2位小数的金额', () => {
      expect(() => validateAmount(100.123, 'amount')).toThrow(ValidationError);
      expect(() => validateAmount(0.001, 'amount')).toThrow(ValidationError);
    });

    it('应该拒绝超出最大值的金额', () => {
      expect(() => validateAmount(Number.MAX_SAFE_INTEGER, 'amount')).toThrow(ValidationError);
    });
  });

  describe('validateNonNegativeAmount', () => {
    it('应该接受非负金额（包括0）', () => {
      expect(() => validateNonNegativeAmount(100, 'amount')).not.toThrow();
      expect(() => validateNonNegativeAmount(0, 'amount')).not.toThrow();
      expect(() => validateNonNegativeAmount(0.01, 'amount')).not.toThrow();
    });

    it('应该拒绝负数', () => {
      expect(() => validateNonNegativeAmount(-100, 'amount')).toThrow(ValidationError);
      expect(() => validateNonNegativeAmount(-0.01, 'amount')).toThrow(ValidationError);
    });
  });

  describe('validateUserId', () => {
    it('应该接受有效的用户ID', () => {
      expect(() => validateUserId('user123')).not.toThrow();
      expect(() => validateUserId('user_123')).not.toThrow();
      expect(() => validateUserId('user-123')).not.toThrow();
      expect(() => validateUserId('USER123')).not.toThrow();
    });

    it('应该拒绝非字符串类型', () => {
      expect(() => validateUserId(123)).toThrow(ValidationError);
      expect(() => validateUserId(null)).toThrow(ValidationError);
      expect(() => validateUserId(undefined)).toThrow(ValidationError);
    });

    it('应该拒绝空字符串', () => {
      expect(() => validateUserId('')).toThrow(ValidationError);
      expect(() => validateUserId('   ')).toThrow(ValidationError);
    });

    it('应该拒绝过长的用户ID', () => {
      const longId = 'a'.repeat(257);
      expect(() => validateUserId(longId)).toThrow(ValidationError);
    });

    it('应该拒绝包含非法字符的用户ID', () => {
      expect(() => validateUserId('user@123')).toThrow(ValidationError);
      expect(() => validateUserId('user.123')).toThrow(ValidationError);
      expect(() => validateUserId('user 123')).toThrow(ValidationError);
    });
  });

  describe('validateAccountId', () => {
    it('应该接受有效的账户ID', () => {
      expect(() => validateAccountId('acc_123')).not.toThrow();
      expect(() => validateAccountId('account-456')).not.toThrow();
    });

    it('应该拒绝非字符串类型', () => {
      expect(() => validateAccountId(123)).toThrow(ValidationError);
      expect(() => validateAccountId(null)).toThrow(ValidationError);
    });

    it('应该拒绝空字符串', () => {
      expect(() => validateAccountId('')).toThrow(ValidationError);
    });

    it('应该拒绝过长的账户ID', () => {
      const longId = 'a'.repeat(257);
      expect(() => validateAccountId(longId)).toThrow(ValidationError);
    });
  });

  describe('validateCurrency', () => {
    it('应该接受有效的货币代码', () => {
      expect(() => validateCurrency('USD')).not.toThrow();
      expect(() => validateCurrency('CNY')).not.toThrow();
      expect(() => validateCurrency('EUR')).not.toThrow();
    });

    it('应该拒绝非字符串类型', () => {
      expect(() => validateCurrency(123)).toThrow(ValidationError);
      expect(() => validateCurrency(null)).toThrow(ValidationError);
    });

    it('应该拒绝空字符串', () => {
      expect(() => validateCurrency('')).toThrow(ValidationError);
    });

    it('应该拒绝非3位字母的货币代码', () => {
      expect(() => validateCurrency('US')).toThrow(ValidationError);
      expect(() => validateCurrency('USDD')).toThrow(ValidationError);
      expect(() => validateCurrency('usd')).toThrow(ValidationError);
      expect(() => validateCurrency('123')).toThrow(ValidationError);
    });
  });

  describe('validateOrderParams', () => {
    const validParams = {
      buyerId: 'buyer1',
      sellerId: 'seller1',
      amount: 100,
      price: 10,
      currency: 'USD',
      description: 'Test order',
    };

    it('应该接受有效的订单参数', () => {
      expect(() => validateOrderParams(validParams)).not.toThrow();
    });

    it('应该拒绝买家和卖家相同的订单', () => {
      const params = { ...validParams, buyerId: 'same', sellerId: 'same' };
      expect(() => validateOrderParams(params)).toThrow(ValidationError);
    });

    it('应该拒绝无效的买家ID', () => {
      const params = { ...validParams, buyerId: '' };
      expect(() => validateOrderParams(params)).toThrow(ValidationError);
    });

    it('应该拒绝无效的金额', () => {
      const params = { ...validParams, amount: -100 };
      expect(() => validateOrderParams(params)).toThrow(ValidationError);
    });

    it('应该拒绝过长的描述', () => {
      const params = { ...validParams, description: 'a'.repeat(1001) };
      expect(() => validateOrderParams(params)).toThrow(ValidationError);
    });
  });

  describe('validateFreezeParams', () => {
    const validParams = {
      userId: 'user1',
      amount: 100,
      type: 'initial' as const,
    };

    it('应该接受有效的冻结参数', () => {
      expect(() => validateFreezeParams(validParams)).not.toThrow();
    });

    it('应该接受带可选参数的冻结参数', () => {
      const params = {
        ...validParams,
        transactionId: 'tx123',
        remark: 'Test freeze',
      };
      expect(() => validateFreezeParams(params)).not.toThrow();
    });

    it('应该拒绝无效的冻结类型', () => {
      const params = { ...validParams, type: 'invalid' };
      expect(() => validateFreezeParams(params)).toThrow(ValidationError);
    });

    it('应该拒绝无效的金额', () => {
      const params = { ...validParams, amount: -100 };
      expect(() => validateFreezeParams(params)).toThrow(ValidationError);
    });

    it('应该拒绝过长的备注', () => {
      const params = { ...validParams, remark: 'a'.repeat(501) };
      expect(() => validateFreezeParams(params)).toThrow(ValidationError);
    });
  });

  describe('validateTransferParams', () => {
    const validParams = {
      fromUserId: 'user1',
      toUserId: 'user2',
      amount: 100,
      description: 'Test transfer',
    };

    it('应该接受有效的转账参数', () => {
      expect(() => validateTransferParams(validParams)).not.toThrow();
    });

    it('应该拒绝转出和转入用户相同的转账', () => {
      const params = { ...validParams, fromUserId: 'same', toUserId: 'same' };
      expect(() => validateTransferParams(params)).toThrow(ValidationError);
    });

    it('应该拒绝无效的用户ID', () => {
      const params = { ...validParams, fromUserId: '' };
      expect(() => validateTransferParams(params)).toThrow(ValidationError);
    });

    it('应该拒绝无效的金额', () => {
      const params = { ...validParams, amount: 0 };
      expect(() => validateTransferParams(params)).toThrow(ValidationError);
    });

    it('应该拒绝过长的描述', () => {
      const params = { ...validParams, description: 'a'.repeat(501) };
      expect(() => validateTransferParams(params)).toThrow(ValidationError);
    });
  });
});
