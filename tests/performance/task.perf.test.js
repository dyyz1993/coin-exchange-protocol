// 任务系统性能测试
// 测试任务创建、完成、查询等核心功能

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 任务系统专用指标
const taskQueryDuration = new Trend('task_query_duration');
const taskCompleteDuration = new Trend('task_complete_duration');
const taskCreateDuration = new Trend('task_create_duration');
const taskErrorRate = new Rate('task_errors');
const taskCompleteSuccess = new Rate('task_complete_success');
const taskOperations = new Counter('task_operations');

// 测试配置 - 任务系统
export const options = {
  scenarios: {
    // 场景 1: 任务查询负载测试
    task_query_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // 逐步增加到 50 VU
        { duration: '2m', target: 100 },   // 增加到 100 VU
        { duration: '1m', target: 100 },   // 维持 100 VU
        { duration: '30s', target: 0 },    // 降低到 0
      ],
      exec: 'testTaskQuery',
    },
    
    // 场景 2: 任务完成负载测试
    task_complete_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 30 },   // 逐步增加到 30 VU
        { duration: '1m', target: 60 },    // 增加到 60 VU
        { duration: '1m', target: 60 },    // 维持 60 VU
        { duration: '20s', target: 0 },    // 降低到 0
      ],
      exec: 'testTaskComplete',
      startTime: '1m',
    },
  },
  
  thresholds: {
    // 任务查询 SLA
    'task_query_duration': ['p(95)<150', 'p(99)<300'],
    
    // 任务完成 SLA
    'task_complete_duration': ['p(95)<250', 'p(99)<500'],
    
    // 任务创建 SLA
    'task_create_duration': ['p(95)<200', 'p(99)<400'],
    
    // 错误率阈值
    'task_errors': ['rate<0.05'],
    'task_complete_success': ['rate>0.95'],
    
    // 全局 HTTP 指标
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<300', 'p(99)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

// 共享测试数据
let testTasks = [];
let testUsers = [];

// 初始化
export function setup() {
  console.log('📋 初始化任务系统性能测试...');
  
  // 创建测试任务
  const tasks = [];
  const taskTypes = ['daily', 'weekly', 'monthly', 'special'];
  const taskNames = [
    '每日签到',
    '完成交易',
    '邀请好友',
    '分享内容',
    '完善资料',
    '观看视频',
    '参与投票',
    '发布内容',
  ];
  
  for (let i = 0; i < 10; i++) {
    const payload = JSON.stringify({
      name: taskNames[i % taskNames.length] + ` ${i}`,
      description: `Performance test task ${i}`,
      type: taskTypes[i % taskTypes.length],
      reward: Math.floor(Math.random() * 100) + 10,
      requirement: {
        type: 'count',
        target: Math.floor(Math.random() * 10) + 1,
      },
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    
    const res = http.post(`${BASE_URL}${API_PREFIX}/tasks`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (res.status === 200 || res.status === 201) {
      tasks.push(res.json());
    }
    
    sleep(0.1);
  }
  
  // 创建测试用户账户
  const users = [];
  for (let i = 0; i < 50; i++) {
    const payload = JSON.stringify({
      address: `task_user_${Date.now()}_${i}`,
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
  
  console.log(`✅ 创建了 ${tasks.length} 个测试任务`);
  console.log(`✅ 创建了 ${users.length} 个测试用户`);
  
  return { tasks, users };
}

// 测试 1: 任务查询
export function testTaskQuery(data) {
  group('任务查询测试', () => {
    // 查询任务列表
    const startTime1 = new Date();
    const listRes = http.get(`${BASE_URL}${API_PREFIX}/tasks?page=1&limit=20`);
    const duration1 = new Date() - startTime1;
    
    taskQueryDuration.add(duration1);
    taskOperations.add(1);
    
    const listSuccess = check(listRes, {
      '✅ 任务列表状态码为 200': (r) => r.status === 200,
      '✅ 列表查询响应时间 P95 < 150ms': () => duration1 < 150,
      '✅ 返回任务数组': (r) => {
        const body = r.json();
        return Array.isArray(body) || Array.isArray(body.data) || body.tasks !== undefined;
      },
    });
    
    taskErrorRate.add(!listSuccess);
    
    // 如果有任务，查询单个任务详情
    if (data.tasks && data.tasks.length > 0) {
      const task = data.tasks[Math.floor(Math.random() * data.tasks.length)];
      const taskId = task.id || task._id;
      
      const startTime2 = new Date();
      const detailRes = http.get(`${BASE_URL}${API_PREFIX}/tasks/${taskId}`);
      const duration2 = new Date() - startTime2;
      
      taskQueryDuration.add(duration2);
      taskOperations.add(1);
      
      const detailSuccess = check(detailRes, {
        '✅ 任务详情状态码为 200': (r) => r.status === 200,
        '✅ 详情查询响应时间 P95 < 150ms': () => duration2 < 150,
        '✅ 返回任务信息': (r) => {
          const body = r.json();
          return body.name !== undefined || body.data?.name !== undefined;
        },
      });
      
      taskErrorRate.add(!detailSuccess);
    }
    
    // 查询用户任务进度
    if (data.users && data.users.length > 0) {
      const user = data.users[Math.floor(Math.random() * data.users.length)];
      const userAddress = user.address || user.id;
      
      const startTime3 = new Date();
      const progressRes = http.get(
        `${BASE_URL}${API_PREFIX}/tasks/progress?userAddress=${userAddress}`
      );
      const duration3 = new Date() - startTime3;
      
      taskQueryDuration.add(duration3);
      taskOperations.add(1);
      
      check(progressRes, {
        '✅ 任务进度查询成功': (r) => r.status === 200,
      });
    }
  });
  
  sleep(Math.random() * 0.5 + 0.2);
}

// 测试 2: 任务完成
export function testTaskComplete(data) {
  if (!data.tasks || data.tasks.length === 0 || 
      !data.users || data.users.length === 0) {
    console.log('⚠️ 测试数据不足，无法进行任务完成测试');
    return;
  }
  
  group('任务完成测试', () => {
    const task = data.tasks[Math.floor(Math.random() * data.tasks.length)];
    const user = data.users[Math.floor(Math.random() * data.users.length)];
    const taskId = task.id || task._id;
    const userAddress = user.address || user.id;
    
    const payload = JSON.stringify({
      userAddress: userAddress,
      proof: `task_proof_${Date.now()}`,
    });
    
    const startTime = new Date();
    const res = http.post(
      `${BASE_URL}${API_PREFIX}/tasks/${taskId}/complete`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const duration = new Date() - startTime;
    
    taskCompleteDuration.add(duration);
    taskOperations.add(1);
    
    const success = check(res, {
      '✅ 状态码为 200/400': (r) => r.status === 200 || r.status === 400,
      '✅ 响应时间 P95 < 250ms': () => duration < 250,
      '✅ 响应时间 P99 < 500ms': () => duration < 500,
      '✅ 返回完成结果': (r) => {
        const body = r.json();
        return body.success !== undefined || 
               body.completed !== undefined ||
               body.message !== undefined;
      },
    });
    
    // 统计成功完成率（排除已完成的情况）
    if (res.status === 200) {
      const body = res.json();
      taskCompleteSuccess.add(body.success === true || body.completed === true);
    }
    
    taskErrorRate.add(!success);
    
    if (!success && res.status !== 400) {
      console.log(`❌ 任务完成失败: ${res.status} - ${res.body}`);
    }
  });
  
  sleep(Math.random() * 1.5 + 0.5);
}

// 清理
export function teardown(data) {
  console.log('🧹 清理任务系统测试数据...');
  console.log(`📊 执行了 ${taskOperations.name} 次任务操作`);
  console.log('✅ 任务系统性能测试完成');
}
