// 空投系统性能测试场景

import http from 'k6/http';
import { check, sleep } from 'k6';
import { 
  generateUserId, 
  generateAirdropId,
  generateTimestamp,
  collectMetrics,
  config 
} from '../k6.config.js';

// 空投系统性能测试选项
export let options = {
  stages: [
    { duration: '2m', target: 50 },   // 增加到50并发
    { duration: '5m', target: 50 },   // 维持5分钟
    { duration: '2m', target: 100 },  // 增加到100并发
    { duration: '5m', target: 100 },  // 维持5分钟
    { duration: '2m', target: 0 },    // 减少到0
  ],
  thresholds: {
    http_req_duration: ['p(50)<100', 'p(95)<200', 'p(99)<400'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.95'],
  },
};

const BASE_URL = config.baseUrl;

// 测试场景1: 创建空投
export function testCreateAirdrop() {
  const airdropId = generateAirdropId();
  const payload = JSON.stringify({
    name: `性能测试空投 ${airdropId}`,
    description: '这是一个性能测试空投',
    totalAmount: 100000,
    perUserAmount: 100,
    startTime: generateTimestamp(0),
    endTime: generateTimestamp(30),
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/airdrop/create`, payload, params);
  
  collectMetrics(response, 'create', 'createAirdrop');
  
  check(response, {
    '创建空投 - 状态码为200': (r) => r.status === 200,
    '创建空投 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
    '创建空投 - 响应包含airdropId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.airdropId !== undefined || body.success !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  sleep(1);
  return airdropId;
}

// 测试场景2: 获取空投详情
export function testGetAirdrop(airdropId) {
  const response = http.get(`${BASE_URL}/airdrop/${airdropId}`);
  
  collectMetrics(response, 'query', 'getAirdrop');
  
  check(response, {
    '获取空投详情 - 状态码为200': (r) => r.status === 200,
    '获取空投详情 - 响应时间 < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(0.5);
}

// 测试场景3: 获取活跃空投列表
export function testGetActiveAirdrops() {
  const response = http.get(`${BASE_URL}/airdrop/active`);
  
  collectMetrics(response, 'query', 'getActiveAirdrops');
  
  check(response, {
    '获取活跃空投 - 状态码为200': (r) => r.status === 200,
    '获取活跃空投 - 响应时间 < 100ms': (r) => r.timings.duration < 100,
    '获取活跃空投 - 返回数组': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.airdrops) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景4: 检查用户是否可领取
export function testCanUserClaim(airdropId, userId) {
  const response = http.get(`${BASE_URL}/airdrop/can-claim/${airdropId}/${userId}`);
  
  collectMetrics(response, 'query', 'canUserClaim');
  
  check(response, {
    '检查可领取 - 状态码为200': (r) => r.status === 200,
    '检查可领取 - 响应时间 < 100ms': (r) => r.timings.duration < 100,
    '检查可领取 - 响应包含canClaim': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.canClaim !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景5: 领取空投
export function testClaimAirdrop(airdropId, userId) {
  const payload = JSON.stringify({
    airdropId: airdropId,
    userId: userId,
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/airdrop/claim`, payload, params);
  
  collectMetrics(response, 'create', 'claimAirdrop');
  
  check(response, {
    '领取空投 - 状态码为200': (r) => r.status === 200,
    '领取空投 - 响应时间 < 300ms': (r) => r.timings.duration < 300,
    '领取空投 - 操作成功或已领取': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true || body.error !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  sleep(1);
}

// 测试场景6: 获取用户领取记录
export function testGetUserClaims(userId) {
  const response = http.get(`${BASE_URL}/airdrop/claims/${userId}`);
  
  collectMetrics(response, 'query', 'getUserClaims');
  
  check(response, {
    '获取领取记录 - 状态码为200': (r) => r.status === 200,
    '获取领取记录 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
    '获取领取记录 - 返回数组': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.claims) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景7: 激活空投
export function testActivateAirdrop(airdropId) {
  const response = http.post(`${BASE_URL}/airdrop/activate/${airdropId}`);
  
  collectMetrics(response, 'create', 'activateAirdrop');
  
  check(response, {
    '激活空投 - 状态码为200': (r) => r.status === 200,
    '激活空投 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}

// 主测试流程
export default function () {
  const userId = generateUserId();
  const airdropId = generateAirdropId();
  
  // 1. 创建空投
  testCreateAirdrop();
  
  // 2. 获取活跃空投列表
  testGetActiveAirdrops();
  
  // 3. 获取空投详情
  testGetAirdrop(airdropId);
  
  // 4. 检查用户是否可领取
  testCanUserClaim(airdropId, userId);
  
  // 5. 领取空投
  testClaimAirdrop(airdropId, userId);
  
  // 6. 获取用户领取记录
  testGetUserClaims(userId);
}
