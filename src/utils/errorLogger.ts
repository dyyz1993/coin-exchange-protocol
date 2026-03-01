/**
 * 错误日志记录工具
 * 用于记录和管理前端错误
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  BUSINESS = 'BUSINESS',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorLog {
  id: string;
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
  userAgent: string;
  url: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  /**
   * 记录错误
   */
  log(type: ErrorType, message: string, details?: any): void {
    const errorLog: ErrorLog = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.logs.unshift(errorLog);

    // 保持日志数量不超过最大值
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // 输出到控制台（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorLogger]', errorLog);
    }

    // 可以在这里添加发送到服务器的逻辑
    // this.sendToServer(errorLog);
  }

  /**
   * 获取所有日志
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 根据类型获取日志
   */
  getLogsByType(type: ErrorType): ErrorLog[] {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * 发送错误日志到服务器（可选）
   */
  private async sendToServer(errorLog: ErrorLog): Promise<void> {
    try {
      // 模拟发送到服务器的 API 调用
      // await fetch('/api/error-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog),
      // });
      console.log('[ErrorLogger] Error log would be sent to server:', errorLog);
    } catch (error) {
      console.error('[ErrorLogger] Failed to send error log:', error);
    }
  }
}

// 导出单例实例
export const errorLogger = new ErrorLogger();

/**
 * 用户友好的错误消息映射
 */
export const UserFriendlyMessages: Record<string, string> = {
  // 网络错误
  NETWORK_ERROR: '网络连接失败，请检查您的网络设置',
  TIMEOUT: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器错误，请稍后重试',

  // 验证错误
  INVALID_AMOUNT: '请输入有效的金额',
  INVALID_ADDRESS: '请输入有效的地址',
  INSUFFICIENT_BALANCE: '余额不足，无法完成此操作',
  AMOUNT_TOO_LARGE: '金额超出限制',
  AMOUNT_TOO_SMALL: '金额低于最小限制',

  // 业务错误
  FREEZE_FAILED: '冻结操作失败，请重试',
  UNFREEZE_FAILED: '解冻操作失败，请重试',
  TRANSFER_FAILED: '转账失败，请重试',
  DEPOSIT_FAILED: '充值失败，请重试',
  WITHDRAW_FAILED: '提现失败，请重试',

  // 权限错误
  PERMISSION_DENIED: '您没有权限执行此操作',

  // 通用错误
  UNKNOWN_ERROR: '操作失败，请稍后重试',
};

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyMessage(errorCode: string, defaultMessage?: string): string {
  return UserFriendlyMessages[errorCode] || defaultMessage || UserFriendlyMessages.UNKNOWN_ERROR;
}

/**
 * 解析错误并返回用户友好的消息
 */
export function parseError(error: any): { code: string; message: string } {
  // 如果是网络错误
  if (!navigator.onLine) {
    return { code: 'NETWORK_ERROR', message: UserFriendlyMessages.NETWORK_ERROR };
  }

  // 如果是超时错误
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return { code: 'TIMEOUT', message: UserFriendlyMessages.TIMEOUT };
  }

  // 如果是服务器错误（5xx）
  if (error.status >= 500) {
    return { code: 'SERVER_ERROR', message: UserFriendlyMessages.SERVER_ERROR };
  }

  // 如果是权限错误（403）
  if (error.status === 403) {
    return { code: 'PERMISSION_DENIED', message: UserFriendlyMessages.PERMISSION_DENIED };
  }

  // 尝试从错误对象中提取错误代码
  const errorCode = error.code || error.errorCode || 'UNKNOWN_ERROR';
  const message = getUserFriendlyMessage(errorCode, error.message);

  return { code: errorCode, message };
}
