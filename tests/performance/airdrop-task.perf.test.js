// 空投系统性能测试
// 测试空投创建、领取、查询等核心功能

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 空投系统专用指标
const airdropQueryDuration = new Trend('airdrop_query_duration');
const airdropClaimDuration = new Trend('airdrop_claim_duration');
const airdropCreateDuration = new Trend('airdrop_create_duration');
const airdropErrorRate = new Rate('airdrop_errors');
const airdropClaimSuccess = new Rate('airdrop_claim_success');
const airdropOperations = new Counter('airdrop_operations');

// 测试配置 - 空投系统
export const options = {
  scenarios: {
    // 场景 1: 空投查询负载测试
    airdrop_query_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '2m',
      exec: 'testAirdropQuery',
    },
    
    // 场景 2: 空投领取负载测试
    airdrop_claim_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // 逐步增加到 50 VU
        { duration: '1m', target: 100 },   // 增加到 100 VU
        { duration: '1m', target: 100 },   // 维持 100 VU
        { duration: '30s', target: 0 },    // 降低到 0
      ],
      exec: 'testAirdropClaim',
      startTime: '30s',
    },
  },
  
  thresholds: {
    // 空投查询 SLA
    'airdrop_query_duration': ['p(95)<100', 'p(99)<250'],
    
    // 空投领取 SLA
    'airdrop_claim_duration': ['p(95)<200', 'p(99)<400'],
    
    // 空投创建 SLA
    'airdrop_create_duration': ['p(95)<250', 'p(99)<500'],
    
    // 错误率阈值
    'airdrop_errors': ['rate<0.05'],
    'airdrop_claim_success': ['rate>0.90'],
    
    // 全局 HTTP 指标
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<300', 'p(99)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

// 共享测试数据
let testAirdrops = [];
let testUsers = [];

// 初始化
export function setup() {
  console.log('🎁 初始化空投系统性能测试...');
  
  // 创建测试空投
  const airdrops = [];
  for (let i = 0; i < 5; i++) {
    const payload = JSON.stringify({
      name: `Performance Test Airdrop ${i}`,
      description: 'Load testing airdrop',
      totalAmount: 1000000,
      recipientCount: 10000,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    
    const res = http.post(`${BASE_URL}${API_PREFIX}/airdrops`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (res.status === 200 || res.status === 201) {
      airdrops.push(res.json());
    }
    
    sleep(0.1);
  }
  
  // 创建测试用户账户
  const users = [];
  for (let i = 0; i < 50; i++) {
    const payload = JSON.stringify({
      address: `airdrop_user_${Date.now()}_${i}`,
      initialBalance: 0,
    });
    
    const res = http.post(`${BASE_URL}${API_PREFIX}/accounts`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (res.status === 200 || res.status === 201) {
      users.push(res.json());
    }
    
    sleep(0.05);
  }
  
  console.log(`✅ 创建了 ${airdrops.length} 个测试空投`);
  console.log(`✅ 创建了 ${users.length} 个测试用户`);
  
  return { airdrops, users };
}

// 测试 1: 空投查询
export function testAirdropQuery(data) {
  group('空投查询测试', () => {
    // 查询空投列表
    const startTime1 = new Date();
    const listRes = http.get(`${BASE_URL}${API_PREFIX}/airdrops`);
    const duration1 = new Date() - startTime1;
    
    airdropQueryDuration.add(duration1);
    airdropOperations.add(1);
    
    const listSuccess = check(listRes, {
      '✅ 空投列表状态码为 200': (r) => r.status === 200,
      '✅ 列表查询响应时间 P95 < 100ms': () => duration1 < 100,
      '✅ 返回空投数组': (r) => {
        const body = r.json();
        return Array.isArray(body) || Array.isArray(body.data);
      },
    });
    
    airdropErrorRate.add(!listSuccess);
    
    // 如果有空投，查询单个空投详情
    if (data.airdrops && data.airdrops.length > 0) {
      const airdrop = data.airdrops[Math.floor(Math.random() * data.airdrops.length)];
      const airdropId = airdrop.id || airdrop._id;
      
      const startTime2 = new Date();
      const detailRes = http.get(`${BASE_URL}${API_PREFIX}/airdrops/${airdropId}`);
      const duration2 = new Date() - startTime2;
      
      airdropQueryDuration.add(duration2);
      airdropOperations.add(1);
      
      const detailSuccess = check(detailRes, {
        '✅ 空投详情状态码为 200': (r) => r.status === 200,
        '✅ 详情查询响应时间 P95 < 100ms': () => duration2 < 100,
        '✅ 返回空投信息': (r) => {
          const body = r.json();
          return body.name !== undefined || body.data?.name !== undefined;
        },
      });
      
      airdropErrorRate.add(!detailSuccess);
    }
  });
  
  sleep(Math.random() * 0.5 + 0.2);
}

// 测试 2: 空投领取
export function testAirdropClaim(data) {
  if (!data.airdrops || data.airdrops.length === 0 || 
      !data.users || data.users.length === 0) {
    console.log('⚠️ 测试数据不足，无法进行空投领取测试');
    return;
  }
  
  group('空投领取测试', () => {
    const airdrop = data.airdrops[Math.floor(Math.random() * data.airdrops.length)];
    const user = data.users[Math.floor(Math.random() * data.users.length)];
    const airdropId = airdrop.id || airdrop._id;
    const userAddress = user.address || user.id;
    
    const payload = JSON.stringify({
      userAddress: userAddress,
    });
    
    const startTime = new Date();
    const res = http.post(
      `${BASE_URL}${API_PREFIX}/airdrops/${airdropId}/claim`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const duration = new Date() - startTime;
    
    airdropClaimDuration.add(duration);
    airdropOperations.add(1);
    
    const success = check(res, {
      '✅ 状态码为 200/400': (r) => r.status === 200 || r.status === 400,
      '✅ 响应时间 P95 < 200ms': () => duration < 200,
      '✅ 响应时间 P99 < 400ms': () => duration < 400,
      '✅ 返回领取结果': (r) => {
        const body = r.json();
        return body.success !== undefined || 
               body.claimed !== undefined ||
               body.message !== undefined;
      },
    });
    
    // 统计成功领取率（排除已领取的情况）
    if (res.status === 200) {
      const body = res.json();
      airdropClaimSuccess.add(body.success === true);
    }
    
    airdropErrorRate.add(!success);
    
    if (!success && res.status !== 400) {
      console.log(`❌ 空投领取失败: ${res.status} - ${res.body}`);
    }
  });
  
  sleep(Math.random() * 1 + 0.5);
}

// 清理
export function teardown(data) {
  console.log('🧹 清理空投系统测试数据...');
  console.log(`📊 执行了 ${airdropOperations.name} 次空投操作`);
  console.log('✅ 空投系统性能测试完成');
}
