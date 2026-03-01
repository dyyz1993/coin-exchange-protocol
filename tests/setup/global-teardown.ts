/**
 * Jest 全局清理
 * 在所有测试运行后执行一次
 */

export default async function globalTeardown() {
  console.log('🧹 开始全局测试清理...');
  
  // 可选：清理测试数据
  // try {
  //   console.log('🗑️  清理测试数据库...');
  //   await cleanupDatabase();
  // } catch (error) {
  //   console.error('数据库清理失败:', error);
  // }
  
  console.log('✅ 全局测试清理完成');
}

// 导出默认函数
export {};
