/**
 * 输入数据验证工具类
 * 提供统一的验证逻辑，确保数据完整性和安全性
 */

/**
 * 验证错误类
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 验证金额
 * @param amount 金额
 * @param fieldName 字段名
 * @throws ValidationError 如果金额无效
 */
export function validateAmount(amount: any, fieldName: string = 'amount'): void {
  // 检查是否为数字类型
  if (typeof amount !== 'number') {
    throw new ValidationError(`${fieldName} 必须是数字类型`);
  }

  // 检查是否为有限数（不是 NaN 或 Infinity）
  if (!Number.isFinite(amount)) {
    throw new ValidationError(`${fieldName} 必须是有效的数字`);
  }

  // 检查是否为正数
  if (amount <= 0) {
    throw new ValidationError(`${fieldName} 必须是正数`);
  }

  // 检查精度（最多2位小数）
  if (!Number.isInteger(amount * 100)) {
    throw new ValidationError(`${fieldName} 最多只能有2位小数`);
  }

  // 检查最大值（防止溢出）
  if (amount > Number.MAX_SAFE_INTEGER / 100) {
    throw new ValidationError(`${fieldName} 超出最大允许值`);
  }
}

/**
 * 验证非负金额（允许为0）
 * @param amount 金额
 * @param fieldName 字段名
 * @throws ValidationError 如果金额无效
 */
export function validateNonNegativeAmount(amount: any, fieldName: string = 'amount'): void {
  // 检查是否为数字类型
  if (typeof amount !== 'number') {
    throw new ValidationError(`${fieldName} 必须是数字类型`);
  }

  // 检查是否为有限数
  if (!Number.isFinite(amount)) {
    throw new ValidationError(`${fieldName} 必须是有效的数字`);
  }

  // 检查是否为非负数
  if (amount < 0) {
    throw new ValidationError(`${fieldName} 不能为负数`);
  }

  // 检查精度
  if (!Number.isInteger(amount * 100)) {
    throw new ValidationError(`${fieldName} 最多只能有2位小数`);
  }

  // 检查最大值
  if (amount > Number.MAX_SAFE_INTEGER / 100) {
    throw new ValidationError(`${fieldName} 超出最大允许值`);
  }
}

/**
 * 验证用户ID
 * @param userId 用户ID
 * @throws ValidationError 如果用户ID无效
 */
export function validateUserId(userId: any): void {
  // 检查是否为字符串
  if (typeof userId !== 'string') {
    throw new ValidationError('用户ID必须是字符串类型');
  }

  // 检查是否为空
  if (!userId || userId.trim().length === 0) {
    throw new ValidationError('用户ID不能为空');
  }

  // 检查长度（防止过长）
  if (userId.length > 256) {
    throw new ValidationError('用户ID长度不能超过256个字符');
  }

  // 检查格式（只允许字母、数字、下划线、短横线）
  const validPattern = /^[a-zA-Z0-9_\-]+$/;
  if (!validPattern.test(userId)) {
    throw new ValidationError('用户ID只能包含字母、数字、下划线和短横线');
  }
}

/**
 * 验证账户ID
 * @param accountId 账户ID
 * @throws ValidationError 如果账户ID无效
 */
export function validateAccountId(accountId: any): void {
  // 检查是否为字符串
  if (typeof accountId !== 'string') {
    throw new ValidationError('账户ID必须是字符串类型');
  }

  // 检查是否为空
  if (!accountId || accountId.trim().length === 0) {
    throw new ValidationError('账户ID不能为空');
  }

  // 检查长度
  if (accountId.length > 256) {
    throw new ValidationError('账户ID长度不能超过256个字符');
  }
}

/**
 * 验证货币类型
 * @param currency 货币类型
 * @throws ValidationError 如果货币类型无效
 */
export function validateCurrency(currency: any): void {
  // 检查是否为字符串
  if (typeof currency !== 'string') {
    throw new ValidationError('货币类型必须是字符串类型');
  }

  // 检查是否为空
  if (!currency || currency.trim().length === 0) {
    throw new ValidationError('货币类型不能为空');
  }

  // 检查是否为有效的货币代码（3个大写字母）
  const validPattern = /^[A-Z]{3}$/;
  if (!validPattern.test(currency)) {
    throw new ValidationError('货币类型必须是3位大写字母（如 USD, CNY）');
  }
}

/**
 * 验证订单参数
 * @param params 订单参数
 * @throws ValidationError 如果订单参数无效
 */
export function validateOrderParams(params: {
  buyerId: any;
  sellerId: any;
  amount: any;
  price: any;
  currency: any;
  description: any;
}): void {
  // 验证买家ID
  validateUserId(params.buyerId);

  // 验证卖家ID
  validateUserId(params.sellerId);

  // 验证买家和卖家不能相同
  if (params.buyerId === params.sellerId) {
    throw new ValidationError('买家和卖家不能是同一用户');
  }

  // 验证金额
  validateAmount(params.amount, '订单金额');

  // 验证价格
  validateAmount(params.price, '订单价格');

  // 验证货币类型
  validateCurrency(params.currency);

  // 验证描述
  if (params.description !== undefined && params.description !== null) {
    if (typeof params.description !== 'string') {
      throw new ValidationError('订单描述必须是字符串类型');
    }
    if (params.description.length > 1000) {
      throw new ValidationError('订单描述长度不能超过1000个字符');
    }
  }
}

/**
 * 验证冻结参数
 * @param params 冻结参数
 * @throws ValidationError 如果冻结参数无效
 */
export function validateFreezeParams(params: {
  userId: any;
  amount: any;
  type: any;
  transactionId?: any;
  remark?: any;
}): void {
  // 验证用户ID
  validateUserId(params.userId);

  // 验证金额
  validateAmount(params.amount, '冻结金额');

  // 验证冻结类型
  if (typeof params.type !== 'string') {
    throw new ValidationError('冻结类型必须是字符串类型');
  }

  const validTypes = ['initial', 'dispute'];
  if (!validTypes.includes(params.type)) {
    throw new ValidationError(`冻结类型必须是以下之一: ${validTypes.join(', ')}`);
  }

  // 验证交易ID（可选）
  if (params.transactionId !== undefined && params.transactionId !== null) {
    if (typeof params.transactionId !== 'string') {
      throw new ValidationError('交易ID必须是字符串类型');
    }
    if (params.transactionId.length > 256) {
      throw new ValidationError('交易ID长度不能超过256个字符');
    }
  }

  // 验证备注（可选）
  if (params.remark !== undefined && params.remark !== null) {
    if (typeof params.remark !== 'string') {
      throw new ValidationError('备注必须是字符串类型');
    }
    if (params.remark.length > 500) {
      throw new ValidationError('备注长度不能超过500个字符');
    }
  }
}

/**
 * 验证转账参数
 * @param params 转账参数
 * @throws ValidationError 如果转账参数无效
 */
export function validateTransferParams(params: {
  fromUserId: any;
  toUserId: any;
  amount: any;
  description: any;
}): void {
  // 验证转出用户ID
  validateUserId(params.fromUserId);

  // 验证转入用户ID
  validateUserId(params.toUserId);

  // 验证转出和转入用户不能相同
  if (params.fromUserId === params.toUserId) {
    throw new ValidationError('转出和转入用户不能是同一用户');
  }

  // 验证金额
  validateAmount(params.amount, '转账金额');

  // 验证描述
  if (params.description !== undefined && params.description !== null) {
    if (typeof params.description !== 'string') {
      throw new ValidationError('转账描述必须是字符串类型');
    }
    if (params.description.length > 500) {
      throw new ValidationError('转账描述长度不能超过500个字符');
    }
  }
}

/**
 * 验证字符串长度
 * @param value 字符串值
 * @param fieldName 字段名
 * @param minLength 最小长度
 * @param maxLength 最大长度
 * @throws ValidationError 如果字符串长度无效
 */
export function validateStringLength(
  value: any,
  fieldName: string,
  minLength: number,
  maxLength: number
): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} 必须是字符串类型`);
  }

  if (value.length < minLength) {
    throw new ValidationError(`${fieldName} 长度不能少于${minLength}个字符`);
  }

  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} 长度不能超过${maxLength}个字符`);
  }
}

/**
 * 验证枚举值
 * @param value 枚举值
 * @param enumObject 枚举对象
 * @param fieldName 字段名
 * @throws ValidationError 如果枚举值无效
 */
export function validateEnumValue(value: any, enumObject: any, fieldName: string): void {
  const validValues = Object.values(enumObject);
  if (!validValues.includes(value)) {
    throw new ValidationError(`${fieldName} 必须是以下值之一: ${validValues.join(', ')}`);
  }
}

/**
 * 验证可选参数（如果提供了值，则进行验证）
 * @param value 参数值
 * @param validator 验证函数
 */
export function validateOptional(value: any, validator: (value: any) => void): void {
  if (value !== undefined && value !== null) {
    validator(value);
  }
}
