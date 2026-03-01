// 账户系统性能测试场景

import http from 'k6/http';
import { check, sleep } from 'k6';
import { 
  generateUserId, 
  generateAmount, 
  collectMetrics,
  config 
} from '../k6.config.js';

// 账户系统性能测试选项
export let options = {
  stages: [
    { duration: '2m', target: 100 },  // 增加到100并发
    { duration: '5m', target: 100 },  // 维持5分钟
    { duration: '2m', target: 200 },  // 增加到200并发
    { duration: '5m', target: 200 },  // 维持5分钟
    { duration: '2m', target: 0 },    // 减少到0
  ],
  thresholds: {
    http_req_duration: ['p(50)<100', 'p(95)<200', 'p(99)<400'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.95'],
  },
};

const BASE_URL = config.baseUrl;

// 测试场景1: 创建账户
export function testCreateAccount() {
  const userId = generateUserId();
  const payload = JSON.stringify({
    userId: userId,
    initialBalance: 0,
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/account/create`, payload, params);
  
  collectMetrics(response, 'create', 'createAccount');
  
  check(response, {
    '创建账户 - 状态码为200': (r) => r.status === 200,
    '创建账户 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
    '创建账户 - 响应包含success': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true || body.success === false; // 成功或已存在
      } catch {
        return false;
      }
    },
  });
  
  sleep(1);
  return userId;
}

// 测试场景2: 查询余额
export function testGetBalance(userId) {
  const response = http.get(`${BASE_URL}/account/balance/${userId}`);
  
  collectMetrics(response, 'query', 'getBalance');
  
  check(response, {
    '查询余额 - 状态码为200': (r) => r.status === 200,
    '查询余额 - 响应时间 < 100ms': (r) => r.timings.duration < 100,
    '查询余额 - 响应包含balance': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.balance !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景3: 充值
export function testDeposit(userId) {
  const amount = generateAmount(10, 100);
  const payload = JSON.stringify({
    userId: userId,
    amount: amount,
    reason: '性能测试充值',
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/account/deposit`, payload, params);
  
  collectMetrics(response, 'create', 'deposit');
  
  check(response, {
    '充值 - 状态码为200': (r) => r.status === 200,
    '充值 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
    '充值 - 操作成功': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
  });
  
  sleep(1);
  return amount;
}

// 测试场景4: 提现
export function testWithdraw(userId) {
  const amount = generateAmount(1, 50);
  const payload = JSON.stringify({
    userId: userId,
    amount: amount,
    reason: '性能测试提现',
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/account/withdraw`, payload, params);
  
  collectMetrics(response, 'create', 'withdraw');
  
  check(response, {
    '提现 - 状态码为200': (r) => r.status === 200,
    '提现 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}

// 测试场景5: 转账
export function testTransfer(fromUserId) {
  const toUserId = generateUserId();
  const amount = generateAmount(1, 20);
  
  const payload = JSON.stringify({
    fromUserId: fromUserId,
    toUserId: toUserId,
    amount: amount,
    reason: '性能测试转账',
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/account/transfer`, payload, params);
  
  collectMetrics(response, 'transfer', 'transfer');
  
  check(response, {
    '转账 - 状态码为200': (r) => r.status === 200,
    '转账 - 响应时间 < 300ms': (r) => r.timings.duration < 300,
  });
  
  sleep(1);
}

// 测试场景6: 查询交易记录
export function testGetTransactions(userId) {
  const response = http.get(`${BASE_URL}/account/transactions/${userId}`);
  
  collectMetrics(response, 'query', 'getTransactions');
  
  check(response, {
    '查询交易记录 - 状态码为200': (r) => r.status === 200,
    '查询交易记录 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
    '查询交易记录 - 返回数组': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.transactions) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景7: 冻结余额
export function testFreezeBalance(userId) {
  const amount = generateAmount(1, 10);
  const payload = JSON.stringify({
    userId: userId,
    amount: amount,
    reason: '性能测试冻结',
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/account/freeze-balance`, payload, params);
  
  collectMetrics(response, 'create', 'freezeBalance');
  
  check(response, {
    '冻结余额 - 状态码为200': (r) => r.status === 200,
    '冻结余额 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
  return amount;
}

// 测试场景8: 解冻余额
export function testUnfreezeBalance(userId, amount) {
  const payload = JSON.stringify({
    userId: userId,
    amount: amount,
    reason: '性能测试解冻',
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/account/unfreeze-balance`, payload, params);
  
  collectMetrics(response, 'create', 'unfreezeBalance');
  
  check(response, {
    '解冻余额 - 状态码为200': (r) => r.status === 200,
    '解冻余额 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}

// 主测试流程
export default function () {
  // 1. 创建账户
  const userId = testCreateAccount();
  
  // 2. 查询余额
  testGetBalance(userId);
  
  // 3. 充值
  testDeposit(userId);
  
  // 4. 再次查询余额
  testGetBalance(userId);
  
  // 5. 转账
  testTransfer(userId);
  
  // 6. 冻结余额
  const frozenAmount = testFreezeBalance(userId);
  
  // 7. 解冻余额
  testUnfreezeBalance(userId, frozenAmount);
  
  // 8. 查询交易记录
  testGetTransactions(userId);
  
  // 9. 提现
  testWithdraw(userId);
}
