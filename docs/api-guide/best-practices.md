# 最佳实践

> 金币交易协议 API 使用最佳实践指南

## 🔐 安全性

### 1. API Key 管理

#### ✅ 推荐做法

```javascript
// ✅ 使用环境变量
const client = new CoinExchangeClient({
  apiKey: process.env.COIN_EXCHANGE_API_KEY,
  apiSecret: process.env.COIN_EXCHANGE_API_SECRET,
  environment: 'production',
});
```

```bash
# .env 文件（不要提交到 Git）
COIN_EXCHANGE_API_KEY=your-api-key
COIN_EXCHANGE_API_SECRET=your-api-secret
```

```gitignore
# .gitignore
.env
.env.local
.env.production
```

#### ❌ 错误做法

```javascript
// ❌ 不要硬编码
const client = new CoinExchangeClient({
  apiKey: 'abcd1234efgh5678',  // 危险！
  apiSecret: 'secret123',      // 危险！
});

// ❌ 不要在前端代码中使用
// 前端代码会被用户看到，Secret 会泄露！
```

---

### 2. 权限最小化原则

只申请必要的权限：

```javascript
// ✅ 只读取数据
const readOnlyKey = {
  permissions: ['READ'],
  ipWhitelist: ['your-server-ip'],
};

// ✅ 只交易，不提币
const tradingKey = {
  permissions: ['READ', 'TRADE'],
  ipWhitelist: ['your-server-ip'],
};

// ❌ 不要为所有操作申请提币权限
const allPermissionsKey = {
  permissions: ['READ', 'TRADE', 'WITHDRAW'], // 危险！
};
```

---

### 3. IP 白名单

限制 API Key 只能从特定 IP 访问：

```javascript
// 在开发者控制台设置
const apiKeyConfig = {
  ipWhitelist: [
    '192.168.1.100',      // 生产服务器
    '10.0.0.50',          // 备用服务器
  ],
};
```

---

### 4. 敏感操作二次验证

对于提币等敏感操作，要求二次验证：

```javascript
async function withdrawFunds(symbol, address, amount) {
  // 1. 发送验证码到邮箱/手机
  const verifyCode = await sendVerificationCode();
  
  // 2. 用户输入验证码
  const userInput = await getUserInput('请输入验证码:');
  
  // 3. 验证通过后执行
  if (userInput === verifyCode) {
    return await client.wallet.withdraw({
      symbol,
      address,
      amount,
    });
  } else {
    throw new Error('验证码错误');
  }
}
```

---

## 📊 性能优化

### 1. 使用 WebSocket 替代轮询

#### ❌ 低效的轮询

```javascript
// 每 1 秒请求一次（不推荐）
setInterval(async () => {
  const ticker = await client.public.getTicker('BTC_USDT');
  console.log(ticker.lastPrice);
}, 1000);
```

#### ✅ 高效的 WebSocket

```javascript
// 实时推送（推荐）
client.websocket.subscribeTicker('BTC_USDT', (ticker) => {
  console.log(ticker.lastPrice);
});
```

---

### 2. 批量操作

避免频繁的单个请求：

#### ❌ 多次单独请求

```javascript
// 低效：多次请求
for (const symbol of symbols) {
  const ticker = await client.public.getTicker(symbol);
  console.log(ticker);
}
```

#### ✅ 批量请求

```javascript
// 高效：批量获取
const tickers = await client.public.getTickers(symbols);
console.log(tickers);
```

---

### 3. 数据缓存

缓存不常变化的数据：

```javascript
class CachedDataService {
  constructor(client) {
    this.client = client;
    this.cache = new Map();
    this.ttl = 60000; // 1 分钟缓存
  }
  
  async getSymbol(symbol) {
    const cacheKey = `symbol:${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const data = await this.client.public.getSymbol(symbol);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    
    return data;
  }
}
```

---

### 4. 并发控制

控制并发请求数量：

```javascript
class ConcurrencyLimiter {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.current = 0;
    this.queue = [];
  }
  
  async run(fn) {
    if (this.current >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.current++;
    try {
      return await fn();
    } finally {
      this.current--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

// 使用
const limiter = new ConcurrencyLimiter(10); // 最多 10 个并发

const orders = await Promise.all(
  orderList.map(order => 
    limiter.run(() => client.trade.createOrder(order))
  )
);
```

---

## ⚡ 错误处理

### 1. 统一错误处理

```javascript
class APIErrorHandler {
  constructor(client) {
    this.client = client;
    this.retryCount = 3;
    this.retryDelay = 1000;
  }
  
  async call(fn, retries = this.retryCount) {
    try {
      return await fn();
    } catch (error) {
      // 认证错误：不重试
      if (error.code >= 40000 && error.code < 40100) {
        throw new AuthenticationError(error.message, error.code);
      }
      
      // 限流错误：等待后重试
      if (error.code >= 42900 && error.code < 43000) {
        if (retries > 0) {
          await this.sleep(this.retryDelay * (this.retryCount - retries + 1));
          return this.call(fn, retries - 1);
        }
        throw new RateLimitError(error.message, error.code);
      }
      
      // 服务器错误：重试
      if (error.code >= 50000 && error.code < 51000) {
        if (retries > 0) {
          await this.sleep(this.retryDelay);
          return this.call(fn, retries - 1);
        }
        throw new ServerError(error.message, error.code);
      }
      
      // 其他错误
      throw error;
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

### 2. 优雅降级

```javascript
class TradingService {
  async getBestPrice(symbol) {
    try {
      // 尝试从 WebSocket 获取
      if (this.wsConnected) {
        return this.wsCache.get(symbol);
      }
    } catch (error) {
      console.warn('WebSocket 不可用，降级到 REST API');
    }
    
    // 降级到 REST API
    return await this.client.public.getTicker(symbol);
  }
}
```

---

### 3. 日志记录

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 包装 API 调用
async function loggedAPICall(fn, name) {
  const startTime = Date.now();
  try {
    const result = await fn();
    logger.info({
      method: name,
      duration: Date.now() - startTime,
      success: true,
    });
    return result;
  } catch (error) {
    logger.error({
      method: name,
      duration: Date.now() - startTime,
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    throw error;
  }
}
```

---

## 🔄 重试策略

### 指数退避

```javascript
async function retryWithBackoff(fn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // 不可重试的错误
      if (error.code >= 40000 && error.code < 50000) {
        throw error;
      }
      
      // 最后一次重试失败
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // 指数退避
      const delay = Math.pow(2, i) * 1000;
      console.log(`第 ${i + 1} 次重试，等待 ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 📈 监控和告警

### 1. 性能监控

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }
  
  record(method, duration, success) {
    if (!this.metrics.has(method)) {
      this.metrics.set(method, {
        count: 0,
        totalTime: 0,
        errors: 0,
      });
    }
    
    const metric = this.metrics.get(method);
    metric.count++;
    metric.totalTime += duration;
    if (!success) metric.errors++;
  }
  
  getStats(method) {
    const metric = this.metrics.get(method);
    if (!metric) return null;
    
    return {
      count: metric.count,
      avgTime: metric.totalTime / metric.count,
      errorRate: metric.errors / metric.count,
    };
  }
}
```

---

### 2. 异常告警

```javascript
class AlertService {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.alertThreshold = {
      errorRate: 0.1,  // 10% 错误率
      avgTime: 5000,   // 平均响应时间 > 5 秒
    };
  }
  
  async checkAndAlert(method, stats) {
    const alerts = [];
    
    if (stats.errorRate > this.alertThreshold.errorRate) {
      alerts.push(`高错误率: ${(stats.errorRate * 100).toFixed(2)}%`);
    }
    
    if (stats.avgTime > this.alertThreshold.avgTime) {
      alerts.push(`高延迟: ${stats.avgTime.toFixed(0)}ms`);
    }
    
    if (alerts.length > 0) {
      await this.sendAlert(method, alerts);
    }
  }
  
  async sendAlert(method, alerts) {
    const message = `⚠️ API 告警\n方法: ${method}\n问题:\n${alerts.join('\n')}`;
    
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  }
}
```

---

## 🧪 测试策略

### 1. 使用沙箱环境

```javascript
// 测试环境配置
const testClient = new CoinExchangeClient({
  apiKey: process.env.TEST_API_KEY,
  apiSecret: process.env.TEST_API_SECRET,
  environment: 'sandbox', // 使用沙箱
});

// 生产环境配置
const prodClient = new CoinExchangeClient({
  apiKey: process.env.PROD_API_KEY,
  apiSecret: process.env.PROD_API_SECRET,
  environment: 'production',
});
```

---

### 2. Mock 测试

```javascript
// 单元测试时 Mock API 响应
const mockClient = {
  trade: {
    createOrder: jest.fn().mockResolvedValue({
      orderId: 'test-order-id',
      status: 'NEW',
    }),
  },
};

test('创建订单成功', async () => {
  const order = await mockClient.trade.createOrder({
    symbol: 'BTC_USDT',
    side: 'BUY',
    type: 'LIMIT',
    quantity: '0.001',
    price: '40000',
  });
  
  expect(order.orderId).toBe('test-order-id');
});
```

---

## 📚 相关文档

- [API 完整参考](./api-reference.md)
- [SDK 使用说明](./sdk-guide.md)
- [常见问题](./faq.md)
- [错误码说明](./error-codes.md)
