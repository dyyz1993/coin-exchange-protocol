# 金币交易协议 - 前端界面

## 🎨 界面功能

### 1. 账户管理组件 (AccountManager)
- ✅ 账户列表展示
- ✅ 余额显示（可用余额 + 冻结金额）
- ✅ 转账表单
- ✅ 状态标识（正常/已冻结/未激活）
- ✅ 统计信息展示

### 2. 冻结管理组件 (FreezeManager)
- ✅ 冻结申请表单
  - 初始冻结
  - 争议冻结
  - 完全冻结
- ✅ 冻结记录列表
- ✅ 审核操作界面（待审核/批准/拒绝）
- ✅ 解冻操作
- ✅ 标签切换（全部记录/待审核）

## 🚀 快速开始

### 启动后端服务
```bash
bun run dev
```

### 访问前端界面
打开浏览器访问：http://localhost:3000

## 📁 项目结构

```
src/frontend/
├── components/
│   ├── AccountManager.tsx    # 账户管理组件
│   └── FreezeManager.tsx     # 冻结管理组件
├── pages/                    # 页面组件（预留）
├── styles/                   # 样式文件（预留）
├── App.tsx                   # 主应用入口
└── index.html                # HTML 入口（可直接运行）
```

## 🎯 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Bun** - 运行时环境

## 📝 API 集成

前端组件会自动连接到后端 API：
- 基础 URL: `http://localhost:3000/api`
- 支持的端点：
  - `GET /api/accounts` - 获取账户列表
  - `POST /api/transfer` - 转账操作
  - `GET /api/freeze/records` - 获取冻结记录
  - `POST /api/freeze/initial` - 初始冻结
  - `POST /api/freeze/dispute` - 争议冻结
  - `POST /api/freeze/full-account` - 完全冻结
  - `POST /api/freeze/unfreeze` - 解冻操作

## 🎨 UI 特性

1. **响应式设计** - 适配不同屏幕尺寸
2. **实时更新** - 数据刷新功能
3. **错误处理** - 友好的错误提示
4. **演示数据** - 后端未启动时显示演示数据
5. **状态指示** - 清晰的系统状态展示

## 🔧 开发说明

### 演示模式
如果后端服务未启动，前端会自动显示演示数据，方便测试和演示。

### API 连接
前端通过 fetch API 连接后端，支持：
- GET 请求 - 查询数据
- POST 请求 - 提交操作
- 自动错误处理
- CORS 支持

## 📸 界面预览

### 账户管理界面
- 表格展示账户信息
- 转账表单
- 余额统计

### 冻结管理界面
- 冻结申请表单
- 记录列表（支持标签切换）
- 审核操作按钮
- 统计面板

## 🤝 贡献

由前端开发者团队维护，注重用户体验和界面美观。

## 📄 许可证

MIT License - 金币交易协议开发团队
