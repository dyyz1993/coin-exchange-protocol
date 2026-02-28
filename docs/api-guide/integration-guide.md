# 集成指南

> 金币交易协议 API 集成完整指南

## 📋 目录

- [环境准备](#环境准备)
- [签名验证](#签名验证)
- [SDK 集成](#sdk-集成)
- [使用场景](#使用场景)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 🛠️ 环境准备

### 1. 获取 API Key

访问开发者控制台获取 API Key：

1. 登录 [开发者控制台](https://console.coinexchange.io)
2. 完成 KYC 身份验证
3. 进入「API 管理」页面
4. 点击「创建 API Key」
5. 设置权限和 IP 白名单
6. 保存 API Key 和 Secret

> ⚠️ **重要**: API Secret 只显示一次，请妥善保存！

### 2. 配置权限

根据业务需求配置 API 权限：

| 权限类型 | 说明 | 使用场景 |
|---------|------|---------|
| Read | 读取账户信息、行情数据 | 查询余额、市场监控 |
| Trade | 创建/取消订单 | 自动交易、量化策略 |
| Withdraw | 提现操作 | 资金归集、自动提现 |

### 3. 设置 IP 白名单

为提高安全性，建议设置 IP 白名单：

```bash
# 查看服务器公网 IP
curl ifconfig.me

# 在控制台添加到白名单
# 支持单个 IP 或 CIDR 格式 (例如: 192.168.1.0/24)
```

---

## 🔐 签名验证

所有私有接口都需要签名验证。

### 签名算法

#### 步骤 1: 构造签名字符串

```
HTTP_METHOD + "\n" +
REQUEST_PATH + "\n" +
QUERY_STRING + "\n" +
TIMESTAMP + "\n" +
REQUEST_BODY
```

#### 步骤 2: 生成 HMAC-SHA256 签名

使用 API Secret 作为密钥，对签名字符串进行 HMAC-SHA256 运算。

#### 步骤 3: 添加请求头

```
X-API-KEY: your-api-key
X-SIGNATURE: generated-signature
X-TIMESTAMP: current-timestamp
```

### 多语言实现

#### JavaScript/TypeScript

```javascript
const crypto = require('crypto');

function generateSignature(method, path, query, timestamp, body, secret) {
  // 构造签名字符串
  const signString = [
    method.toUpperCase(),
    path,
    query || '',
    timestamp.toString(),
    body ? JSON.stringify(body) : ''
  ].join('\n');
  
  // 生成 HMAC-SHA256 签名
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex');
  
  return signature;
}

// 使用示例
const apiKey = 'your-api-key';
const apiSecret = 'your-api-secret';
const timestamp = Date.now();
const method = 'GET';
const path = '/v1/account/balance';
const query = '';
const body = null;

const signature = generateSignature(method, path, query, timestamp, body, apiSecret);

// 发送请求
fetch('https://api.coinexchange.io/v1/account/balance', {
  method: 'GET',
  headers: {
    'X-API-KEY': apiKey,
    'X-SIGNATURE': signature,
    'X-TIMESTAMP': timestamp.toString(),
    'Content-Type': 'application/json'
  }
});
```

#### Python

```python
import hmac
import hashlib
import time
import requests

def generate_signature(method, path, query, timestamp, body, secret):
    """生成 API 签名"""
    # 构造签名字符串
    body_str = json.dumps(body) if body else ''
    sign_string = f"{method}\n{path}\n{query}\n{timestamp}\n{body_str}"
    
    # 生成 HMAC-SHA256 签名
    signature = hmac.new(
        secret.encode('utf-8'),
        sign_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return signature

# 使用示例
api_key = 'your-api-key'
api_secret = 'your-api-secret'
timestamp = int(time.time() * 1000)
method = 'GET'
path = '/v1/account/balance'
query = ''
body = None

signature = generate_signature(method, path, query, timestamp, body, api_secret)

# 发送请求
response = requests.get(
    'https://api.coinexchange.io/v1/account/balance',
    headers={
        'X-API-KEY': api_key,
        'X-SIGNATURE': signature,
        'X-TIMESTAMP': str(timestamp),
        'Content-Type': 'application/json'
    }
)
```

#### Go

```go
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

func generateSignature(method, path, query string, timestamp int64, body string, secret string) string {
	// 构造签名字符串
	signString := fmt.Sprintf("%s\n%s\n%s\n%d\n%s", 
		method, path, query, timestamp, body)
	
	// 生成 HMAC-SHA256 签名
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signString))
	signature := hex.EncodeToString(mac.Sum(nil))
	
	return signature
}

func main() {
	apiKey := "your-api-key"
	apiSecret := "your-api-secret"
	timestamp := time.Now().UnixMilli()
	method := "GET"
	path := "/v1/account/balance"
	query := ""
	body := ""
	
	signature := generateSignature(method, path, query, timestamp, body, apiSecret)
	
	// 创建请求
	req, _ := http.NewRequest("GET", "https://api.coinexchange.io/v1/account/balance", nil)
	req.Header.Set("X-API-KEY", apiKey)
	req.Header.Set("X-SIGNATURE", signature)
	req.Header.Set("X-TIMESTAMP", strconv.FormatInt(timestamp, 10))
	req.Header.Set("Content-Type", "application/json")
	
	// 发送请求...
}
```

### 签名注意事项

1. **时间戳**: 必须使用毫秒级时间戳（13位）
2. **时间窗口**: 请求时间戳与服务器时间相差不能超过 ±30 秒
3. **参数顺序**: 查询字符串参数需按字母顺序排序
4. **空值处理**: 空字符串和空对象要用空字符串表示
5. **编码**: 所有字符串使用 UTF-8 编码

---

## 📦 SDK 集成

### JavaScript/TypeScript

```bash
npm install @coin-exchange/sdk
```

```javascript
const { CoinExchangeClient } = require('@coin-exchange/sdk');

// 初始化客户端
const client = new CoinExchangeClient({
  apiKey: process.env.COIN_EXCHANGE_API_KEY,
  apiSecret: process.env.COIN_EXCHANGE_API_SECRET,
  environment: 'production', // 或 'sandbox'
  timeout: 10000, // 请求超时时间（毫秒）
});

// 查询余额
async function getBalance() {
  try {
    const balance = await client.account.getBalance();
    console.log('账户余额:', balance);
  } catch (error) {
    console.error('查询失败:', error);
  }
}

// 创建订单
async function createOrder() {
  try {
    const order = await client.trade.createOrder({
      symbol: 'BTC_USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '0.001',
      price: '40000',
    });
    console.log('订单创建成功:', order);
  } catch (error) {
    console.error('订单创建失败:', error);
  }
}
```

### Python

```bash
pip install coin-exchange-sdk
```

```python
from coin_exchange import Client
import os

# 初始化客户端
client = Client(
    api_key=os.getenv('COIN_EXCHANGE_API_KEY'),
    api_secret=os.getenv('COIN_EXCHANGE_API_SECRET'),
    environment='production'
)

# 查询余额
def get_balance():
    try:
        balance = client.account.get_balance()
        print('账户余额:', balance)
    except Exception as e:
        print('查询失败:', e)

# 创建订单
def create_order():
    try:
        order = client.trade.create_order(
            symbol='BTC_USDT',
            side='BUY',
            type='LIMIT',
            quantity='0.001',
            price='40000'
        )
        print('订单创建成功:', order)
    except Exception as e:
        print('订单创建失败:', e)
```

---

## 🎯 使用场景

### 场景 1: 简单交易机器人

```javascript
class SimpleTradingBot {
  constructor(client, symbol) {
    this.client = client;
    this.symbol = symbol;
  }
  
  async run() {
    // 1. 获取当前价格
    const ticker = await this.client.market.getTicker(this.symbol);
    const currentPrice = parseFloat(ticker.lastPrice);
    
    // 2. 策略判断
    if (this.shouldBuy(currentPrice)) {
      await this.placeBuyOrder(currentPrice);
    } else if (this.shouldSell(currentPrice)) {
      await this.placeSellOrder(currentPrice);
    }
  }
  
  shouldBuy(price) {
    // 简单策略：价格低于阈值时买入
    return price < 40000;
  }
  
  shouldSell(price) {
    // 简单策略：价格高于阈值时卖出
    return price > 45000;
  }
  
  async placeBuyOrder(price) {
    const order = await this.client.trade.createOrder({
      symbol: this.symbol,
      side: 'BUY',
      type: 'LIMIT',
      quantity: '0.001',
      price: price.toString(),
    });
    console.log('买入订单:', order.orderId);
  }
  
  async placeSellOrder(price) {
    const order = await this.client.trade.createOrder({
      symbol: this.symbol,
      side: 'SELL',
      type: 'LIMIT',
      quantity: '0.001',
      price: price.toString(),
    });
    console.log('卖出订单:', order.orderId);
  }
}

// 运行机器人
const bot = new SimpleTradingBot(client, 'BTC_USDT');
setInterval(() => bot.run(), 60000); // 每分钟执行一次
```

### 场景 2: 网格交易策略

```python
class GridTradingBot:
    def __init__(self, client, symbol, grid_num=10, grid_range=(40000, 50000)):
        self.client = client
        self.symbol = symbol
        self.grid_num = grid_num
        self.grid_range = grid_range
        self.grid_levels = self._calculate_grid_levels()
    
    def _calculate_grid_levels(self):
        """计算网格价格水平"""
        step = (self.grid_range[1] - self.grid_range[0]) / self.grid_num
        return [self.grid_range[0] + i * step for i in range(self.grid_num + 1)]
    
    async def place_grid_orders(self):
        """在各个网格水平放置订单"""
        balance = await self.client.account.get_balance('USDT')
        available = float(balance.available)
        
        # 在每个网格水平放置买单
        for i, price in enumerate(self.grid_levels[:-1]):
            next_price = self.grid_levels[i + 1]
            quantity = (available / self.grid_num) / next_price
            
            await self.client.trade.create_order(
                symbol=self.symbol,
                side='BUY',
                type='LIMIT',
                quantity=f"{quantity:.6f}",
                price=f"{next_price:.2f}"
            )
            print(f"买单 #{i+1}: {quantity:.6f} @ {next_price:.2f}")
    
    async def monitor_and_adjust(self):
        """监控订单并调整网格"""
        open_orders = await self.client.trade.get_open_orders(self.symbol)
        
        for order in open_orders:
            if order.status == 'FILLED':
                # 订单成交后，在相反方向放置新订单
                await self._place_counter_order(order)
    
    async def _place_counter_order(self, filled_order):
        """放置反向订单"""
        side = 'SELL' if filled_order.side == 'BUY' else 'BUY'
        await self.client.trade.create_order(
            symbol=self.symbol,
            side=side,
            type='LIMIT',
            quantity=filled_order.filledQty,
            price=filled_order.price
        )
```

### 场景 3: 实时行情监控

```javascript
const WebSocket = require('ws');

class MarketMonitor {
  constructor(symbol) {
    this.symbol = symbol;
    this.ws = null;
  }
  
  connect() {
    this.ws = new WebSocket('wss://ws.coinexchange.io/v1/stream');
    
    this.ws.on('open', () => {
      console.log('WebSocket 已连接');
      
      // 订阅行情
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${this.symbol.toLowerCase()}@ticker`],
        id: 1
      }));
      
      // 订阅深度
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${this.symbol.toLowerCase()}@depth`],
        id: 2
      }));
    });
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleMessage(message);
    });
    
    this.ws.on('error', (error) => {
      console.error('WebSocket 错误:', error);
    });
    
    this.ws.on('close', () => {
      console.log('WebSocket 已断开，5秒后重连...');
      setTimeout(() => this.connect(), 5000);
    });
  }
  
  handleMessage(message) {
    if (message.e === 'ticker') {
      this.onTickerUpdate(message);
    } else if (message.e === 'depthUpdate') {
      this.onDepthUpdate(message);
    }
  }
  
  onTickerUpdate(ticker) {
    console.log(`${this.symbol} 价格: ${ticker.c} | 涨跌: ${ticker.P}%`);
  }
  
  onDepthUpdate(depth) {
    console.log(`买单深度: ${depth.b.length} | 卖单深度: ${depth.a.length}`);
  }
}

// 启动监控
const monitor = new MarketMonitor('BTC_USDT');
monitor.connect();
```

---

## 💡 最佳实践

### 1. 错误处理

```javascript
async function robustApiCall(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      // 限流错误，等待后重试
      if (error.code === 429) {
        const waitTime = Math.pow(2, i) * 1000; // 指数退避
        console.log(`触发限流，等待 ${waitTime}ms 后重试...`);
        await sleep(waitTime);
        continue;
      }
      
      // 服务器错误，重试
      if (error.code >= 500 && error.code < 600) {
        console.log(`服务器错误 (${error.code})，重试 ${i + 1}/${retries}`);
        await sleep(1000);
        continue;
      }
      
      // 其他错误，直接抛出
      throw error;
    }
  }
  
  throw new Error('重试次数已用尽');
}

// 使用示例
try {
  const order = await robustApiCall(() => 
    client.trade.createOrder({ /* ... */ })
  );
} catch (error) {
  console.error('订单创建最终失败:', error);
}
```

### 2. 限流管理

```javascript
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }
  
  async acquire() {
    const now = Date.now();
    
    // 移除过期的请求记录
    this.requests = this.requests.filter(
      time => now - time < this.timeWindow
    );
    
    // 如果达到限制，等待
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      console.log(`达到限流，等待 ${waitTime}ms`);
      await sleep(waitTime);
      return this.acquire();
    }
    
    this.requests.push(now);
  }
}

// 使用示例
const limiter = new RateLimiter(50, 1000); // 50次/秒

async function placeOrderWithRateLimit(params) {
  await limiter.acquire();
  return client.trade.createOrder(params);
}
```

### 3. 安全存储

```javascript
// ❌ 不要硬编码密钥
const apiKey = 'abc123'; // 错误！

// ✅ 使用环境变量
const apiKey = process.env.COIN_EXCHANGE_API_KEY;
const apiSecret = process.env.COIN_EXCHANGE_API_SECRET;

// ✅ 或使用密钥管理服务
const { SecretsManager } = require('@aws-sdk/client-secrets-manager');

async function getApiKeys() {
  const client = new SecretsManager({ region: 'us-east-1' });
  const response = await client.getSecretValue({
    SecretId: 'coin-exchange-api-keys'
  });
  return JSON.parse(response.SecretString);
}
```

---

## ❓ 常见问题

### Q1: 签名验证失败怎么办？

**A:** 检查以下几点：
1. 时间戳是否为毫秒级（13位）
2. 请求参数是否按字母顺序排序
3. 空值是否正确处理
4. API Secret 是否正确
5. 本地时间是否准确

### Q2: 如何处理网络超时？

**A:** 设置合理的超时时间，并实现重试机制：

```javascript
const client = new CoinExchangeClient({
  apiKey: '...',
  apiSecret: '...',
  timeout: 10000, // 10秒超时
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  }
});
```

### Q3: 如何调试 API 请求？

**A:** 启用调试模式：

```javascript
const client = new CoinExchangeClient({
  apiKey: '...',
  apiSecret: '...',
  debug: true, // 输出详细日志
});
```

### Q4: 如何保证订单幂等性？

**A:** 使用 `clientOrderId`：

```javascript
const order = await client.trade.createOrder({
  symbol: 'BTC_USDT',
  side: 'BUY',
  type: 'LIMIT',
  quantity: '0.001',
  price: '40000',
  clientOrderId: `order_${Date.now()}_${Math.random()}` // 唯一ID
});

// 如果请求失败，可以使用相同的 clientOrderId 重试
```

---

## 📚 相关文档

- [快速开始指南](./quick-start.md)
- [API 参考文档](./api-reference.md)
- [SDK 使用说明](./sdk-guide.md)
- [最佳实践](./best-practices.md)
- [常见问题](./faq.md)

---

## 📞 技术支持

- 📧 Email: support@coinexchange.io
- 💬 Discord: [开发者社区](https://discord.gg/coinexchange)
- 📖 文档: https://docs.coinexchange.io
- 🐛 问题反馈: [GitHub Issues](https://github.com/coin-exchange/api-docs/issues)
