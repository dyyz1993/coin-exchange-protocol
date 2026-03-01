# 金币交易协议 - 演示指南

## 📋 概述

本文档提供金币交易协议的演示页面和测试数据使用指南，帮助开发人员和测试人员快速了解系统功能。

## 🎯 演示页面

### 访问演示页面

1. **HTML 演示页面**：`demo.html`
   - 直接在浏览器中打开
   - 展示完整的用户界面
   - 包含所有核心功能的视觉演示
   - 响应式设计，支持不同分辨率

2. **React 组件演示**：
   - `src/components/AccountManager.tsx` - 账户管理组件
   - `src/components/FreezeManager.tsx` - 冻结管理组件

## 📊 演示数据

### 数据文件位置

- **演示数据**：`src/data/demo-data.json`
- **数据类型**：
  - 账户数据 (accounts)
  - 冻结申请 (freezeRequests)
  - 冻结记录 (freezeRecords)
  - 交易记录 (transactions)
  - 统计数据 (statistics)

### 数据说明

#### 账户数据示例

```json
{
  "id": "acc-001",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7594aA8F3",
  "shortAddress": "0x742d...A8F3",
  "balance": 5234.50,
  "frozenAmount": 0,
  "status": "active",
  "createdAt": "2024-01-15T08:00:00Z",
  "owner": "张三",
  "email": "zhangsan@example.com",
  "kycStatus": "verified"
}
```

#### 账户状态

- `active` - 正常状态
- `frozen` - 已冻结
- `inactive` - 未激活

#### 冻结申请状态

- `pending` - 待审核
- `approved` - 已通过
- `rejected` - 已拒绝

#### 交易类型

- `transfer` - 转账
- `deposit` - 充值
- `withdraw` - 提现

#### 交易状态

- `pending` - 处理中
- `completed` - 已完成
- `failed` - 失败

## 🎨 UI 特性

### 响应式设计

- **桌面端** (> 1024px): 完整布局，4列统计卡片
- **平板端** (768px - 1024px): 2列布局
- **移动端** (< 768px): 单列布局，优化触摸交互

### 交互效果

- 悬停动画
- 状态徽章颜色编码
- 模态表单
- 加载状态指示器

### 颜色方案

- **主色调**: 紫色渐变 (#667eea → #764ba2)
- **成功**: 绿色 (#38a169)
- **警告**: 黄色 (#d69e2e)
- **危险**: 红色 (#e53e3e)
- **信息**: 蓝色 (#4299e1)

## 📸 截图要点

### 建议截图内容

1. **账户管理页面**
   - 统计卡片展示
   - 账户列表表格
   - 操作按钮

2. **冻结管理页面**
   - 冻结申请列表
   - 审核操作
   - 冻结记录

3. **交易记录页面**
   - 交易类型展示
   - 状态标识
   - 金额显示

4. **响应式展示**
   - 桌面端视图
   - 移动端视图

### 截图最佳实践

- 使用 1920x1080 分辨率（桌面端）
- 使用 375x667 分辨率（移动端）
- 确保数据完整性
- 避免敏感信息
- 展示不同状态的数据

## 🔧 使用演示数据

### 在代码中使用

```typescript
import demoData from './data/demo-data.json';

// 获取账户列表
const accounts = demoData.accounts;

// 获取冻结申请
const freezeRequests = demoData.freezeRequests;

// 获取统计数据
const stats = demoData.statistics;
```

### 数据过滤示例

```typescript
// 获取待审核的冻结申请
const pendingRequests = demoData.freezeRequests.filter(
  req => req.status === 'pending'
);

// 获取冻结中的账户
const frozenAccounts = demoData.accounts.filter(
  acc => acc.status === 'frozen'
);

// 计算总冻结金额
const totalFrozen = demoData.accounts.reduce(
  (sum, acc) => sum + acc.frozenAmount, 0
);
```

## 🚀 快速开始

### 1. 查看演示页面

```bash
# 在浏览器中打开
open demo.html
```

### 2. 查看组件代码

```bash
# 账户管理组件
cat src/components/AccountManager.tsx

# 冻结管理组件
cat src/components/FreezeManager.tsx
```

### 3. 查看演示数据

```bash
# 查看完整数据
cat src/data/demo-data.json
```

## 📝 数据更新

### 添加新账户

```json
{
  "id": "acc-006",
  "address": "0x新的钱包地址",
  "shortAddress": "0x...简写",
  "balance": 1000.00,
  "frozenAmount": 0,
  "status": "active",
  "createdAt": "2024-03-01T00:00:00Z",
  "owner": "用户名",
  "email": "user@example.com",
  "kycStatus": "verified"
}
```

### 添加新交易记录

```json
{
  "id": "tx-1009",
  "type": "transfer",
  "from": "0x发送方地址",
  "to": "0x接收方地址",
  "amount": 100,
  "status": "completed",
  "timestamp": "2024-03-01T00:00:00Z",
  "fee": 0.1,
  "note": "交易备注"
}
```

## ⚠️ 注意事项

1. **数据安全**：演示数据仅供测试使用，不包含真实信息
2. **隐私保护**：所有地址和账户均为虚构
3. **数据一致性**：修改数据时确保关联关系的完整性
4. **状态转换**：遵循业务逻辑的状态流转规则

## 📞 技术支持

如有问题，请联系：
- **前端开发者**：负责 UI 组件和演示页面
- **测试工程师**：负责数据验证和截图
- **开发总监**：负责技术审核

## 🎉 更新日志

### v1.0.0 (2024-03-01)
- ✅ 创建演示 HTML 页面
- ✅ 准备完整演示数据
- ✅ 优化 UI 展示效果
- ✅ 添加响应式设计
- ✅ 编写使用文档

---

**最后更新**: 2024-03-01  
**维护者**: 前端开发团队