/**
 * 代币系统类型定义 - 统一导出
 */

// 通用类型（排除 ApiResponse，使用 responses.ts 中的版本）
export type { Transaction, Account, PaginatedResponse } from './common';
export { TransactionType, TransactionStatus } from './common';

// 空投类型
export * from './airdrop';

// 任务类型
export * from './task';

// 冻结类型
export * from './freeze';

// 请求类型
export * from './requests';

// 响应类型（包含完整的 ApiResponse 联合类型）
export * from './responses';
