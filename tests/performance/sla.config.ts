/**
 * SLA (Service Level Agreement) 配置
 * 定义性能基准和可用性目标
 */

export interface SLATarget {
  metric: string;
  description: string;
  target: number;
  unit: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface PerformanceThreshold {
  p50: number; // 中位数
  p95: number; // 95分位
  p99: number; // 99分位
  max: number; // 最大值
}

/**
 * API 响应时间 SLA
 * 单位：毫秒 (ms)
 */
export const API_RESPONSE_TIME_SLA: Record<string, PerformanceThreshold> = {
  // 账户系统 API
  'account.create': {
    p50: 50,
    p95: 100,
    p99: 200,
    max: 500,
  },
  'account.get': {
    p50: 20,
    p95: 50,
    p99: 100,
    max: 200,
  },
  'account.transfer': {
    p50: 100,
    p95: 200,
    p99: 500,
    max: 1000,
  },
  'account.getBalance': {
    p50: 15,
    p95: 30,
    p99: 50,
    max: 100,
  },
  'account.getHistory': {
    p50: 100,
    p95: 200,
    p99: 500,
    max: 1000,
  },

  // 空投系统 API
  'airdrop.claim': {
    p50: 100,
    p95: 200,
    p99: 500,
    max: 1000,
  },
  'airdrop.check': {
    p50: 30,
    p95: 50,
    p99: 100,
    max: 200,
  },
  'airdrop.getStatus': {
    p50: 20,
    p95: 50,
    p99: 100,
    max: 200,
  },

  // 任务系统 API
  'task.complete': {
    p50: 150,
    p95: 300,
    p99: 600,
    max: 1500,
  },
  'task.get': {
    p50: 30,
    p95: 50,
    p99: 100,
    max: 200,
  },
  'task.list': {
    p50: 50,
    p95: 100,
    p99: 200,
    max: 500,
  },

  // 冻结系统 API
  'freeze.check': {
    p50: 20,
    p95: 50,
    p99: 100,
    max: 200,
  },
  'freeze.freeze': {
    p50: 50,
    p95: 100,
    p99: 200,
    max: 500,
  },
  'freeze.unfreeze': {
    p50: 50,
    p95: 100,
    p99: 200,
    max: 500,
  },
};

/**
 * 吞吐量 SLA
 * 单位：请求/秒 (QPS)
 */
export const THROUGHPUT_SLA = {
  'account.create': 100,
  'account.get': 500,
  'account.transfer': 50,
  'airdrop.claim': 100,
  'task.complete': 50,
  'task.get': 200,
};

/**
 * 可用性 SLA
 * 单位：百分比
 */
export const AVAILABILITY_SLA = {
  target: 99.9, // 99.9% 可用性
  measurementWindow: 30 * 24 * 60 * 60 * 1000, // 30天窗口
  allowedDowntime: 43.2 * 60 * 1000, // 每月允许43.2分钟停机
};

/**
 * 并发用户数 SLA
 */
export const CONCURRENCY_SLA = {
  maxConcurrentUsers: 1000,
  targetResponseTime: 500, // 在最大并发下，响应时间应小于500ms
};

/**
 * 资源使用 SLA
 */
export const RESOURCE_SLA = {
  maxCPUPercent: 80,
  maxMemoryPercent: 85,
  maxDatabaseConnections: 100,
  maxEventLoopLag: 100, // ms
};

/**
 * 错误率 SLA
 */
export const ERROR_RATE_SLA = {
  maxErrorRate: 0.1, // 0.1% 最大错误率
  max5xxRate: 0.05, // 0.05% 最大5xx错误率
};

/**
 * 数据一致性 SLA
 */
export const CONSISTENCY_SLA = {
  eventualConsistencyDelay: 1000, // 最终一致性延迟 < 1秒
  strongConsistencyOperations: ['account.transfer', 'airdrop.claim'],
};

/**
 * 性能回归阈值
 */
export const REGRESSION_THRESHOLD = {
  maxDegradation: 20, // 性能退化不超过20%
  comparisonBaseline: 'previous-version', // 与上一个版本比较
};

/**
 * 获取所有 SLA 目标列表
 */
export function getAllSLATargets(): SLATarget[] {
  const targets: SLATarget[] = [];

  // API 响应时间
  Object.entries(API_RESPONSE_TIME_SLA).forEach(([api, threshold]) => {
    targets.push({
      metric: `api.response_time.${api}.p99`,
      description: `${api} API 99分位响应时间`,
      target: threshold.p99,
      unit: 'ms',
      severity: 'critical',
    });
  });

  // 可用性
  targets.push({
    metric: 'availability.overall',
    description: '系统整体可用性',
    target: AVAILABILITY_SLA.target,
    unit: '%',
    severity: 'critical',
  });

  // 错误率
  targets.push({
    metric: 'error_rate.overall',
    description: '系统整体错误率',
    target: ERROR_RATE_SLA.maxErrorRate * 100,
    unit: '%',
    severity: 'critical',
  });

  // 吞吐量
  Object.entries(THROUGHPUT_SLA).forEach(([api, qps]) => {
    targets.push({
      metric: `throughput.${api}`,
      description: `${api} API 吞吐量`,
      target: qps,
      unit: 'QPS',
      severity: 'warning',
    });
  });

  return targets;
}

/**
 * 检查性能指标是否满足 SLA
 */
export function checkSLACompliance(
  metric: string,
  value: number,
  threshold: number
): { compliant: boolean; deviation: number } {
  const deviation = ((value - threshold) / threshold) * 100;
  return {
    compliant: value <= threshold,
    deviation,
  };
}

/**
 * 性能测试配置
 */
export const PERFORMANCE_TEST_CONFIG = {
  // 测试持续时间
  duration: {
    quick: '30s',
    standard: '2m',
    thorough: '10m',
  },

  // 虚拟用户数
  vus: {
    light: 10,
    moderate: 50,
    heavy: 200,
    stress: 500,
  },

  // 请求间隔
  thinkTime: {
    min: 100,
    max: 500,
  },

  // 预热时间
  warmupDuration: '10s',

  // 冷却时间
  cooldownDuration: '10s',
};

export default {
  API_RESPONSE_TIME_SLA,
  THROUGHPUT_SLA,
  AVAILABILITY_SLA,
  CONCURRENCY_SLA,
  RESOURCE_SLA,
  ERROR_RATE_SLA,
  CONSISTENCY_SLA,
  REGRESSION_THRESHOLD,
  PERFORMANCE_TEST_CONFIG,
};
