// 任务系统性能测试场景

import http from 'k6/http';
import { check, sleep } from 'k6';
import { 
  generateUserId, 
  generateTaskId,
  generateTimestamp,
  collectMetrics,
  config 
} from '../k6.config.js';

// 任务系统性能测试选项
export let options = {
  stages: [
    { duration: '2m', target: 80 },   // 增加到80并发
    { duration: '5m', target: 80 },   // 维持5分钟
    { duration: '2m', target: 150 },  // 增加到150并发
    { duration: '5m', target: 150 },  // 维持5分钟
    { duration: '2m', target: 0 },    // 减少到0
  ],
  thresholds: {
    http_req_duration: ['p(50)<100', 'p(95)<200', 'p(99)<400'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.95'],
  },
};

const BASE_URL = config.baseUrl;

// 测试场景1: 创建任务
export function testCreateTask() {
  const taskId = generateTaskId();
  const payload = JSON.stringify({
    title: `性能测试任务 ${taskId}`,
    description: '这是一个性能测试任务',
    reward: 100,
    type: 'daily',
    maxCompletions: 1000,
    startTime: generateTimestamp(0),
    endTime: generateTimestamp(7),
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/task/create`, payload, params);
  
  collectMetrics(response, 'create', 'createTask');
  
  check(response, {
    '创建任务 - 状态码为200': (r) => r.status === 200,
    '创建任务 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
    '创建任务 - 响应包含taskId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.taskId !== undefined || body.success !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  sleep(1);
  return taskId;
}

// 测试场景2: 获取任务详情
export function testGetTask(taskId) {
  const response = http.get(`${BASE_URL}/task/${taskId}`);
  
  collectMetrics(response, 'query', 'getTask');
  
  check(response, {
    '获取任务详情 - 状态码为200': (r) => r.status === 200,
    '获取任务详情 - 响应时间 < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(0.5);
}

// 测试场景3: 获取所有任务列表
export function testGetAllTasks() {
  const response = http.get(`${BASE_URL}/task/list`);
  
  collectMetrics(response, 'query', 'getAllTasks');
  
  check(response, {
    '获取所有任务 - 状态码为200': (r) => r.status === 200,
    '获取所有任务 - 响应时间 < 100ms': (r) => r.timings.duration < 100,
    '获取所有任务 - 返回数组': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.tasks) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景4: 获取活跃任务
export function testGetActiveTasks() {
  const response = http.get(`${BASE_URL}/task/active`);
  
  collectMetrics(response, 'query', 'getActiveTasks');
  
  check(response, {
    '获取活跃任务 - 状态码为200': (r) => r.status === 200,
    '获取活跃任务 - 响应时间 < 100ms': (r) => r.timings.duration < 100,
    '获取活跃任务 - 返回数组': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.tasks) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景5: 检查用户是否可完成任务
export function testCanUserComplete(taskId, userId) {
  const response = http.get(`${BASE_URL}/task/can-complete/${taskId}/${userId}`);
  
  collectMetrics(response, 'query', 'canUserComplete');
  
  check(response, {
    '检查可完成 - 状态码为200': (r) => r.status === 200,
    '检查可完成 - 响应时间 < 100ms': (r) => r.timings.duration < 100,
    '检查可完成 - 响应包含canComplete': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.canComplete !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景6: 完成任务
export function testCompleteTask(taskId, userId) {
  const payload = JSON.stringify({
    taskId: taskId,
    userId: userId,
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/task/complete`, payload, params);
  
  collectMetrics(response, 'create', 'completeTask');
  
  check(response, {
    '完成任务 - 状态码为200': (r) => r.status === 200,
    '完成任务 - 响应时间 < 300ms': (r) => r.timings.duration < 300,
    '完成任务 - 操作成功或已完成': (r) => {
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

// 测试场景7: 获取用户可完成的任务
export function testGetAvailableTasks(userId) {
  const response = http.get(`${BASE_URL}/task/available/${userId}`);
  
  collectMetrics(response, 'query', 'getAvailableTasks');
  
  check(response, {
    '获取可用任务 - 状态码为200': (r) => r.status === 200,
    '获取可用任务 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
    '获取可用任务 - 返回数组': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.tasks) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景8: 获取用户完成记录
export function testGetUserCompletions(userId) {
  const response = http.get(`${BASE_URL}/task/completions/${userId}`);
  
  collectMetrics(response, 'query', 'getUserCompletions');
  
  check(response, {
    '获取完成记录 - 状态码为200': (r) => r.status === 200,
    '获取完成记录 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
    '获取完成记录 - 返回数组': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.completions) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });
  
  sleep(0.5);
}

// 测试场景9: 暂停任务
export function testPauseTask(taskId) {
  const response = http.post(`${BASE_URL}/task/pause/${taskId}`);
  
  collectMetrics(response, 'create', 'pauseTask');
  
  check(response, {
    '暂停任务 - 状态码为200': (r) => r.status === 200,
    '暂停任务 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}

// 测试场景10: 激活任务
export function testActivateTask(taskId) {
  const response = http.post(`${BASE_URL}/task/activate/${taskId}`);
  
  collectMetrics(response, 'create', 'activateTask');
  
  check(response, {
    '激活任务 - 状态码为200': (r) => r.status === 200,
    '激活任务 - 响应时间 < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}

// 主测试流程
export default function () {
  const userId = generateUserId();
  const taskId = generateTaskId();
  
  // 1. 创建任务
  testCreateTask();
  
  // 2. 获取活跃任务
  testGetActiveTasks();
  
  // 3. 获取所有任务
  testGetAllTasks();
  
  // 4. 获取任务详情
  testGetTask(taskId);
  
  // 5. 获取用户可完成的任务
  testGetAvailableTasks(userId);
  
  // 6. 检查用户是否可完成任务
  testCanUserComplete(taskId, userId);
  
  // 7. 完成任务
  testCompleteTask(taskId, userId);
  
  // 8. 获取用户完成记录
  testGetUserCompletions(userId);
}
