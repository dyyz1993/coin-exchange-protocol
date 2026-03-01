// k6 性能测试配置
// 文档: https://k6.io/docs/

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const accountCreationTime = new Trend('account_creation_time');
const transferTime = new Trend('transfer_time');
const queryTime = new Trend('query_time');
const totalRequests = new Counter('total_requests');

// 测试配置
export const options = {
  // 性能测试阶段
  stages: [
    // 预热阶段
    { duration: '30s', target: 10 },  // 逐步增加到 10 用户
    
    // 正常负载测试
    { duration: '1m', target: 50 },   // 增加到 50 用户
    { duration: '2m', target: 50 },   // 维持 50 用户
    
    // 峰值负载测试
    { duration: '30s', target: 100 }, // 增加到 100 用户
    { duration: '1m', target: 100 },  // 维持 100 用户
    
    // 压力测试
    { duration: '30s', target: 200 }, // 增加到 200 用户
    { duration: '1m', target: 200 },  // 维持 200 用户
    
    // 恢复阶段
    { duration: '30s', target: 50 },  // 降低到 50 用户
    { duration: '30s', target: 0 },   // 逐步减少到 0
  ],
  
  // SLA 阈值配置
  thresholds: {
    // 全局 HTTP 请求失败率 < 1%
    http_req_failed: ['rate<0.01'],
    
    // 95% 的请求响应时间 < 300ms
    http_req_duration: ['p(95)<300', 'p(99)<500'],
    
    // 自定义指标阈值
    'account_creation_time': ['p(95)<200', 'p(99)<500'],
    'transfer_time': ['p(95)<300', 'p(99)<600'],
    'query_time': ['p(95)<100', 'p(99)<300'],
    'errors': ['rate<0.05'],
  },
  
  // 输出配置
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// 环境配置
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

// 测试数据
const testData = {
  accounts: [],
  tokens: [],
};

// 初始化函数 - 在测试开始前执行一次
export function setup() {
  console.log('🚀 开始性能测试初始化...');
  console.log(`📍 目标服务: ${BASE_URL}`);
  
  // 创建测试账户用于转账测试
  const accounts = [];
  for (let i = 0; i < 10; i++) {
    const payload = JSON.stringify({
      address: `perf_test_${Date.now()}_${i}`,
      initialBalance: 1000000,
    });
    
    const res = http.post(`${BASE_URL}${API_PREFIX}/accounts`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (res.status === 201 || res.status === 200) {
      accounts.push(res.json());
    }
  }
  
  console.log(`✅ 创建了 ${accounts.length} 个测试账户`);
  return { accounts };
}

// 主测试函数 - 每个虚拟用户执行
export default function (data) {
  // 随机选择测试场景
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - 账户查询测试
    testAccountQuery(data);
  } else if (scenario < 0.5) {
    // 20% - 账户创建测试
    testAccountCreation();
  } else if (scenario < 0.7) {
    // 20% - 转账测试
    testTransfer(data);
  } else if (scenario < 0.85) {
    // 15% - 空投测试
    testAirdrop();
  } else {
    // 15% - 任务测试
    testTask();
  }
  
  // 随机等待 0.5-2 秒
  sleep(Math.random() * 1.5 + 0.5);
}

// 账户查询测试
function testAccountQuery(data) {
  if (data.accounts.length === 0) return;
  
  const account = data.accounts[Math.floor(Math.random() * data.accounts.length)];
  const startTime = new Date();
  
  const res = http.get(`${BASE_URL}${API_PREFIX}/accounts/${account.id || account.address}`);
  const duration = new Date() - startTime;
  
  queryTime.add(duration);
  totalRequests.add(1);
  
  const success = check(res, {
    '账户查询状态码为 200': (r) => r.status === 200,
    '账户查询响应时间 < 100ms': () => duration < 100,
    '账户数据包含余额': (r) => {
      const body = r.json();
      return body.balance !== undefined || body.data?.balance !== undefined;
    },
  });
  
  errorRate.add(!success);
}

// 账户创建测试
function testAccountCreation() {
  const payload = JSON.stringify({
    address: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    initialBalance: 0,
  });
  
  const startTime = new Date();
  const res = http.post(`${BASE_URL}${API_PREFIX}/accounts`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  const duration = new Date() - startTime;
  
  accountCreationTime.add(duration);
  totalRequests.add(1);
  
  const success = check(res, {
    '账户创建状态码为 200/201': (r) => r.status === 200 || r.status === 201,
    '账户创建响应时间 < 200ms': () => duration < 200,
    '账户创建返回 ID': (r) => {
      const body = r.json();
      return body.id !== undefined || body.data?.id !== undefined;
    },
  });
  
  errorRate.add(!success);
}

// 转账测试
function testTransfer(data) {
  if (data.accounts.length < 2) return;
  
  const fromIndex = Math.floor(Math.random() * data.accounts.length);
  let toIndex = Math.floor(Math.random() * data.accounts.length);
  
  // 确保转出和转入账户不同
  while (toIndex === fromIndex) {
    toIndex = Math.floor(Math.random() * data.accounts.length);
  }
  
  const from = data.accounts[fromIndex];
  const to = data.accounts[toIndex];
  
  const payload = JSON.stringify({
    fromAddress: from.address || from.id,
    toAddress: to.address || to.id,
    amount: Math.floor(Math.random() * 100) + 1,
    memo: `perf_test_${Date.now()}`,
  });
  
  const startTime = new Date();
  const res = http.post(`${BASE_URL}${API_PREFIX}/accounts/transfer`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  const duration = new Date() - startTime;
  
  transferTime.add(duration);
  totalRequests.add(1);
  
  const success = check(res, {
    '转账状态码为 200': (r) => r.status === 200,
    '转账响应时间 < 300ms': () => duration < 300,
    '转账返回交易哈希': (r) => {
      const body = r.json();
      return body.transactionHash !== undefined || body.txHash !== undefined || body.success;
    },
  });
  
  errorRate.add(!success);
}

// 空投测试
function testAirdrop() {
  // 查询空投列表
  const listRes = http.get(`${BASE_URL}${API_PREFIX}/airdrops`);
  
  check(listRes, {
    '空投列表状态码为 200': (r) => r.status === 200,
  });
  
  totalRequests.add(1);
  
  // 如果有空投，尝试领取
  if (listRes.status === 200) {
    const airdrops = listRes.json();
    if (airdrops.length > 0 || airdrops.data?.length > 0) {
      const airdrop = (airdrops.data || airdrops)[0];
      
      const claimPayload = JSON.stringify({
        userAddress: `perf_user_${Date.now()}`,
      });
      
      const claimRes = http.post(
        `${BASE_URL}${API_PREFIX}/airdrops/${airdrop.id}/claim`,
        claimPayload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      check(claimRes, {
        '空投领取请求成功': (r) => r.status === 200 || r.status === 400, // 400 可能是已领取
      });
      
      totalRequests.add(1);
    }
  }
}

// 任务测试
function testTask() {
  // 查询任务列表
  const listRes = http.get(`${BASE_URL}${API_PREFIX}/tasks`);
  
  check(listRes, {
    '任务列表状态码为 200': (r) => r.status === 200,
  });
  
  totalRequests.add(1);
}

// 清理函数 - 测试结束后执行
export function teardown(data) {
  console.log('🧹 清理测试数据...');
  
  // 清理创建的测试账户
  if (data.accounts) {
    for (const account of data.accounts) {
      // 可以在这里添加清理逻辑
      // 例如: http.del(`${BASE_URL}${API_PREFIX}/accounts/${account.id}`);
    }
  }
  
  console.log('✅ 性能测试完成');
}
