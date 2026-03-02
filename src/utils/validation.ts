/**
 * 输入验证工具
 * 用于验证用户输入，防止无效数据
 */

/**
 * 验证并格式化金额输入
 * @param value 输入值
 * @param maxDecimalPlaces 最大小数位数，默认2位
 * @returns 验证后的金额，如果无效则返回0
 */
export const validateAmount = (value: string, maxDecimalPlaces: number = 2): number => {
  // 移除空格
  const trimmed = value.trim();

  // 空值返回0
  if (!trimmed) return 0;

  // 尝试解析为数字
  const amount = parseFloat(trimmed);

  // 非数字返回0
  if (isNaN(amount)) return 0;

  // 负数返回0
  if (amount < 0) return 0;

  // 检查小数位数
  const decimalPart = trimmed.split('.')[1];
  if (decimalPart && decimalPart.length > maxDecimalPlaces) {
    // 四舍五入到指定小数位
    return parseFloat(amount.toFixed(maxDecimalPlaces));
  }

  return amount;
};

/**
 * 验证账户地址格式
 * @param address 账户地址
 * @returns 是否有效
 */
export const validateAddress = (address: string): boolean => {
  // 基本格式检查：以0x开头，后面跟4-64个十六进制字符
  const addressRegex = /^0x[0-9a-fA-F]{4,64}$/;
  return addressRegex.test(address.trim());
};

/**
 * 验证账户ID格式
 * @param accountId 账户ID
 * @returns 是否有效
 */
export const validateAccountId = (accountId: string): boolean => {
  // 基本格式检查：非空，3-50个字符
  const trimmed = accountId.trim();
  return trimmed.length >= 3 && trimmed.length <= 50;
};

/**
 * 格式化金额显示
 * @param amount 金额
 * @param decimalPlaces 小数位数，默认2位
 * @returns 格式化后的字符串
 */
export const formatAmount = (amount: number, decimalPlaces: number = 2): string => {
  return amount.toFixed(decimalPlaces);
};

/**
 * 验证金额是否在指定范围内
 * @param amount 金额
 * @param min 最小值
 * @param max 最大值
 * @returns 是否在范围内
 */
export const isAmountInRange = (amount: number, min: number, max: number): boolean => {
  return amount >= min && amount <= max;
};

/**
 * 验证非空字符串
 * @param value 字符串值
 * @returns 是否非空
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};
