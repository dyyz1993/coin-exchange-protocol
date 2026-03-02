/**
 * errorLogger 工具测试
 */

import { parseError, logError, getUserFriendlyMessage, isRetryableError } from '../errorLogger';

describe('errorLogger', () => {
  describe('parseError', () => {
    it('should handle null', () => {
      const result = parseError(null);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.details).toBeNull();
    });

    it('should handle undefined', () => {
      const result = parseError(undefined);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.details).toBeUndefined();
    });

    it('should handle Error instances', () => {
      const error = new Error('Test error');
      const result = parseError(error);
      expect(result.message).toBe('Test error');
      expect(result.stack).toBeDefined();
    });

    it('should handle Error with code', () => {
      const error = new Error('Test error') as Error & { code: string };
      error.code = 'TEST_CODE';
      const result = parseError(error);
      expect(result.message).toBe('Test error');
      expect(result.code).toBe('TEST_CODE');
    });

    it('should handle string errors', () => {
      const result = parseError('Something went wrong');
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle empty string', () => {
      const result = parseError('');
      expect(result.message).toBe('An error occurred');
    });

    it('should handle number errors', () => {
      const result = parseError(404);
      expect(result.message).toBe('Error code: 404');
      expect(result.code).toBe(404);
    });

    it('should handle object errors', () => {
      const errorObj = {
        message: 'Object error',
        code: 'OBJ_ERROR',
        stack: 'test stack',
      };
      const result = parseError(errorObj);
      expect(result.message).toBe('Object error');
      expect(result.code).toBe('OBJ_ERROR');
      expect(result.stack).toBe('test stack');
      expect(result.details).toEqual(errorObj);
    });

    it('should handle object without message', () => {
      const errorObj = { code: 500 };
      const result = parseError(errorObj);
      expect(result.message).toBe('An object error occurred');
      expect(result.code).toBe(500);
    });

    it('should handle other types', () => {
      const result = parseError(() => {});
      expect(result.message).toContain('An unexpected error occurred');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for INSUFFICIENT_BALANCE', () => {
      const error = { code: 'INSUFFICIENT_BALANCE' };
      expect(getUserFriendlyMessage(error)).toBe('余额不足，请检查您的账户余额');
    });

    it('should return friendly message for FREEZE_FAILED', () => {
      const error = { code: 'FREEZE_FAILED' };
      expect(getUserFriendlyMessage(error)).toBe('冻结失败，请稍后重试');
    });

    it('should return friendly message for network errors', () => {
      const error = new Error('Network timeout');
      expect(getUserFriendlyMessage(error)).toBe('网络错误，请检查您的网络连接');
    });

    it('should return original message for unknown errors', () => {
      const error = new Error('Unknown error');
      expect(getUserFriendlyMessage(error)).toBe('Unknown error');
    });

    it('should return default message for empty errors', () => {
      expect(getUserFriendlyMessage(null)).toBe('操作失败，请稍后重试');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = new Error('Network error');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('Request timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for 5xx errors', () => {
      const error = { code: 500 };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for 4xx errors', () => {
      const error = { code: 404 };
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for other errors', () => {
      const error = new Error('Unknown error');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('logError', () => {
    it('should log error without throwing', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => logError(new Error('Test error'))).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should log error with context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      logError(new Error('Test error'), 'TestContext');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
