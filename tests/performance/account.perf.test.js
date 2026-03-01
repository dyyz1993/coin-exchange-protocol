// 账户系统性能测试
// 测试账户创建、查询、转账等核心功能

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// 账户系统专用指标
const accountQueryDuration = new Trend('account_query_duration');
const accountCreateDuration = new Trend('account_create_duration');
const transferDuration = new Trend('transfer_duration');
const historyQueryDuration = new Trend('history_query_duration');
const accountErrorRate = new Rate('account_errors');
const transferSuccessRate = new Rate('transfer_success');
const accountOperations = new Counter('account_operations');
const concurrentUsers = new Gauge('concurrent_users');

// 测试配置 - 账户系统
export const options = {
  scenarios: {
    // 场景 1: 账户查询负载测试
    account_query_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // 逐步增加到 50 VU
        { duration: '1m', target: 100 },   // 增加到 100 VU
        { duration: '2m', target: 100 },   // 维持 100 VU
        { duration: '30s', target: 0 },    // 降低到 0
      ],
      gracefulRampDown: '10s',
      exec: 'testAccountQuery',
    },
    
    // 场景 2: 账户创建负载测试
    account_create_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },   // 逐步增加到 20 VU
        { duration: '1m', target: 50 },    // 增加到 50 VU
        { duration: '1m', target: 50 },    // 维持 50 VU
        { duration: '20s', target: 0 },    // 降低到 0
      ],
      gracefulRampDown: '10s',
      exec: 'testAccountCreation',
    },
    
    // 场景 3: 转账操作负载测试
    transfer_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },   // 逐步增加到 30 VU
        { duration: '1m', target: 80 },    // 增加到 80 VU
        { duration: '2m', target: 80 },    // 维持 80 VU
        { duration: '30s', target: 0 },    // 降低到 0
      ],
      gracefulRampDown: '10s',
      exec: 'testTransfer',
      startTime: '2m', // 延迟 2 分钟开始，确保有足够的测试账户
    },
  },
  
  thresholds: {
    // 账户查询 SLA
    'account_query_duration': ['p(95)<100', 'p(99)<300'],
    'account_create_duration': ['p(95)<200', 'p(99)<500'],
    'transfer_duration': ['p(95)<300', 'p(99)<600'],
    'history_query_duration': ['p(95)<150', 'p(99)<400'],
    
    // 错误率阈值
    'account_errors': ['rate<0.05'],
    'transfer_success': ['rate>0.95'],
    
    // 全局 HTTP 指标
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<300', 'p(99)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

// 共享测试数据
let testAccounts = [];

// 初始化
export function setup() {
  console.log('🎯 初始化账户系统性能测试...');
  
  // 创建测试账户池
  const accounts = [];
  const createPromises = [];
  
  for (let i = 0; i < 20; i++) {
    const payload = JSON.stringify({
      address: `perf_account_${Date.now()}_${i}`,
      initialBalance: 1000000,
    });
    
    const res = http.post(`${BASE_URL}${API_PREFIX}/accounts`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (res.status === 200 || res.status === 201) {
      accounts.push(res.json());
    }
    
    sleep(0.1); // 避免过快请求
  }
  
  console.log(`✅ 创建了 ${accounts.length} 个测试账户`);
  return { accounts };
}

// 测试 1: 账户查询
export function testAccountQuery(data) {
  if (!data.accounts || data.accounts.length === 0) {
    console.log('⚠️ 没有可用的测试账户');
    return;
  }
  
  group('账户查询测试', () => {
    const account = data.accounts[Math.floor(Math.random() * data.accounts.length)];
    const accountId = account.id || account.address;
    
    const startTime = new Date();
    const res = http.get(`${BASE_URL}${API_PREFIX}/accounts/${accountId}`);
    const duration = new Date() - startTime;
    
    accountQueryDuration.add(duration);
    accountOperations.add(1);
    
    const success = check(res, {
      '✅ 状态码为 200': (r) => r.status === 200,
      '✅ 响应时间 P95 < 100ms': () => duration < 100,
      '✅ 响应时间 P99 < 300ms': () => duration < 300,
      '✅ 返回账户数据': (r) => {
        const body = r.json();
        return body.address !== undefined || body.data?.address !== undefined;
      },
      '✅ 返回余额信息': (r) => {
        const body = r.json();
        return body.balance !== undefined || body.data?.balance !== undefined;
      },
    });
    
    accountErrorRate.add(!success);
    
    if (!success) {
      console.log(`❌ 账户查询失败: ${res.status} - ${res.body}`);
    }
  });
  
  sleep(Math.random() * 0.5 + 0.2);
}

// 测试 2: 账户创建
export function testAccountCreation() {
  group('账户创建测试', () => {
    const payload = JSON.stringify({
      address: `perf_new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      initialBalance: 0,
    });
    
    const startTime = new Date();
    const res = http.post(`${BASE_URL}${API_PREFIX}/accounts`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    const duration = new Date() - startTime;
    
    accountCreateDuration.add(duration);
    accountOperations.add(1);
    
    const success = check(res, {
      '✅ 状态码为 200/201': (r) => r.status === 200 || r.status === 201,
      '✅ 响应时间 P95 < 200ms': () => duration < 200,
      '✅ 响应时间 P99 < 500ms': () => duration < 500,
      '✅ 返回账户 ID': (r) => {
        const body = r.json();
        return body.id !== undefined || body.data?.id !== undefined;
      },
      '✅ 返回地址': (r) => {
        const body = r.json();
        return body.address !== undefined || body.data?.address !== undefined;
      },
    });
    
    accountErrorRate.add(!success);
    
    if (!success) {
      console.log(`❌ 账户创建失败: ${res.status} - ${res.body}`);
    }
  });
  
  sleep(Math.random() * 1 + 0.5);
}

// 测试 3: 转账操作
export function testTransfer(data) {
  if (!data.accounts || data.accounts.length < 2) {
    console.log('⚠️ 测试账户不足，无法进行转账测试');
    return;
  }
  
  group('转账操作测试', () => {
    // 随机选择两个不同的账户
    const fromIndex = Math.floor(Math.random() * data.accounts.length);
    let toIndex = Math.floor(Math.random() * data.accounts.length);
    while (toIndex === fromIndex) {
      toIndex = Math.floor(Math.random() * data.accounts.length);
    }
    
    const from = data.accounts[fromIndex];
    const to = data.accounts[toIndex];
    
    const payload = JSON.stringify({
      fromAddress: from.address || from.id,
      toAddress: to.address || to.id,
      amount: Math.floor(Math.random() * 100) + 1,
      memo: `perf_transfer_${Date.now()}`,
    });
    
    const startTime = new Date();
    const res = http.post(`${BASE_URL}${API_PREFIX}/accounts/transfer`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    const duration = new Date() - startTime;
    
    transferDuration.add(duration);
    accountOperations.add(1);
    
    const success = check(res, {
      '✅ 状态码为 200': (r) => r.status === 200,
      '✅ 响应时间 P95 < 300ms': () => duration < 300,
      '✅ 响应时间 P99 < 600ms': () => duration < 600,
      '✅ 返回交易信息': (r) => {
        const body = r.json();
        return body.transactionHash !== undefined || 
               body.txHash !== undefined || 
               body.success !== undefined;
      },
      '✅ 交易成功': (r) => {
        const body = r.json();
        return body.success === true || body.status === 'success';
      },
    });
    
    transferSuccessRate.add(success);
    accountErrorRate.add(!success);
    
    if (!success) {
      console.log(`❌ 转账失败: ${res.status} - ${res.body}`);
    }
  });
  
  sleep(Math.random() * 1.5 + 0.5);
}

// 测试 4: 历史记录查询
export function testHistory(data) {
  if (!data.accounts || data.accounts.length === 0) {
    return;
  }
  
  group('历史记录查询测试', () => {
    const account = data.accounts[Math.floor(Math.random() * data.accounts.length)];
    const accountId = account.id || account.address;
    
    const startTime = new Date();
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/accounts/${accountId}/history?page=1&limit=20`
    );
    const duration = new Date() - startTime;
    
    historyQueryDuration.add(duration);
    accountOperations.add(1);
    
    const success = check(res, {
      '✅ 状态码为 200': (r) => r.status === 200,
      '✅ 响应时间 P95 < 150ms': () => duration < 150,
      '✅ 响应时间 P99 < 400ms': () => duration < 400,
      '✅ 返回历史记录': (r) => {
        const body = r.json();
        return Array.isArray(body) || Array.isArray(body.data);
      },
    });
    
    accountErrorRate.add(!success);
  });
  
  sleep(Math.random() * 0.5 + 0.3);
}

// 清理
export function teardown(data) {
  console.log('🧹 清理账户系统测试数据...');
  console.log(`📊 执行了 ${accountOperations.name} 次账户操作`);
  console.log('✅ 账户系统性能测试完成');
}
