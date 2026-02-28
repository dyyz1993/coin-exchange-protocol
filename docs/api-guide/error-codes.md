# 错误码说明

> 金币交易协议 API 错误码完整列表

## 📌 错误响应格式

所有 API 错误都使用统一的响应格式：

```json
{
  "code": 40001,
  "message": "Invalid API key",
  "data": null
}
```

- **code**: 错误码（整数）
- **message**: 错误描述（字符串）
- **data**: 附加数据（可能为 null）

---

## 🔐 认证错误 (40000-40100)

### 40001 - Invalid API key

**说明**: API Key 无效

**可能原因**:
- API Key 格式错误
- API Key 已被删除
- API Key 不存在

**解决方案**:
```javascript
// 检查 API Key 格式
console.log('API Key:', process.env.API_KEY);

// 在控制台验证 API Key 状态
```

---

### 40002 - Invalid signature

**说明**: 签名验证失败

**可能原因**:
- 签名算法错误
- 时间戳过期（超过 5 秒）
- 参数顺序错误

**解决方案**:
```javascript
// 1. 检查时间戳
const timestamp = Date.now();
console.log('Timestamp:', timestamp);

// 2. 验证签名算法
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(signString)
  .digest('hex');

// 3. 确保参数已排序
const sortedQuery = Object.keys(params)
  .sort()
  .map(k => `${k}=${params[k]}`)
  .join('&');
```

---

### 40003 - Invalid timestamp

**说明**: 时间戳无效或过期

**可能原因**:
- 时间戳不是毫秒
- 时间戳与服务器时间相差超过 5 秒

**解决方案**:
```javascript
// 使用毫秒时间戳
const timestamp = Date.now().toString();

// 同步服务器时间
const serverTime = await client.public.getTime();
const diff = Math.abs(Date.now() - serverTime.serverTime);
if (diff > 5000) {
  console.warn('本地时间与服务器时间偏差:', diff, 'ms');
}
```

---

### 40004 - API key expired

**说明**: API Key 已过期

**解决方案**: 在开发者控制台重新创建 API Key

---

### 40005 - IP not in whitelist

**说明**: 请求 IP 不在白名单内

**解决方案**:
```javascript
// 查看当前 IP
const response = await fetch('https://api.ipify.org?format=json');
const { ip } = await response.json();
console.log('Your IP:', ip);

// 在控制台添加 IP 到白名单
```

---

### 40006 - Insufficient permissions

**说明**: API Key 权限不足

**解决方案**: 在开发者控制台为 API Key 添加所需权限

---

## 💰 交易错误 (41000-41200)

### 41001 - Insufficient balance

**说明**: 余额不足

**解决方案**:
```javascript
// 查询可用余额
const balance = await client.account.getBalance('USDT');
console.log('Available:', balance.available);

// 检查订单金额
const amount = new Decimal(price).mul(qty);
if (amount.greaterThan(balance.available)) {
  throw new Error('余额不足');
}
```

---

### 41002 - Invalid symbol

**说明**: 交易对不存在或已下线

**解决方案**:
```javascript
// 查询可用交易对
const symbols = await client.public.getSymbols();
const symbolList = symbols.map(s => s.symbol);
console.log('Available symbols:', symbolList);
```

---

### 41003 - Invalid quantity

**说明**: 数量无效

**可能原因**:
- 数量小于最小值
- 数量大于最大值
- 精度不符合要求

**解决方案**:
```javascript
// 查询交易对限制
const symbol = await client.public.getSymbol('BTC_USDT');
console.log('Min Qty:', symbol.minQty);
console.log('Max Qty:', symbol.maxQty);
console.log('Qty Precision:', symbol.qtyPrecision);

// 调整数量
const qty = '0.001';
if (parseFloat(qty) < parseFloat(symbol.minQty)) {
  throw new Error(`数量不能小于 ${symbol.minQty}`);
}
```

---

### 41004 - Invalid price

**说明**: 价格无效

**可能原因**:
- 价格小于最小值
- 价格大于最大值
- 精度不符合要求
- 市价单不应指定价格

**解决方案**:
```javascript
// 检查价格范围
const symbol = await client.public.getSymbol('BTC_USDT');
if (parseFloat(price) < parseFloat(symbol.minPrice)) {
  throw new Error(`价格不能小于 ${symbol.minPrice}`);
}

// 市价单不要传 price 参数
await client.trade.createOrder({
  symbol: 'BTC_USDT',
  side: 'BUY',
  type: 'MARKET',
  quantity: '0.001',
  // 不要传 price
});
```

---

### 41005 - Order not found

**说明**: 订单不存在

**解决方案**:
```javascript
// 确认订单 ID 正确
console.log('Order ID:', orderId);

// 查询订单
try {
  const order = await client.trade.getOrder(orderId);
  console.log(order);
} catch (error) {
  if (error.code === 41005) {
    console.log('订单不存在或已过期');
  }
}
```

---

### 41006 - Order already canceled

**说明**: 订单已取消，不能重复取消

---

### 41007 - Order already filled

**说明**: 订单已完成，不能取消

---

### 41008 - Order status invalid

**说明**: 订单状态不允许此操作

---

### 41009 - Duplicate client order ID

**说明**: 客户端订单 ID 重复

**解决方案**:
```javascript
// 使用唯一的订单 ID
const clientOrderId = `order-${Date.now()}-${Math.random()}`;
```

---

### 41010 - Market order rejected

**说明**: 市价单被拒绝（可能是流动性不足）

---

## 🚫 限流错误 (42900-42999)

### 42900 - Rate limit exceeded

**说明**: 请求过于频繁，触发限流

**解决方案**:
```javascript
// 实现限流控制
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  async waitIfNeeded() {
    const now = Date.now();
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}

// 使用
const limiter = new RateLimiter(20, 1000); // 20次/秒
await limiter.waitIfNeeded();
```

---

### 42901 - IP rate limit exceeded

**说明**: IP 级别限流

**解决方案**: 降低请求频率或申请提高限额

---

### 42902 - Account rate limit exceeded

**说明**: 账户级别限流

---

## 🛠️ 服务器错误 (50000-50999)

### 50000 - Internal server error

**说明**: 服务器内部错误

**解决方案**: 
- 稍后重试
- 如果持续出现，联系技术支持

---

### 50001 - Service unavailable

**说明**: 服务暂时不可用

**解决方案**: 
- 检查 [API 状态页面](#)
- 稍后重试

---

### 50002 - Gateway timeout

**说明**: 网关超时

**解决方案**: 增加请求超时时间或稍后重试

---

### 50003 - Database error

**说明**: 数据库错误

---

## 🪙 钱包错误 (52000-52100)

### 52001 - Withdraw function disabled

**说明**: 提币功能未开启

**解决方案**: 在账户设置中开启提币功能

---

### 52002 - Invalid address

**说明**: 提币地址无效

---

### 52003 - Withdraw amount too small

**说明**: 提币金额过小

**解决方案**:
```javascript
// 查询提币限制
const withdrawInfo = await client.wallet.getWithdrawInfo('BTC');
console.log('Min Amount:', withdrawInfo.minAmount);
```

---

### 52004 - Withdraw amount exceeds limit

**说明**: 提币金额超过限制

---

### 52005 - Invalid network

**说明**: 网络类型无效

**解决方案**:
```javascript
// 查询支持的网络
const networks = await client.wallet.getSupportedNetworks('USDT');
console.log(networks); // ['ERC20', 'TRC20', 'BEP20']
```

---

### 52006 - Insufficient withdraw fee

**说明**: 余额不足以支付手续费

---

## 📋 错误码快速查询表

| 错误码范围 | 类别 | 说明 |
|-----------|------|------|
| 40000-40100 | 认证错误 | API Key、签名、权限等 |
| 41000-41200 | 交易错误 | 订单、余额、交易对等 |
| 42900-42999 | 限流错误 | 请求频率超限 |
| 50000-50999 | 服务器错误 | 服务端异常 |
| 52000-52100 | 钱包错误 | 充值提现相关 |

---

## 🔧 错误处理最佳实践

### 1. 统一错误处理

```javascript
async function apiCall(fn) {
  try {
    return await fn();
  } catch (error) {
    // 记录错误
    logger.error('API Error', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    
    // 根据错误码处理
    switch (Math.floor(error.code / 1000)) {
      case 40: // 认证和交易错误
        throw new BusinessError(error.message, error.code);
        
      case 42: // 限流错误
        await sleep(1000);
        return apiCall(fn); // 重试
        
      case 50: // 服务器错误
        throw new ServerError(error.message, error.code);
        
      default:
        throw error;
    }
  }
}
```

### 2. 错误分类

```javascript
class CoinExchangeError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'CoinExchangeError';
  }
  
  get isAuthError() {
    return this.code >= 40000 && this.code < 40100;
  }
  
  get isTradeError() {
    return this.code >= 41000 && this.code < 41200;
  }
  
  get isRateLimitError() {
    return this.code >= 42900 && this.code < 43000;
  }
  
  get isServerError() {
    return this.code >= 50000 && this.code < 51000;
  }
}
```

---

## 📚 相关文档

- [API 完整参考](./api-reference.md)
- [常见问题](./faq.md)
- [最佳实践](./best-practices.md)

---

**遇到未列出的错误码？** 请联系技术支持并提供错误码和请求详情。
