/**
 * Error Logger Utility
 *
 * 提供类型安全的错误日志记录和解析功能
 * Issue #332: 确保所有错误处理都有适当的类型检查和 null 安全
 */

/**
 * 错误信息接口
 */
export interface ParsedError {
  message: string;
  code?: string | number;
  stack?: string;
  name?: string;
  cause?: unknown;
}

/**
 * 类型安全地解析错误对象
 *
 * @param error - 未知类型的错误对象
 * @returns 解析后的错误信息对象
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const parsed = parseError(error);
 *   console.error(parsed.message);
 * }
 * ```
 */
export function parseError(error: unknown): ParsedError {
  // 处理 null 和 undefined
  if (error === null || error === undefined) {
    return {
      message: 'An unknown error occurred (null or undefined)',
      name: 'UnknownError',
    };
  }

  // 处理 Error 对象
  if (error instanceof Error) {
    return {
      message: error.message || 'An error occurred',
      name: error.name || 'Error',
      stack: error.stack,
      cause: error.cause,
      // 尝试提取错误代码
      code: extractErrorCode(error),
    };
  }

  // 处理字符串
  if (typeof error === 'string') {
    return {
      message: error || 'An empty error string was provided',
      name: 'StringError',
    };
  }

  // 处理数字
  if (typeof error === 'number') {
    return {
      message: `Error code: ${error}`,
      code: error,
      name: 'NumericError',
    };
  }

  // 处理布尔值
  if (typeof error === 'boolean') {
    return {
      message: `Boolean error: ${error}`,
      name: 'BooleanError',
    };
  }

  // 处理对象（可能包含 message 或 error 属性）
  if (typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;

    // 使用可选链和类型检查提取信息
    const message =
      typeof errorObj?.message === 'string'
        ? errorObj.message
        : typeof errorObj?.error === 'string'
          ? errorObj.error
          : 'An object error occurred';

    const code =
      typeof errorObj?.code === 'string' || typeof errorObj?.code === 'number'
        ? errorObj.code
        : undefined;

    const name = typeof errorObj?.name === 'string' ? errorObj.name : 'ObjectError';

    const stack = typeof errorObj?.stack === 'string' ? errorObj.stack : undefined;

    return {
      message,
      code,
      name,
      stack,
      cause: error,
    };
  }

  // 兜底处理（函数、symbol 等）
  return {
    message: `An unexpected error of type ${typeof error} occurred`,
    name: 'UnexpectedError',
    cause: error,
  };
}

/**
 * 从 Error 对象中提取错误代码
 */
function extractErrorCode(error: Error): string | number | undefined {
  // 检查常见的错误代码属性
  const errorWithCode = error as Error & { code?: unknown; status?: unknown; statusCode?: unknown };

  if (typeof errorWithCode.code === 'string' || typeof errorWithCode.code === 'number') {
    return errorWithCode.code;
  }

  if (typeof errorWithCode.status === 'string' || typeof errorWithCode.status === 'number') {
    return errorWithCode.status;
  }

  if (
    typeof errorWithCode.statusCode === 'string' ||
    typeof errorWithCode.statusCode === 'number'
  ) {
    return errorWithCode.statusCode;
  }

  return undefined;
}

/**
 * 记录错误到控制台（带时间戳和格式化）
 *
 * @param error - 错误对象
 * @param context - 可选的上下文信息
 *
 * @example
 * ```typescript
 * logError(new Error('Network failed'), { operation: 'fetchData', userId: '123' });
 * ```
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const parsed = parseError(error);
  const timestamp = new Date().toISOString();

  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`[${timestamp}] ERROR: ${parsed.name || 'UnknownError'}`);
  console.error(`Message: ${parsed.message}`);

  if (parsed.code !== undefined) {
    console.error(`Code: ${parsed.code}`);
  }

  if (context && typeof context === 'object' && Object.keys(context).length > 0) {
    console.error('Context:', context);
  }

  if (parsed.stack) {
    console.error('Stack trace:');
    console.error(parsed.stack);
  }

  if (parsed.cause) {
    console.error('Cause:', parsed.cause);
  }

  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * 格式化错误为用户友好的消息
 *
 * @param error - 错误对象
 * @returns 用户友好的错误消息字符串
 */
export function formatUserError(error: unknown): string {
  const parsed = parseError(error);

  // 移除技术细节，只返回用户友好的消息
  const userMessage = parsed.message;

  // 常见错误消息的友好化
  if (userMessage.includes('network') || userMessage.includes('Network')) {
    return '网络连接失败，请检查您的网络设置后重试';
  }

  if (userMessage.includes('timeout') || userMessage.includes('Timeout')) {
    return '请求超时，请稍后重试';
  }

  if (
    userMessage.includes('unauthorized') ||
    userMessage.includes('Unauthorized') ||
    parsed.code === 401
  ) {
    return '身份验证失败，请重新登录';
  }

  if (
    userMessage.includes('forbidden') ||
    userMessage.includes('Forbidden') ||
    parsed.code === 403
  ) {
    return '您没有权限执行此操作';
  }

  if (
    userMessage.includes('not found') ||
    userMessage.includes('Not Found') ||
    parsed.code === 404
  ) {
    return '请求的资源不存在';
  }

  // 默认消息
  return userMessage || '操作失败，请稍后重试';
}

/**
 * 创建带有上下文的错误
 *
 * @param message - 错误消息
 * @param context - 上下文信息
 * @returns Error 对象
 */
export function createContextualError(message: string, context?: Record<string, unknown>): Error {
  const error = new Error(message);

  if (context) {
    // 将上下文信息附加到错误对象
    Object.assign(error, { context });
  }

  return error;
}
