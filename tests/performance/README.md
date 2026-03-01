# 性能测试框架

## 📊 概述

本目录包含金币交易协议的性能基准测试和SLA定义。使用 k6 作为性能测试工具，支持多种测试场景和CI/CD集成。

## 🎯 测试覆盖

### 核心API（12个）

#### 账户系统（6个）
1. POST /api/account/create - 创建账户
2. GET /api/account/balance/:userId - 查询余额
3. POST /api/account/deposit - 充值
4. POST /api/account/withdraw - 提现
5. POST /api/account/transfer - 转账
6. GET /api/account/transactions/:userId - 交易记录

#### 空投系统（3个）
7. POST /api/airdrop/create - 创建空投
8. GET /api/airdrop/active - 获取活跃空投
9. POST /api/airdrop/claim - 领取空投

#### 任务系统（3个）
10. POST /api/task/create - 创建任务
11. GET /api/task/active - 获取活跃任务
12. POST /api/task/complete - 完成任务

## 🚀 快速开始

### 安装 k6

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491435B320C
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

### 运行测试

```bash
# 运行基准测试
k6 run tests/performance/benchmark.js

# 运行账户系统测试
k6 run tests/performance/scenarios/account-scenarios.js

# 运行空投系统测试
k6 run tests/performance/scenarios/airdrop-scenarios.js

# 运行任务系统测试
k6 run tests/performance/scenarios/task-scenarios.js

# 自定义并发和持续时间
k6 run --vus 100 --duration 30s tests/performance/benchmark.js

# 输出JSON格式结果
k6 run --out json=results.json tests/performance/benchmark.js
```

## 📈 SLA 目标

详细SLA定义请查看 [sla-definition.md](./sla-definition.md)

### 响应时间

| 指标 | 目标 |
|------|------|
| P50 | < 100ms |
| P95 | < 200ms |
| P99 | < 400ms |

### 可用性

- 系统可用性: > 99.9%
- 错误率: < 0.1%

### 吞吐量

| 系统 | 目标 QPS |
|------|----------|
| 账户系统 | 500 |
| 空投系统 | 200 |
| 任务系统 | 300 |

## 🧪 测试类型

### 1. 基准测试 (Baseline Testing)
- **频率**: 每次代码提交
- **持续时间**: 5-8分钟
- **并发用户**: 10-50
- **目标**: 确保基本性能不退化

```bash
k6 run tests/performance/benchmark.js
```

### 2. 负载测试 (Load Testing)
- **频率**: 每日
- **持续时间**: 30分钟
- **并发用户**: 100-1000
- **目标**: 验证正常负载下的性能

```bash
k6 run tests/performance/scenarios/account-scenarios.js
```

### 3. 压力测试 (Stress Testing)
- **频率**: 每周
- **持续时间**: 1小时
- **并发用户**: 1000-2000
- **目标**: 发现系统瓶颈和极限

```bash
k6 run --vus 1000 --duration 1h tests/performance/benchmark.js
```

## 📊 监控面板

打开 `monitoring-dashboard.html` 查看实时性能监控面板。

面板显示：
- SLA状态
- 响应时间分布
- 吞吐量统计
- 并发连接数
- 系统资源使用率
- 性能趋势图表

## 🔄 CI/CD 集成

性能测试已集成到GitHub Actions工作流中：

- **推送到main/develop分支**: 自动运行基准测试
- **Pull Request**: 自动运行测试并发布报告
- **每日定时**: 运行完整的负载测试
- **手动触发**: 支持选择测试类型

查看工作流配置: `.github/workflows/performance-test.yml`

## 📝 测试结果

测试结果包含：

1. **控制台输出**: 实时测试进度和结果
2. **JSON报告**: 详细的性能数据（用于后续分析）
3. **GitHub PR评论**: 自动发布的测试摘要
4. **Artifacts**: 可下载的完整测试报告

### 结果解读

```
✅ checks: 95% 通过
✅ http_req_duration: p(95) < 200ms
✅ http_req_failed: rate < 1%
```

- **checks**: 测试断言通过率
- **http_req_duration**: HTTP请求响应时间
- **http_req_failed**: 失败请求比例

## 🔧 自定义测试

### 修改测试参数

编辑 `k6.config.js` 中的配置：

```javascript
export const config = {
  baseUrl: 'http://localhost:3000/api',
  performance: {
    normal: {
      vus: 500,
      duration: '30m',
      rampUp: '5m',
    },
  },
};
```

### 添加新测试场景

1. 在 `scenarios/` 目录创建新文件
2. 导入配置和辅助函数
3. 定义测试选项和场景
4. 添加到基准测试或独立运行

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { generateUserId, collectMetrics, config } from '../k6.config.js';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
  ],
};

export default function () {
  // 你的测试代码
}
```

## 🐛 故障排查

### 常见问题

1. **连接超时**
   - 检查BASE_URL是否正确
   - 确认服务是否运行
   - 检查网络连接

2. **性能不达标**
   - 检查系统资源使用率
   - 优化数据库查询
   - 添加缓存层

3. **错误率过高**
   - 查看错误日志
   - 检查输入数据有效性
   - 验证业务逻辑

### 调试模式

```bash
# 详细日志输出
k6 run --verbose tests/performance/benchmark.js

# 限制请求数
k6 run --iterations 10 tests/performance/benchmark.js
```

## 📚 参考资料

- [k6 官方文档](https://k6.io/docs/)
- [性能测试最佳实践](https://k6.io/docs/testing-guides/)
- [SLA定义文档](./sla-definition.md)

## 🤝 贡献

欢迎提交新的测试场景和改进建议！

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

---

**维护团队**: 金币交易协议开发团队  
**最后更新**: 2026-03-01
