# API 完整参考文档

> 金币交易协议 API v1.0 完整接口文档

## 📌 基本信息

### API 基础 URL

| 环境 | URL |
|------|-----|
| Sandbox | `https://api-sandbox.coinexchange.io/v1` |
| Production | `https://api.coinexchange.io/v1` |

### 请求格式

- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`
- **时间格式**: ISO 8601 (`2026-02-28T20:28:13Z`)
- **时区**: UTC

## 🔐 认证机制

所有 API 请求都需要进行签名认证。

### 认证步骤

1. **构造签名字符串**
   ```
   HTTP_METHOD + "\n" +
   REQUEST_PATH + "\n" +
   QUERY_STRING + "\n" +
   TIMESTAMP + "\n" +
   REQUEST_BODY
   ```

2. **生成签名**
   ```javascript
   const crypto = require('crypto');
   
   function generateSignature(method, path, query, timestamp, body, secret) {
     const signString = `${method}\n${path}\n${query}\n${timestamp}\n${body}`;
     return crypto.createHmac('sha256', secret)
       .update(signString)
       .digest('hex');
   }
   ```

3. **请求头**
   ```
   X-API-KEY: your-api-key
   X-SIGNATURE: generated-signature
   X-TIMESTAMP: 1709152093
   ```

### 示例

```bash
curl -X GET "https://api.coinexchange.io/v1/account/balance" \
  -H "X-API-KEY: your-api-key" \
  -H "X-SIGNATURE: abc123def456..." \
  -H "X-TIMESTAMP: 1709152093" \
  -H "Content-Type: application/json"
```

---

## 📊 公共接口

### 1. 获取服务器时间

**GET** `/public/time`

获取 API 服务器当前时间。

#### 请求示例

```bash
GET /v1/public/time
```

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "serverTime": 1709152093,
    "isoTime": "2026-02-28T20:28:13Z"
  }
}
```

---

### 2. 获取交易对列表

**GET** `/public/symbols`

获取所有可交易的交易对信息。

#### 请求参数

无

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "symbol": "BTC_USDT",
      "baseAsset": "BTC",
      "quoteAsset": "USDT",
      "status": "TRADING",
      "minQty": "0.0001",
      "maxQty": "1000",
      "minPrice": "10000",
      "maxPrice": "100000",
      "pricePrecision": 2,
      "qtyPrecision": 4
    }
  ]
}
```

---

### 3. 获取市场行情

**GET** `/public/ticker`

获取交易对的最新行情数据。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 否 | 交易对，不传则返回所有 |

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "symbol": "BTC_USDT",
    "lastPrice": "42000.50",
    "high24h": "43000.00",
    "low24h": "41000.00",
    "volume24h": "1234.567",
    "quoteVolume24h": "51842340.12",
    "priceChange": "500.50",
    "priceChangePercent": "1.21",
    "timestamp": 1709152093
  }
}
```

---

### 4. 获取订单簿

**GET** `/public/orderbook`

获取指定交易对的深度数据。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 交易对 |
| limit | integer | 否 | 深度档位，默认 20，最大 100 |

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "symbol": "BTC_USDT",
    "bids": [
      ["42000.00", "1.234"],
      ["41999.50", "0.567"],
      ["41999.00", "2.345"]
    ],
    "asks": [
      ["42001.00", "1.456"],
      ["42001.50", "0.789"],
      ["42002.00", "3.210"]
    ],
    "timestamp": 1709152093
  }
}
```

---

### 5. 获取最近成交

**GET** `/public/trades`

获取指定交易对的最近成交记录。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 交易对 |
| limit | integer | 否 | 返回条数，默认 50，最大 500 |

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "tradeId": "123456789",
      "price": "42000.50",
      "qty": "0.125",
      "side": "BUY",
      "timestamp": 1709152093
    }
  ]
}
```

---

## 👤 账户接口

### 1. 获取账户信息

**GET** `/account/info`

获取当前账户的基本信息。

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accountId": "123456",
    "accountType": "SPOT",
    "status": "ACTIVE",
    "createdAt": "2026-01-01T00:00:00Z",
    "kycLevel": 2
  }
}
```

---

### 2. 获取账户余额

**GET** `/account/balance`

查询账户中所有资产的余额。

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "assets": [
      {
        "symbol": "BTC",
        "available": "1.23456789",
        "frozen": "0.10000000",
        "total": "1.33456789"
      },
      {
        "symbol": "USDT",
        "available": "50000.00",
        "frozen": "1000.00",
        "total": "51000.00"
      }
    ],
    "timestamp": 1709152093
  }
}
```

---

### 3. 获取单个资产余额

**GET** `/account/balance/{symbol}`

查询指定资产的余额。

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 资产符号，如 BTC, USDT |

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "symbol": "BTC",
    "available": "1.23456789",
    "frozen": "0.10000000",
    "total": "1.33456789"
  }
}
```

---

## 💱 交易接口

### 1. 创建订单

**POST** `/trade/order`

创建一个新的订单（限价单或市价单）。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 交易对，如 BTC_USDT |
| side | string | 是 | 买卖方向: BUY, SELL |
| type | string | 是 | 订单类型: LIMIT, MARKET |
| quantity | string | 是 | 数量 |
| price | string | 否 | 价格（限价单必填） |
| clientOrderId | string | 否 | 客户端订单ID，最长 36 字符 |

#### 请求示例

```json
{
  "symbol": "BTC_USDT",
  "side": "BUY",
  "type": "LIMIT",
  "quantity": "0.001",
  "price": "40000",
  "clientOrderId": "my-order-123"
}
```

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "123456789012345678",
    "clientOrderId": "my-order-123",
    "symbol": "BTC_USDT",
    "side": "BUY",
    "type": "LIMIT",
    "status": "NEW",
    "price": "40000",
    "quantity": "0.001",
    "filledQty": "0",
    "avgPrice": "0",
    "createdAt": "2026-02-28T20:28:13Z"
  }
}
```

---

### 2. 查询订单

**GET** `/trade/order/{orderId}`

根据订单ID查询订单详情。

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderId | string | 是 | 订单ID |

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "123456789012345678",
    "clientOrderId": "my-order-123",
    "symbol": "BTC_USDT",
    "side": "BUY",
    "type": "LIMIT",
    "status": "FILLED",
    "price": "40000",
    "quantity": "0.001",
    "filledQty": "0.001",
    "avgPrice": "39999.50",
    "fee": "0.000001",
    "feeCurrency": "BTC",
    "createdAt": "2026-02-28T20:28:13Z",
    "updatedAt": "2026-02-28T20:28:15Z"
  }
}
```

---

### 3. 查询订单（客户端ID）

**GET** `/trade/order/by-client-id/{clientOrderId}`

根据客户端订单ID查询订单详情。

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientOrderId | string | 是 | 客户端订单ID |

---

### 4. 取消订单

**DELETE** `/trade/order/{orderId}`

取消一个未完成的订单。

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderId | string | 是 | 订单ID |

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "123456789012345678",
    "status": "CANCELED",
    "canceledAt": "2026-02-28T20:30:00Z"
  }
}
```

---

### 5. 查询当前订单

**GET** `/trade/open-orders`

查询当前未完成的订单列表。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 否 | 交易对，不传则返回所有 |
| limit | integer | 否 | 返回条数，默认 50，最大 500 |

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "orderId": "123456789012345678",
      "symbol": "BTC_USDT",
      "side": "BUY",
      "type": "LIMIT",
      "status": "NEW",
      "price": "40000",
      "quantity": "0.001",
      "filledQty": "0",
      "createdAt": "2026-02-28T20:28:13Z"
    }
  ]
}
```

---

### 6. 查询历史订单

**GET** `/trade/history`

查询历史订单记录。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 否 | 交易对 |
| startTime | long | 否 | 起始时间戳（毫秒） |
| endTime | long | 否 | 结束时间戳（毫秒） |
| limit | integer | 否 | 返回条数，默认 50，最大 500 |

---

### 7. 查询成交记录

**GET** `/trade/my-trades`

查询账户的成交记录。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 交易对 |
| orderId | string | 否 | 订单ID |
| startTime | long | 否 | 起始时间戳（毫秒） |
| endTime | long | 否 | 结束时间戳（毫秒） |
| limit | integer | 否 | 返回条数，默认 50，最大 500 |

---

## 🪙 充值提现接口

> ⚠️ **注意**: 此部分接口需要特殊权限，请联系客服开通。

### 1. 获取充值地址

**GET** `/wallet/deposit/address`

获取指定币种的充值地址。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 币种符号 |
| network | string | 否 | 网络类型 |

---

### 2. 查询充值记录

**GET** `/wallet/deposit/history`

查询充值记录。

---

### 3. 提币申请

**POST** `/wallet/withdraw`

发起提币请求。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 币种符号 |
| network | string | 是 | 网络类型 |
| address | string | 是 | 提币地址 |
| amount | string | 是 | 提币数量 |
| memo | string | 否 | 标签/备注（部分币种需要） |

---

### 4. 查询提现记录

**GET** `/wallet/withdraw/history`

查询提现记录。

---

## 📡 WebSocket 接口

### 连接地址

| 环境 | URL |
|------|-----|
| Sandbox | `wss://ws-sandbox.coinexchange.io/v1/stream` |
| Production | `wss://ws.coinexchange.io/v1/stream` |

### 订阅示例

```javascript
const ws = new WebSocket('wss://ws.coinexchange.io/v1/stream');

ws.onopen = () => {
  // 订阅行情
  ws.send(JSON.stringify({
    method: "SUBSCRIBE",
    params: ["btcusdt@ticker"],
    id: 1
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

### 可用频道

- `{symbol}@ticker` - 实时行情
- `{symbol}@depth` - 深度数据
- `{symbol}@trade` - 成交记录
- `{symbol}@kline_{interval}` - K线数据

---

## 📏 限流规则

### 请求限制

| 接口类型 | 限制 | 时间窗口 |
|---------|------|---------|
| 公共接口 | 100 次/秒 | 滑动窗口 |
| 私有接口 | 50 次/秒 | 滑动窗口 |
| 交易接口 | 20 次/秒 | 滑动窗口 |

### 响应头

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709152153
```

---

## ⚠️ 错误处理

所有错误响应格式：

```json
{
  "code": 40001,
  "message": "Invalid API key",
  "data": null
}
```

完整错误码请参考 [错误码说明](./error-codes.md)。

---

## 📚 相关文档

- [快速开始指南](./quick-start.md)
- [SDK 使用说明](./sdk-guide.md)
- [最佳实践](./best-practices.md)
- [常见问题](./faq.md)
