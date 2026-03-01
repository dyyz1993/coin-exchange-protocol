// 综合性能基准测试入口

import http from 'k6/http';
import { check, sleep } from 'k6';
import { 
  generateUserId, 
  generateAmount,
  generateAirdropId,
  generateTaskId,
  generateTimestamp,
  collectMetrics,
  config 
} from './k6.config.js';

// 综合测试选项
export let options = {
  stages: [
    { duration: '1m', target: 20 },   // 增加到20并发
    { duration: '3m', target: 20 },   // 维持3分钟
    { duration: '1m', target: 50 },   // 增加到50并发
    { duration: '3m', target: 50 },   // 维持3分钟
    { duration: '1m', target: 0 },    // 减少到0
  ],
  thresholds: {
    http_req_duration: ['p(50)<100', 'p(95)<200', 'p(99)<400'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.95'],
  },
};

const BASE_URL = config.baseUrl;

// 综合测试流程
export default function () {
  const userId = generateUserId();
  const airdropId = generateAirdropId();
  const taskId = generateTaskId();
  
  // ========== 账户系统测试 ==========
  
  // 1. 创建账户
  let payload = JSON.stringify({ userId, initialBalance: 0 });
  let response = http.post(`${BASE_URL}/account/create`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  collectMetrics(response, 'create', 'createAccount');
  check(response, { '✅ 创建账户成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // 2. 查询余额
  response = http.get(`${BASE_URL}/account/balance/${userId}`);
  collectMetrics(response, 'query', 'getBalance');
  check(response, { '✅ 查询余额成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // 3. 充值
  payload = JSON.stringify({ userId, amount: 100, reason: '基准测试' });
  response = http.post(`${BASE_URL}/account/deposit`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  collectMetrics(response, 'create', 'deposit');
  check(response, { '✅ 充值成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // 4. 转账
  const toUserId = generateUserId();
  payload = JSON.stringify({
    fromUserId: userId,
    toUserId: toUserId,
    amount: 10,
    reason: '基准测试转账'
  });
  response = http.post(`${BASE_URL}/account/transfer`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  collectMetrics(response, 'transfer', 'transfer');
  check(response, { '✅ 转账成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // 5. 查询交易记录
  response = http.get(`${BASE_URL}/account/transactions/${userId}`);
  collectMetrics(response, 'query', 'getTransactions');
  check(response, { '✅ 查询交易记录成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // ========== 空投系统测试 ==========
  
  // 6. 创建空投
  payload = JSON.stringify({
    name: `基准测试空投 ${airdropId}`,
    description: '基准测试',
    totalAmount: 10000,
    perUserAmount: 10,
    startTime: generateTimestamp(0),
    endTime: generateTimestamp(30),
  });
  response = http.post(`${BASE_URL}/airdrop/create`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  collectMetrics(response, 'create', 'createAirdrop');
  check(response, { '✅ 创建空投成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // 7. 获取活跃空投
  response = http.get(`${BASE_URL}/airdrop/active`);
  collectMetrics(response, 'query', 'getActiveAirdrops');
  check(response, { '✅ 获取活跃空投成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // 8. 领取空投
  payload = JSON.stringify({ airdropId, userId });
  response = http.post(`${BASE_URL}/airdrop/claim`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  collectMetrics(response, 'create', 'claimAirdrop');
  check(response, { '✅ 领取空投成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // ========== 任务系统测试 ==========
  
  // 9. 创建任务
  payload = JSON.stringify({
    title: `基准测试任务 ${taskId}`,
    description: '基准测试',
    reward: 50,
    type: 'daily',
    maxCompletions: 100,
    startTime: generateTimestamp(0),
    endTime: generateTimestamp(7),
  });
  response = http.post(`${BASE_URL}/task/create`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  collectMetrics(response, 'create', 'createTask');
  check(response, { '✅ 创建任务成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // 10. 获取活跃任务
  response = http.get(`${BASE_URL}/task/active`);
  collectMetrics(response, 'query', 'getActiveTasks');
  check(response, { '✅ 获取活跃任务成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // 11. 完成任务
  payload = JSON.stringify({ taskId, userId });
  response = http.post(`${BASE_URL}/task/complete`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  collectMetrics(response, 'create', 'completeTask');
  check(response, { '✅ 完成任务成功': (r) => r.status === 200 });
  sleep(0.5);
  
  // 12. 查询用户完成记录
  response = http.get(`${BASE_URL}/task/completions/${userId}`);
  collectMetrics(response, 'query', 'getUserCompletions');
  check(response, { '✅ 查询完成记录成功': (r) => r.status === 200 });
  sleep(1);
}

// 测试初始化
export function setup() {
  console.log('🚀 开始性能基准测试...');
  console.log(`📍 目标API: ${BASE_URL}`);
  return { startTime: Date.now() };
}

// 测试结束
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ 性能基准测试完成，总耗时: ${duration}s`);
}
