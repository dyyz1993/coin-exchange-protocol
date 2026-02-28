# 常见问题（FAQ）

> 金币交易协议 API 使用常见问题解答

## 🔐 认证相关

### Q1: 如何获取 API Key？

**A:** 按照以下步骤获取：

1. 登录 [开发者控制台](#)
2. 完成 KYC 身份验证
3. 进入「API 管理」页面
4. 点击「创建 API Key」
5. 设置权限和 IP 白名单
6. 保存 API Key 和 Secret（Secret 只显示一次！）

> ⚠️ **重要**: API Secret 只会在创建时显示一次，请妥善保存！

---

### Q2: 为什么我的 API 请求返回 40001 错误？

**A:** 错误码 40001 表示 API Key 无效，可能原因：

- API Key 或 Secret 错误
- API Key 已被删除或禁用
- API Key 权限不足
- IP 不在白名单内

**解决方案:**

```javascript
// 1. 检查 API Key 格式
console.log('API Key:', process.env.API_KEY);
console.log('API Secret:', process.env.API_SECRET?.substring(0, 10) + '...');

// 2. 验证权限
const keyInfo = await client.account.getApiKeyInfo();
console.log('Permissions:', keyInfo.permissions);

// 3. 检查 IP 白名单
console.log('IP Whitelist:', keyInfo.ipWhitelist);
```

---

### Q3: 如何正确生成签名？

**A:** 签名生成步骤：

```javascript
const crypto = require('crypto');

function generateSignature(method, path, query, timestamp, body, secret) {
  // 1. 构造签名字符串
  const signString = `${method}\n${path}\n${query}\n${timestamp}\n${body}`;
  
  // 2. 使用 HMAC-SHA256 生成签名
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex');
  
  return signature;
}

// 示例
const method = 'GET';
const path = '/v1/account/balance';
const query = '';
const timestamp = Date.now().toString();
const body = '';
const signature = generateSignature(
  method, path, query, timestamp, body, 'your-api-secret'
);

console.log('Signature:', signature);
```

**常见错误:**

- ❌ 时间戳格式错误（应为毫秒）
- ❌ 查询参数未排序
- ❌ Body 为空时传了 `null` 而非空字符串
- ❌ 编码不一致（统一使用 UTF-8）

---

## 💰 交易相关

### Q4: 为什么创建订单时返回 40003 余额不足？

**A:** 可能原因：

1. **可用余额不足**: 检查 `available` 而非 `total`
2. **订单金额过小**: 低于最小交易额
3. **资产冻结**: 有未完成订单占用余额

**解决方案:**

```javascript
// 1. 查询可用余额
const balance = await client.account.getBalance('USDT');
console.log('Available:', balance.available); // 使用这个
console.log('Frozen:', balance.frozen);
console.log('Total:', balance.total);

// 2. 检查交易对限制
const symbol = await client.public.getSymbol('BTC_USDT');
console.log('Min Qty:', symbol.minQty);
console.log('Min Notional:', symbol.minNotional);

// 3. 计算订单金额
const price = '40000';
const qty = '0.001';
const amount = new Decimal(price).mul(qty).toString();
console.log('Order Amount:', amount);
```

---

### Q5: 如何查询订单的成交情况？

**A:** 使用以下方法：

```javascript
// 方法 1: 查询订单详情
const order = await client.trade.getOrder(orderId);
console.log('Filled Qty:', order.filledQty);
console.log('Avg Price:', order.avgPrice);
console.log('Status:', order.status);

// 方法 2: 查询成交记录
const trades = await client.trade.getMyTrades({
  symbol: 'BTC_USDT',
  orderId: orderId,
});

trades.forEach(trade => {
  console.log(`成交 ${trade.qty} @ ${trade.price}`);
  console.log(`手续费: ${trade.fee} ${trade.feeCurrency}`);
});
```

---

### Q6: 订单创建后状态一直是 NEW，为什么？

**A:** 订单状态说明：

| 状态 | 说明 |
|------|------|
| NEW | 订单已创建，等待成交 |
| PARTIALLY_FILLED | 部分成交 |
| FILLED | 完全成交 |
| CANCELED | 已取消 |
| EXPIRED | 已过期 |

**限价单**: 会一直保持 NEW 状态，直到：
- 有对手方以该价格成交
- 被手动取消
- 达到过期时间（如有设置）

**市价单**: 通常会立即成交（FILLED）或部分成交（PARTIALLY_FILLED）

```javascript
// 查询订单状态
const order = await client.trade.getOrder(orderId);

if (order.status === 'NEW') {
  console.log('订单等待成交中...');
  
  // 可以取消订单
  await client.trade.cancelOrder(orderId);
}
```

---

## 📡 WebSocket 相关

### Q7: WebSocket 连接经常断开怎么办？

**A:** 实现自动重连机制：

```javascript
class WebSocketManager {
  constructor(client) {
    this.client = client;
    this.ws = null;
    this.reconnectDelay = 1000;
    this.subscriptions = [];
  }
  
  connect() {
    this.ws = this.client.websocket;
    
    this.ws.on('disconnected', () => {
      console.log('WebSocket 断开，准备重连...');
      setTimeout(() => this.reconnect(), this.reconnectDelay);
    });
    
    this.ws.on('error', (error) => {
      console.error('WebSocket 错误:', error);
    });
    
    this.ws.connect();
  }
  
  reconnect() {
    console.log('正在重连...');
    this.connect();
    
    // 重新订阅
    this.subscriptions.forEach(sub => {
      this.ws.subscribe(sub.channel, sub.callback);
    });
  }
  
  subscribe(channel, callback) {
    this.subscriptions.push({ channel, callback });
    this.ws.subscribe(channel, callback);
  }
}

// 使用
const wsManager = new WebSocketManager(client);
wsManager.connect();
wsManager.subscribe('BTC_USDT@ticker', (data) => {
  console.log('Ticker:', data);
});
```

---

### Q8: 如何订阅多个交易对的实时数据？

**A:** 批量订阅：

```javascript
// 订阅多个行情
const symbols = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];

symbols.forEach(symbol => {
  client.websocket.subscribeTicker(symbol, (ticker) => {
    console.log(`${symbol}: ${ticker.lastPrice}`);
  });
});

// 或使用通配符（如果支持）
client.websocket.subscribeTicker('*', (ticker) => {
  console.log(`${ticker.symbol}: ${ticker.lastPrice}`);
});
```

---

## 🚫 限流相关

### Q9: 遇到 42900 限流错误怎么办？

**A:** 实现限流控制：

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  async waitIfNeeded() {
    const now = Date.now();
    
    // 清理过期请求
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    // 检查是否超限
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      console.log(`达到限流，等待 ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}

// 使用
const limiter = new RateLimiter(20, 1000); // 20次/秒

async function createOrder(params) {
  await limiter.waitIfNeeded();
  return client.trade.createOrder(params);
}
```

---

### Q10: 如何提高 API 请求限制？

**A:** 联系客服申请提高限额：

1. 发送邮件至 `support@coinexchange.io`
2. 说明申请理由和使用场景
3. 提供预计的请求量
4. 通过审核后可获得更高限额

**提示**: 优化代码、使用 WebSocket、缓存数据可以大幅减少 REST API 请求量。

---

## 🐛 故障排查

### Q11: API 请求超时怎么办？

**A:** 检查以下方面：

1. **网络连接**: 确认能访问 API 域名
2. **DNS 解析**: 检查 DNS 是否正常
3. **防火墙**: 确认没有阻止 API 域名
4. **超时设置**: 增加超时时间

```javascript
// 测试连接
const ping = await client.public.getTime();
console.log('服务器时间:', ping);

// 增加超时时间
const client = new CoinExchangeClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  timeout: 30000, // 30 秒
});
```

---

### Q12: 为什么返回的数据格式和文档不一致？

**A:** 可能原因：

1. **API 版本**: 确认使用正确的 API 版本
2. **SDK 版本**: 升级到最新版 SDK
3. **环境差异**: Sandbox 和 Production 可能有差异

**解决方案:**

```bash
# 升级 SDK
npm update @coin-exchange/sdk

# 检查版本
npm list @coin-exchange/sdk
```

---

## 📚 更多资源

- [API 完整参考](./api-reference.md)
- [错误码说明](./error-codes.md)
- [最佳实践](./best-practices.md)
- [示例代码](./examples/)

## 💬 获取帮助

- **文档**: docs.coinexchange.io
- **社区**: community.coinexchange.io
- **邮件**: support@coinexchange.io
- **工单**: 开发者控制台 → 帮助中心

---

**没有找到答案？** 请提交 Issue 或联系技术支持！
