/**
 * 验证器 Schema 定义
 * 使用 Zod 进行运行时类型验证
 */

import { z } from 'zod';

/**
 * 地址验证 Schema
 */
export const AddressSchema = z.string().min(1).max(100);

/**
 * 金额验证 Schema - 必须为正数
 */
export const AmountSchema = z.number().positive();

/**
 * 交易 ID 验证 Schema
 */
export const TransactionIdSchema = z.string().min(1);

/**
 * 空投领取请求验证 Schema
 */
export const AirdropClaimSchema = z.object({
  userAddress: AddressSchema,
  amount: AmountSchema,
});

/**
 * 转账请求验证 Schema
 */
export const TransferSchema = z.object({
  from: AddressSchema,
  to: AddressSchema,
  amount: AmountSchema,
});

/**
 * 冻结余额请求验证 Schema
 */
export const FreezeBalanceSchema = z.object({
  userAddress: AddressSchema,
  amount: AmountSchema,
  reason: z.string().optional(),
});

/**
 * 解冻余额请求验证 Schema
 */
export const UnfreezeBalanceSchema = z.object({
  userAddress: AddressSchema,
  amount: AmountSchema,
});

// 导出类型
export type AirdropClaim = z.infer<typeof AirdropClaimSchema>;
export type Transfer = z.infer<typeof TransferSchema>;
export type FreezeBalance = z.infer<typeof FreezeBalanceSchema>;
export type UnfreezeBalance = z.infer<typeof UnfreezeBalanceSchema>;
