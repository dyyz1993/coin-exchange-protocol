/**
 * Jest 全局设置
 * 在所有测试运行前执行一次
 */

// import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('🚀 开始全局测试设置...');

  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.TEST_TIMEOUT = '10000';

  // 可选：在测试前运行数据库迁移或清理
  // try {
  //   console.log('📊 准备测试数据库...');
  //   execSync('npm run db:migrate:test', { stdio: 'inherit' });
  // } catch (error) {
  //   console.error('数据库迁移失败:', error);
  // }

  console.log('✅ 全局测试设置完成');
}

// 导出默认函数
export {};
