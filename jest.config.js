module.exports = {
  // 使用 ts-jest 预设
  preset: 'ts-jest',
  
  // 测试环境
  testEnvironment: 'node',
  
  // 根目录
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // 转换配置
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // 覆盖率收集配置
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/index.ts',
  ],
  
  // 覆盖率输出目录
  coverageDirectory: 'coverage',
  
  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 模块路径别名（与 tsconfig.json 保持一致）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
  },
  
  // 测试超时时间（毫秒）
  testTimeout: 10000,
  
  // 是否在运行测试前清除模拟
  clearMocks: true,
  
  // 是否在测试之间重置模拟
  resetMocks: true,
  
  // 是否在每个测试前自动恢复模拟状态
  restoreMocks: true,
  
  // 是否显示详细输出
  verbose: true,
  
  // 检测打开的句柄
  detectOpenHandles: true,
  
  // 强制退出
  forceExit: true,
  
  // 全局设置
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
  
  // 测试设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.ts'],
  
  // 忽略的路径
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  
  // 监听时的插件
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname',
  // ],
};
