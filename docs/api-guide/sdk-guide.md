# SDK 使用说明

> 金币交易协议官方 SDK 使用指南

## 📦 可用 SDK

我们为多种编程语言提供官方 SDK：

| 语言 | 包名 | 版本 | 文档 |
|------|------|------|------|
| JavaScript/TypeScript | `@coin-exchange/sdk` | ![npm](https://img.shields.io/npm/v/@coin-exchange/sdk) | [查看](#javascripttypescript) |
| Python | `coin-exchange-sdk` | ![pypi](https://img.shields.io/pypi/v/coin-exchange-sdk) | [查看](#python) |
| Go | `github.com/coin-exchange/go-sdk` | ![go](https://img.shields.io/github/v/release/coin-exchange/go-sdk) | [查看](#go) |

---

## JavaScript/TypeScript SDK

### 安装

```bash
npm install @coin-exchange/sdk
# 或
yarn add @coin-exchange/sdk
# 或
pnpm add @coin-exchange/sdk
```

### 初始化

```typescript
import { CoinExchangeClient } from '@coin-exchange/sdk';

const client = new CoinExchangeClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  environment: 'sandbox', // 'sandbox' | 'production'
  timeout: 10000, // 可选，默认 10 秒
  baseUrl: 'https://api.coinexchange.io', // 可选，自定义 API 地址
});
```

### 基本用法

#### 查询余额

```typescript
// 获取所有资产余额
const balance = await client.account.getBalance();
console.log(balance);

// 获取单个资产余额
const btcBalance = await client.account.getBalance('BTC');
console.log(btcBalance);
```

#### 查询市场数据

```typescript
// 获取服务器时间
const time = await client.public.getTime();
console.log(time);

// 获取交易对列表
const symbols = await client.public.getSymbols();
console.log(symbols);

// 获取行情数据
const ticker = await client.public.getTicker('BTC_USDT');
console.log(ticker);

// 获取订单簿
const orderbook = await client.public.getOrderbook('BTC_USDT', 20);
console.log(orderbook);
```

#### 订单管理

```typescript
// 创建限价单
const order = await client.trade.createOrder({
  symbol: 'BTC_USDT',
  side: 'BUY',
  type: 'LIMIT',
  quantity: '0.001',
  price: '40000',
  clientOrderId: 'my-order-123',
});
console.log(order);

// 查询订单
const orderInfo = await client.trade.getOrder(order.orderId);
console.log(orderInfo);

// 查询当前订单
const openOrders = await client.trade.getOpenOrders({ symbol: 'BTC_USDT' });
console.log(openOrders);

// 取消订单
const cancelResult = await client.trade.cancelOrder(order.orderId);
console.log(cancelResult);
```

#### WebSocket 订阅

```typescript
// 创建 WebSocket 连接
const ws = client.websocket;

// 连接
ws.connect();

// 订阅行情
ws.subscribeTicker('BTC_USDT', (data) => {
  console.log('Ticker update:', data);
});

// 订阅深度
ws.subscribeDepth('BTC_USDT', (data) => {
  console.log('Depth update:', data);
});

// 订阅成交
ws.subscribeTrade('BTC_USDT', (data) => {
  console.log('Trade update:', data);
});

// 取消订阅
ws.unsubscribe('BTC_USDT@ticker');

// 关闭连接
ws.disconnect();
```

### 错误处理

```typescript
import { CoinExchangeError } from '@coin-exchange/sdk';

try {
  const order = await client.trade.createOrder({
    symbol: 'BTC_USDT',
    side: 'BUY',
    type: 'LIMIT',
    quantity: '0.001',
    price: '40000',
  });
} catch (error) {
  if (error instanceof CoinExchangeError) {
    console.error('API Error:', error.code, error.message);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### TypeScript 类型

SDK 提供完整的 TypeScript 类型定义：

```typescript
import {
  CoinExchangeClient,
  Order,
  OrderSide,
  OrderType,
  OrderStatus,
  Balance,
  Ticker,
  Symbol,
} from '@coin-exchange/sdk';

// 使用枚举
const order: Order = await client.trade.createOrder({
  symbol: 'BTC_USDT',
  side: OrderSide.BUY,
  type: OrderType.LIMIT,
  quantity: '0.001',
  price: '40000',
});
```

---

## Python SDK

### 安装

```bash
pip install coin-exchange-sdk
```

### 初始化

```python
from coin_exchange import CoinExchangeClient

client = CoinExchangeClient(
    api_key='your-api-key',
    api_secret='your-api-secret',
    environment='sandbox',
    timeout=10,
)
```

### 基本用法

#### 查询余额

```python
# 获取所有资产余额
balance = client.account.get_balance()
print(balance)

# 获取单个资产余额
btc_balance = client.account.get_balance('BTC')
print(btc_balance)
```

#### 查询市场数据

```python
# 获取服务器时间
time = client.public.get_time()
print(time)

# 获取行情数据
ticker = client.public.get_ticker('BTC_USDT')
print(ticker)

# 获取订单簿
orderbook = client.public.get_orderbook('BTC_USDT', limit=20)
print(orderbook)
```

#### 订单管理

```python
# 创建订单
order = client.trade.create_order(
    symbol='BTC_USDT',
    side='BUY',
    type='LIMIT',
    quantity='0.001',
    price='40000',
    client_order_id='my-order-123',
)
print(order)

# 查询订单
order_info = client.trade.get_order(order['orderId'])
print(order_info)

# 取消订单
cancel_result = client.trade.cancel_order(order['orderId'])
print(cancel_result)
```

#### WebSocket 订阅

```python
from coin_exchange import WebSocketClient

def on_ticker(msg):
    print(f"Ticker: {msg}")

def on_depth(msg):
    print(f"Depth: {msg}")

# 创建 WebSocket 客户端
ws = WebSocketClient(
    api_key='your-api-key',
    api_secret='your-api-secret',
)

# 订阅行情
ws.subscribe_ticker('BTC_USDT', on_ticker)

# 订阅深度
ws.subscribe_depth('BTC_USDT', on_depth)

# 运行（阻塞）
ws.run()
```

### 错误处理

```python
from coin_exchange.exceptions import CoinExchangeError

try:
    order = client.trade.create_order(
        symbol='BTC_USDT',
        side='BUY',
        type='LIMIT',
        quantity='0.001',
        price='40000',
    )
except CoinExchangeError as e:
    print(f"API Error: {e.code} - {e.message}")
    print(f"Details: {e.details}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

---

## Go SDK

### 安装

```bash
go get github.com/coin-exchange/go-sdk
```

### 初始化

```go
package main

import (
    "context"
    "fmt"
    "github.com/coin-exchange/go-sdk"
)

func main() {
    client := coinexchange.NewClient(
        "your-api-key",
        "your-api-secret",
        coinexchange.Sandbox,
    )
    
    // 设置超时
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
}
```

### 基本用法

#### 查询余额

```go
// 获取所有资产余额
balance, err := client.Account.GetBalance(ctx)
if err != nil {
    panic(err)
}
fmt.Printf("Balance: %+v\n", balance)

// 获取单个资产余额
btcBalance, err := client.Account.GetAssetBalance(ctx, "BTC")
if err != nil {
    panic(err)
}
fmt.Printf("BTC Balance: %+v\n", btcBalance)
```

#### 查询市场数据

```go
// 获取服务器时间
time, err := client.Public.GetTime(ctx)
if err != nil {
    panic(err)
}
fmt.Printf("Server time: %d\n", time)

// 获取行情
ticker, err := client.Public.GetTicker(ctx, "BTC_USDT")
if err != nil {
    panic(err)
}
fmt.Printf("Ticker: %+v\n", ticker)

// 获取订单簿
orderbook, err := client.Public.GetOrderbook(ctx, "BTC_USDT", 20)
if err != nil {
    panic(err)
}
fmt.Printf("Orderbook: %+v\n", orderbook)
```

#### 订单管理

```go
// 创建订单
order, err := client.Trade.CreateOrder(ctx, &coinexchange.OrderRequest{
    Symbol:        "BTC_USDT",
    Side:          coinexchange.OrderSideBuy,
    Type:          coinexchange.OrderTypeLimit,
    Quantity:      "0.001",
    Price:         "40000",
    ClientOrderID: "my-order-123",
})
if err != nil {
    panic(err)
}
fmt.Printf("Order: %+v\n", order)

// 查询订单
orderInfo, err := client.Trade.GetOrder(ctx, order.OrderID)
if err != nil {
    panic(err)
}
fmt.Printf("Order info: %+v\n", orderInfo)

// 取消订单
cancelResult, err := client.Trade.CancelOrder(ctx, order.OrderID)
if err != nil {
    panic(err)
}
fmt.Printf("Cancel result: %+v\n", cancelResult)
```

#### WebSocket 订阅

```go
// 创建 WebSocket 客户端
ws := client.WebSocket

// 连接
err := ws.Connect()
if err != nil {
    panic(err)
}
defer ws.Close()

// 订阅行情
err = ws.SubscribeTicker("BTC_USDT", func(ticker *coinexchange.Ticker) {
    fmt.Printf("Ticker: %+v\n", ticker)
})
if err != nil {
    panic(err)
}

// 订阅深度
err = ws.SubscribeDepth("BTC_USDT", func(depth *coinexchange.Depth) {
    fmt.Printf("Depth: %+v\n", depth)
})
if err != nil {
    panic(err)
}

// 保持连接
select {}
```

### 错误处理

```go
import "github.com/coin-exchange/go-sdk/errors"

order, err := client.Trade.CreateOrder(ctx, &coinexchange.OrderRequest{
    Symbol:   "BTC_USDT",
    Side:     coinexchange.OrderSideBuy,
    Type:     coinexchange.OrderTypeLimit,
    Quantity: "0.001",
    Price:    "40000",
})

if err != nil {
    if apiErr, ok := errors.IsCoinExchangeError(err); ok {
        fmt.Printf("API Error: %d - %s\n", apiErr.Code, apiErr.Message)
    } else {
        fmt.Printf("Unexpected error: %v\n", err)
    }
    return
}
```

---

## 🔧 高级配置

### 自定义 HTTP Client

#### JavaScript

```typescript
import { CoinExchangeClient } from '@coin-exchange/sdk';
import axios from 'axios';

const httpClient = axios.create({
  timeout: 30000,
  maxRedirects: 5,
});

const client = new CoinExchangeClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  environment: 'production',
  httpClient,
});
```

#### Python

```python
from coin_exchange import CoinExchangeClient
import requests

session = requests.Session()
session.timeout = 30

client = CoinExchangeClient(
    api_key='your-api-key',
    api_secret='your-api-secret',
    environment='production',
    session=session,
)
```

### 日志配置

#### JavaScript

```typescript
const client = new CoinExchangeClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  environment: 'sandbox',
  logger: {
    debug: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  },
});
```

#### Python

```python
import logging

logging.basicConfig(level=logging.DEBUG)

client = CoinExchangeClient(
    api_key='your-api-key',
    api_secret='your-api-secret',
    environment='sandbox',
    log_level=logging.DEBUG,
)
```

---

## 📚 相关文档

- [快速开始指南](./quick-start.md)
- [API 完整参考](./api-reference.md)
- [最佳实践](./best-practices.md)
- [示例代码](./examples/)
