/**
 * Jest 测试设置文件
 * 在每个测试文件运行前执行
 */

// 增加测试超时时间
jest.setTimeout(10000);

// 全局测试工具函数
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        sleep: (ms: number) => Promise<void>;
        generateId: () => string;
      };
    }
  }
}

// 添加全局测试工具
(global as any).testUtils = {
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  generateId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};

// 在每个测试前清理
beforeEach(() => {
  // 清理所有模拟
  jest.clearAllMocks();
});

// 在每个测试后清理
afterEach(() => {
  // 恢复所有模拟
  jest.restoreAllMocks();
});

// 禁用控制台日志（可选，保持测试输出清晰）
// 如果需要调试，可以注释掉这些行
if (process.env.SUPPRESS_CONSOLE) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// 导出空对象以避免 TypeScript 错误
export {};
