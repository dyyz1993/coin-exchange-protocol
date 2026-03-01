/**
 * API 请求限流中间件（Rate Limiting）
 * 
 * 功能：
 * - 基于 IP 的限流（100 请求/分钟）
 * - 基于用户 ID 的限流（200 请求/分钟）
 * - 超限返回 429 Too Many Requests
 * - 响应头包含限流信息
 */

/**
 * 限流配置
 */
interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 最大请求数 */
  maxRequests: number;
  /** 限流类型 */
  type: 'ip' | 'user';
}

/**
 * 请求记录
 */
interface RequestLog {
  /** 请求时间戳列表 */
  timestamps: number[];
  /** 最后清理时间 */
  lastCleanup: number;
}

/**
 * 限流结果
 */
export interface RateLimitResult {
  /** 是否允许通过 */
  allowed: boolean;
  /** 当前窗口内的请求数 */
  current: number;
  /** 最大请求数 */
  limit: number;
  /** 重置时间（Unix 时间戳，秒） */
  resetTime: number;
  /** 剩余请求数 */
  remaining: number;
  /** 限流类型 */
  type: 'ip' | 'user';
  /** 键值（IP 或用户 ID） */
  key: string;
}

/**
 * 默认配置
 */
const DEFAULT_IP_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 100, // 100 请求/分钟
  type: 'ip'
};

const DEFAULT_USER_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 200, // 200 请求/分钟（已认证用户更高配额）
  type: 'user'
};

/**
 * 内存存储
 */
class RateLimitStore {
  private ipStore = new Map<string, RequestLog>();
  private userStore = new Map<string, RequestLog>();
  
  /** 清理间隔（5分钟） */
  private cleanupInterval = 5 * 60 * 1000;
  private lastCleanup = Date.now();

  /**
   * 获取请求记录
   */
  private getStore(type: 'ip' | 'user'): Map<string, RequestLog> {
    return type === 'ip' ? this.ipStore : this.userStore;
  }

  /**
   * 获取或创建请求记录
   */
  getOrCreate(type: 'ip' | 'user', key: string): RequestLog {
    const store = this.getStore(type);
    let log = store.get(key);
    
    if (!log) {
      log = {
        timestamps: [],
        lastCleanup: Date.now()
      };
      store.set(key, log);
    }
    
    return log;
  }

  /**
   * 清理过期记录
   */
  cleanup(windowMs: number): void {
    const now = Date.now();
    
    // 定期清理
    if (now - this.lastCleanup < this.cleanupInterval) {
      return;
    }

    this.lastCleanup = now;
    const cutoff = now - windowMs;

    // 清理 IP 存储
    Array.from(this.ipStore.entries()).forEach(([key, log]) => {
      log.timestamps = log.timestamps.filter(ts => ts > cutoff);
      if (log.timestamps.length === 0) {
        this.ipStore.delete(key);
      }
    });

    // 清理用户存储
    Array.from(this.userStore.entries()).forEach(([key, log]) => {
      log.timestamps = log.timestamps.filter(ts => ts > cutoff);
      if (log.timestamps.length === 0) {
        this.userStore.delete(key);
      }
    });
  }

  /**
   * 获取统计信息
   */
  getStats(): { ipCount: number; userCount: number } {
    return {
      ipCount: this.ipStore.size,
      userCount: this.userStore.size
    };
  }
}

// 全局存储实例
const store = new RateLimitStore();

/**
 * 检查限流
 */
function checkRateLimit(
  type: 'ip' | 'user',
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // 获取或创建记录
  const log = store.getOrCreate(type, key);
  
  // 过滤出窗口内的请求
  log.timestamps = log.timestamps.filter(ts => ts > windowStart);
  
  // 当前请求数
  const current = log.timestamps.length;
  
  // 检查是否超限
  const allowed = current < config.maxRequests;
  
  // 如果允许，记录本次请求
  if (allowed) {
    log.timestamps.push(now);
  }
  
  // 计算重置时间（窗口结束时间）
  const resetTime = Math.ceil((now + config.windowMs) / 1000);
  
  // 计算剩余请求数
  const remaining = Math.max(0, config.maxRequests - current - (allowed ? 1 : 0));
  
  // 定期清理
  store.cleanup(config.windowMs);
  
  return {
    allowed,
    current: allowed ? current + 1 : current,
    limit: config.maxRequests,
    resetTime,
    remaining,
    type,
    key
  };
}

/**
 * 从请求中提取 IP 地址
 */
function extractIP(req: Request): string {
  // 尝试从 X-Forwarded-For 获取（反向代理场景）
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // 尝试从 X-Real-IP 获取
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // 默认返回 unknown（Bun 不提供直接访问客户端 IP 的方式）
  return 'unknown';
}

/**
 * 从请求中提取用户 ID（如果有）
 */
function extractUserID(req: Request): string | null {
  // 尝试从 Authorization 头获取
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) {
    // 这里应该解析 JWT token，暂时返回占位符
    // 实际项目中需要验证 token 并提取用户 ID
    return null;
  }
  
  // 尝试从查询参数获取（测试用）
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (userId) {
    return userId;
  }
  
  return null;
}

/**
 * 限流中间件主函数
 */
export function rateLimitMiddleware(
  req: Request,
  ipConfig: RateLimitConfig = DEFAULT_IP_CONFIG,
  userConfig: RateLimitConfig = DEFAULT_USER_CONFIG
): { allowed: boolean; result?: RateLimitResult; response?: Response } {
  // 提取标识符
  const ip = extractIP(req);
  const userId = extractUserID(req);
  
  // 优先使用用户 ID 限流（如果已认证）
  if (userId) {
    const result = checkRateLimit('user', userId, userConfig);
    
    if (!result.allowed) {
      return {
        allowed: false,
        result,
        response: new Response(JSON.stringify({
          success: false,
          error: 'Too Many Requests',
          message: `用户 ${userId} 请求过于频繁，请稍后再试`,
          retryAfter: Math.ceil((result.resetTime * 1000 - Date.now()) / 1000)
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'X-RateLimit-Type': 'user',
            'Retry-After': Math.ceil((result.resetTime * 1000 - Date.now()) / 1000).toString()
          }
        })
      };
    }
    
    return { allowed: true, result };
  }
  
  // 否则使用 IP 限流
  const result = checkRateLimit('ip', ip, ipConfig);
  
  if (!result.allowed) {
    return {
      allowed: false,
      result,
      response: new Response(JSON.stringify({
        success: false,
        error: 'Too Many Requests',
        message: `IP ${ip} 请求过于频繁，请稍后再试`,
        retryAfter: Math.ceil((result.resetTime * 1000 - Date.now()) / 1000)
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'X-RateLimit-Type': 'ip',
          'Retry-After': Math.ceil((result.resetTime * 1000 - Date.now()) / 1000).toString()
        }
      })
    };
  }
  
  return { allowed: true, result };
}

/**
 * 添加限流响应头
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetTime.toString());
  headers.set('X-RateLimit-Type', result.type);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * 获取限流统计信息（管理接口）
 */
export function getRateLimitStats(): {
  ipLimit: number;
  userLimit: number;
  windowMs: number;
  store: { ipCount: number; userCount: number };
} {
  return {
    ipLimit: DEFAULT_IP_CONFIG.maxRequests,
    userLimit: DEFAULT_USER_CONFIG.maxRequests,
    windowMs: DEFAULT_IP_CONFIG.windowMs,
    store: store.getStats()
  };
}
