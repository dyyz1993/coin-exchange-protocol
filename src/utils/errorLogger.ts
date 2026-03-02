/**
 * 错误日志工具
 * 用于安全地解析和记录错误信息
 */

export interface ParsedError {
  message: string;
  code?: string | number;
  stack?: string;
  details?: unknown;
}

/**
 * 安全地解析错误对象
 * 添加了完整的类型检查，防止运行时错误
 *
 * @param error - 未知类型的错误对象
 * @returns 解析后的错误信息对象
 */
export function parseError(error: unknown): ParsedError {
  // 处理 null 和 undefined
  if (error === null || error === undefined) {
    return {
      message: 'An unknown error occurred',
      details: error,
    };
  }

  // 处理 Error 类型（包括继承自 Error 的自定义错误）
  if (error instanceof Error) {
    const parsedError: ParsedError = {
      message: error.message || 'An error occurred',
      stack: error.stack,
    };

    // 安全地访问可能的额外属性
    const errorWithCode = error as Error & { code?: string | number };
    if (errorWithCode.code !== null && errorWithCode.code !== undefined) {
      parsedError.code = errorWithCode.code;
    }

    return parsedError;
  }

  // 处理字符串类型
  if (typeof error === 'string') {
    return {
      message: error || 'An error occurred',
    };
  }

  // 处理数字类型（错误码）
  if (typeof error === 'number') {
    return {
      message: `Error code: ${error}`,
      code: error,
    };
  }

  // 处理对象类型
  if (typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    const parsedError: ParsedError = {
      message: 'An object error occurred',
    };

    // 安全地提取 message
    if (typeof errorObj?.message === 'string') {
      parsedError.message = errorObj.message || 'An error occurred';
    }

    // 安全地提取 code
    if (typeof errorObj?.code === 'string' || typeof errorObj?.code === 'number') {
      parsedError.code = errorObj.code;
    }

    // 安全地提取 stack
    if (typeof errorObj?.stack === 'string') {
      parsedError.stack = errorObj.stack;
    }

    // 保存原始对象作为 details
    parsedError.details = error;

    return parsedError;
  }

  // 其他类型（function, symbol, bigint 等）
  return {
    message: `An unexpected error occurred: ${String(error)}`,
    details: error,
  };
}

/**
 * 记录错误到控制台
 *
 * @param error - 错误对象
 * @param context - 错误上下文信息
 */
export function logError(error: unknown, context?: string): void {
  const parsedError = parseError(error);

  const logData = {
    timestamp: new Date().toISOString(),
    context: context || 'Unknown',
    ...parsedError,
  };

  // 在开发环境输出详细错误
  if (process.env.NODE_ENV === 'development') {
    console.error('[ErrorLogger]', logData);
  } else {
    // 生产环境只输出关键信息
    console.error('[ErrorLogger]', {
      context: logData.context,
      message: logData.message,
      code: logData.code,
    });
  }
}

/**
 * 创建用户友好的错误消息
 *
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export function getUserFriendlyMessage(error: unknown): string {
  const parsedError = parseError(error);

  // 根据错误码或消息返回用户友好的提示
  if (parsedError.code) {
    switch (parsedError.code) {
      case 'INSUFFICIENT_BALANCE':
        return '余额不足，请检查您的账户余额';
      case 'FREEZE_FAILED':
        return '冻结失败，请稍后重试';
      case 'UNFREEZE_FAILED':
        return '解冻失败，请稍后重试';
      case 'TRANSFER_FAILED':
        return '转账失败，请稍后重试';
      case 'NETWORK_ERROR':
        return '网络错误，请检查您的网络连接';
      default:
        break;
    }
  }

  // 根据错误消息返回友好提示
  const message = parsedError.message.toLowerCase();
  if (message.includes('insufficient')) {
    return '余额不足，请检查您的账户余额';
  }
  if (message.includes('network') || message.includes('timeout')) {
    return '网络错误，请检查您的网络连接';
  }
  if (message.includes('unauthorized') || message.includes('forbidden')) {
    return '权限不足，请联系管理员';
  }
  if (message === 'an unknown error occurred') {
    return '操作失败，请稍后重试';
  }

  // 默认返回原始消息或通用提示
  return parsedError.message || '操作失败，请稍后重试';
}

/**
 * 判断是否为可重试的错误
 *
 * @param error - 错误对象
 * @returns 是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  const parsedError = parseError(error);

  // 网络错误、超时错误可以重试
  const message = parsedError.message.toLowerCase();
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('enotfound')
  ) {
    return true;
  }

  // 5xx 服务器错误可以重试
  if (typeof parsedError.code === 'number' && parsedError.code >= 500 && parsedError.code < 600) {
    return true;
  }

  return false;
}
