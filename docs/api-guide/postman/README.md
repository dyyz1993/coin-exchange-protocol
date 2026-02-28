# Postman 集合使用指南

## 📦 导入集合

### 方法 1: 通过文件导入

1. 打开 Postman
2. 点击左上角 `Import` 按钮
3. 选择 `Upload Files`
4. 选择 `coin-exchange-api-collection.json` 文件
5. 点击 `Import`

### 方法 2: 通过 URL 导入

1. 点击 `Import` 按钮
2. 选择 `Link` 标签
3. 输入集合 URL: `https://docs.coinexchange.io/postman/collection.json`
4. 点击 `Continue` 然后 `Import`

---

## ⚙️ 环境配置

### 1. 创建环境

1. 点击右上角齿轮图标 ⚙️
2. 点击 `Add`
3. 输入环境名称，如 `Coin Exchange - Sandbox`

### 2. 配置变量

添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `base_url` | `https://api-sandbox.coinexchange.io/v1` | API 基础 URL |
| `api_key` | `your-api-key` | 你的 API Key |
| `api_secret` | `your-api-secret` | 你的 API Secret |

**生产环境配置:**

| 变量名 | 值 |
|--------|-----|
| `base_url` | `https://api.coinexchange.io/v1` |
| `api_key` | 你的生产环境 API Key |
| `api_secret` | 你的生产环境 API Secret |

---

## 🔑 签名配置

集合已包含预请求脚本，会自动生成签名。需要安装 `crypto-js` 库：

1. 在 Postman 中打开集合
2. 点击 `...` → `Add scripts` → `Pre-request`
3. 确保脚本已包含签名逻辑

### 手动签名示例

如果需要手动测试签名，可以使用以下 Node.js 代码：

```javascript
const crypto = require('crypto');

function generateSignature(method, path, query, timestamp, body, secret) {
  const signString = `${method}\n${path}\n${query}\n${timestamp}\n${body}`;
  return crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex');
}

// 示例
const signature = generateSignature(
  'GET',
  '/v1/account/balance',
  '',
  '1709152093',
  '',
  'your-api-secret'
);

console.log('Signature:', signature);
```

---

## 🧪 测试接口

### 1. 测试公共接口（无需认证）

1. 展开 `公共接口` 文件夹
2. 选择 `获取服务器时间`
3. 点击 `Send`
4. 查看响应

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

### 2. 测试私有接口（需要认证）

1. 选择刚创建的环境
2. 展开 `账户接口` 文件夹
3. 选择 `获取账户余额`
4. 点击 `Send`
5. 查看响应

---

## 📋 集合内容

### 公共接口
- ✅ 获取服务器时间
- ✅ 获取交易对列表
- ✅ 获取市场行情
- ✅ 获取订单簿
- ✅ 获取最近成交

### 账户接口
- ✅ 获取账户信息
- ✅ 获取账户余额
- ✅ 获取单个资产余额

### 交易接口
- ✅ 创建订单
- ✅ 查询订单
- ✅ 取消订单
- ✅ 查询当前订单
- ✅ 查询历史订单
- ✅ 查询成交记录

### 钱包接口
- ✅ 获取充值地址
- ✅ 查询充值记录
- ✅ 提币申请
- ✅ 查询提现记录

---

## 💡 使用技巧

### 1. 环境变量快捷引用

在请求中使用 `{{variable_name}}` 引用环境变量：

```
{{base_url}}/account/balance
```

### 2. 自动生成随机值

使用 Postman 内置变量：

- `{{$timestamp}}` - 当前时间戳
- `{{$randomUUID}}` - 随机 UUID
- `{{$randomInt}}` - 随机整数

### 3. 保存示例响应

1. 发送请求后点击 `Save Response`
2. 选择 `Save as example`
3. 方便以后参考

### 4. 批量运行

1. 点击集合名称旁的 `...`
2. 选择 `Run`
3. 选择要运行的请求
4. 点击 `Run Coin Exchange Protocol API`

---

## 🔄 更新集合

当 API 更新时，重新导入集合：

1. 导出当前环境变量（备份）
2. 删除旧集合
3. 导入新集合
4. 导入环境变量

---

## ❓ 常见问题

### Q1: 为什么请求返回 40001 错误？

**A:** 检查以下几点：
- API Key 和 Secret 是否正确
- 环境变量是否已设置
- 是否选择了正确的环境

### Q2: 签名验证失败怎么办？

**A:** 
- 检查时间戳是否为毫秒
- 确认时间戳与服务器时间相差不超过 5 秒
- 检查签名算法是否为 HMAC-SHA256

### Q3: 如何调试签名？

**A:** 在 Pre-request Script 中添加：

```javascript
console.log('Method:', method);
console.log('Path:', path);
console.log('Query:', query);
console.log('Timestamp:', timestamp);
console.log('Sign String:', signString);
console.log('Signature:', signature);
```

然后打开 Postman Console（View → Show Postman Console）查看输出。

---

## 📚 相关资源

- [API 完整参考](../api-reference.md)
- [快速开始指南](../quick-start.md)
- [错误码说明](../error-codes.md)
- [Postman 官方文档](https://learning.postman.com/)

---

## 📧 获取帮助

遇到问题？联系技术支持：
- 邮件: support@coinexchange.io
- 文档: docs.coinexchange.io
