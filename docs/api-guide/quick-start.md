# 快速开始指南

> 5分钟快速接入金币交易协议 API

## 📋 前置条件

在开始之前，请确保您已经：

1. ✅ 注册了开发者账号
2. ✅ 完成了身份验证（KYC）
3. ✅ 获取了 API Key 和 Secret

> 💡 **提示**: 如果还没有 API Key，请访问 [开发者控制台](#) 申请。

## 🚀 第一步：安装 SDK

### JavaScript/TypeScript

```bash
npm install @coin-exchange/sdk
# 或
yarn add @coin-exchange/sdk
```

### Python

```bash
pip install coin-exchange-sdk
```

### Go

```bash
go get github.com/coin-exchange/go-sdk
```

## ⚙️ 第二步：初始化客户端

### JavaScript/TypeScript

```javascript
const { CoinExchangeClient } = require('@coin-exchange/sdk');

// 初始化客户端
const client = new CoinExchangeClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  environment: 'sandbox', // 先在沙箱环境测试
});
```

### Python

```python
from coin_exchange import CoinExchangeClient

# 初始化客户端
client = CoinExchangeClient(
    api_key='your-api-key',
    api_secret='your-api-secret',
    environment='sandbox'
)
```

### Go

```go
package main

import (
    "github.com/coin-exchange/go-sdk"
)

func main() {
    // 初始化客户端
    client := coinexchange.NewClient(
        "your-api-key",
        "your-api-secret",
        coinexchange.Sandbox,
    )
}
```

## 🔍 第三步：验证连接

### JavaScript/TypeScript

```javascript
async function testConnection() {
  try {
    // 测试连接 - 查询账户信息
    const account = await client.getAccountInfo();
    console.log('✅ 连接成功！');
    console.log('账户ID:', account.id);
    console.log('账户状态:', account.status);
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
  }
}

testConnection();
```

### Python

```python
def test_connection():
    try:
        # 测试连接 - 查询账户信息
        account = client.get_account_info()
        print('✅ 连接成功！')
        print(f'账户ID: {account.id}')
        print(f'账户状态: {account.status}')
    except Exception as e:
        print(f'❌ 连接失败: {e}')

test_connection()
```

## 💱 第四步：第一个交易查询

### JavaScript/TypeScript

```javascript
async function getBalance() {
  try {
    // 查询账户余额
    const balance = await client.getBalance();
    
    console.log('账户余额:');
    balance.assets.forEach(asset => {
      console.log(`${asset.symbol}: ${asset.available} (冻结: ${asset.frozen})`);
    });
    
    return balance;
  } catch (error) {
    console.error('查询失败:', error);
  }
}

getBalance();
```

## 🎯 完整示例

以下是一个完整的示例，展示如何创建订单并查询状态：

### JavaScript/TypeScript

```javascript
const { CoinExchangeClient } = require('@coin-exchange/sdk');

async function main() {
  // 1. 初始化客户端
  const client = new CoinExchangeClient({
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    environment: 'sandbox',
  });

  try {
    // 2. 查询账户余额
    console.log('📊 查询账户余额...');
    const balance = await client.getBalance();
    console.log('USDT 余额:', balance.assets.find(a => a.symbol === 'USDT')?.available);

    // 3. 创建限价订单
    console.log('\n📝 创建限价订单...');
    const order = await client.createOrder({
      symbol: 'BTC_USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '0.001',
      price: '40000',
    });
    console.log('订单ID:', order.orderId);
    console.log('订单状态:', order.status);

    // 4. 查询订单状态
    console.log('\n🔍 查询订单状态...');
    const orderStatus = await client.getOrder(order.orderId);
    console.log('当前状态:', orderStatus.status);

    // 5. 取消订单（可选）
    console.log('\n❌ 取消订单...');
    const cancelResult = await client.cancelOrder(order.orderId);
    console.log('取消结果:', cancelResult.success ? '成功' : '失败');

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    if (error.code) {
      console.error('错误码:', error.code);
    }
  }
}

main();
```

## 🌐 环境说明

### Sandbox（沙箱环境）

- **用途**: 开发和测试
- **域名**: `https://api-sandbox.coinexchange.io`
- **特点**: 使用虚拟资金，无真实交易
- **限制**: 1000 次/分钟

### Production（生产环境）

- **用途**: 正式交易
- **域名**: `https://api.coinexchange.io`
- **特点**: 真实交易，真实资金
- **限制**: 10000 次/分钟

⚠️ **重要**: 建议先在沙箱环境充分测试后再切换到生产环境！

## 🔑 API Key 权限

在开发者控制台创建 API Key 时，可以设置以下权限：

| 权限类型 | 说明 | 推荐设置 |
|---------|------|---------|
| `READ` | 查询账户、订单等信息 | ✅ 必须 |
| `TRADE` | 创建、取消订单 | 按需开启 |
| `WITHDRAW` | 提币功能 | ⚠️ 谨慎开启 |

## ⚡ 下一步

恭喜！您已经成功完成了基础接入。接下来可以：

1. 📖 阅读 [API 完整参考](./api-reference.md)
2. 🔧 查看 [SDK 使用说明](./sdk-guide.md)
3. 💡 学习 [最佳实践](./best-practices.md)
4. 🛠️ 浏览更多 [示例代码](./examples/)

## ❓ 遇到问题？

- 查看 [常见问题](./faq.md)
- 查看 [错误码说明](./error-codes.md)
- 联系技术支持: support@coinexchange.io
