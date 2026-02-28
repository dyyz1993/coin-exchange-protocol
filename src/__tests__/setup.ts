/**
 * Jest 测试环境设置文件
 * 在所有测试文件运行前执行
 */

// 扩展 Jest 匹配器
expect.extend({
  toBeValidAccount(received: any) {
    const pass = 
      received &&
      typeof received.userId === 'string' &&
      typeof received.balance === 'number' &&
      typeof received.frozenBalance === 'number';
    
    return {
      pass,
      message: () => 
        pass
          ? `expected ${received} not to be a valid account`
          : `expected ${received} to be a valid account with userId, balance, and frozenBalance`,
    };
  },
  
  toBeSuccessfulResponse(received: any) {
    const pass = 
      received &&
      typeof received.success === 'boolean';
    
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a successful API response`
          : `expected ${received} to be a successful API response`,
    };
  },
});

// 全局测试超时设置
jest.setTimeout(10000);

// Mock console 以减少测试输出噪音（可选）
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

console.log('✅ Jest 测试环境已初始化');
