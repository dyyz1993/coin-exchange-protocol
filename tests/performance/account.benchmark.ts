/**
 * 账户系统性能基准测试
 * 测试账户创建、查询、转账等核心操作的性能
 */

import { performance } from 'perf_hooks';
import { AccountService } from '../../src/services/account.service';
import { API_RESPONSE_TIME_SLA } from './sla.config';

export interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  opsPerSecond: number;
  passed: boolean;
  violations: string[];
}

export class AccountBenchmark {
  private accountService: AccountService;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.accountService = new AccountService();
  }

  /**
   * 运行所有账户系统性能测试
   */
  async runAllBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('🚀 开始账户系统性能基准测试...\n');

    // 1. 创建账户性能测试
    await this.benchmarkCreateAccount();

    // 2. 查询账户性能测试
    await this.benchmarkGetAccount();

    // 3. 转账性能测试
    await this.benchmarkTransfer();

    // 4. 查询余额性能测试
    await this.benchmarkGetBalance();

    // 5. 查询历史记录性能测试
    await this.benchmarkGetHistory();

    this.printSummary();

    return this.results;
  }

  /**
   * 创建账户性能测试
   */
  async benchmarkCreateAccount(): Promise<BenchmarkResult> {
    const operation = 'account.create';
    const iterations = 100;
    const times: number[] = [];

    console.log(`\n📊 测试: ${operation}`);
    console.log(`   迭代次数: ${iterations}`);

    for (let i = 0; i < iterations; i++) {
      const owner = `perf-test-owner-${i}`;
      const start = performance.now();

      try {
        await this.accountService.createAccount(owner, BigInt(1000));
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        // 忽略重复创建错误，记录时间
        const end = performance.now();
        times.push(end - start);
      }
    }

    const result = this.calculateMetrics(operation, times, iterations);
    this.results.push(result);
    this.printResult(result);

    return result;
  }

  /**
   * 查询账户性能测试
   */
  async benchmarkGetAccount(): Promise<BenchmarkResult> {
    const operation = 'account.get';
    const iterations = 500;
    const times: number[] = [];

    console.log(`\n📊 测试: ${operation}`);
    console.log(`   迭代次数: ${iterations}`);

    // 先创建一些测试账户
    const testOwners = [];
    for (let i = 0; i < 10; i++) {
      testOwners.push(`perf-get-test-${i}`);
      try {
        await this.accountService.createAccount(`perf-get-test-${i}`, BigInt(1000));
      } catch (error) {
        // 忽略错误
      }
    }

    for (let i = 0; i < iterations; i++) {
      const owner = testOwners[i % testOwners.length];
      const start = performance.now();

      await this.accountService.getAccount(owner);

      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateMetrics(operation, times, iterations);
    this.results.push(result);
    this.printResult(result);

    return result;
  }

  /**
   * 转账性能测试
   */
  async benchmarkTransfer(): Promise<BenchmarkResult> {
    const operation = 'account.transfer';
    const iterations = 50;
    const times: number[] = [];

    console.log(`\n📊 测试: ${operation}`);
    console.log(`   迭代次数: ${iterations}`);

    // 创建测试账户
    const fromOwner = 'perf-transfer-from';
    const toOwner = 'perf-transfer-to';

    try {
      await this.accountService.createAccount(fromOwner, BigInt(100000));
      await this.accountService.createAccount(toOwner, BigInt(0));
    } catch (error) {
      // 忽略错误
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      try {
        await this.accountService.transfer(fromOwner, toOwner, BigInt(100));
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        const end = performance.now();
        times.push(end - start);
      }
    }

    const result = this.calculateMetrics(operation, times, iterations);
    this.results.push(result);
    this.printResult(result);

    return result;
  }

  /**
   * 查询余额性能测试
   */
  async benchmarkGetBalance(): Promise<BenchmarkResult> {
    const operation = 'account.getBalance';
    const iterations = 500;
    const times: number[] = [];

    console.log(`\n📊 测试: ${operation}`);
    console.log(`   迭代次数: ${iterations}`);

    // 使用之前创建的测试账户
    const testOwner = 'perf-balance-test';
    try {
      await this.accountService.createAccount(testOwner, BigInt(1000));
    } catch (error) {
      // 忽略错误
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      await this.accountService.getBalance(testOwner);

      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateMetrics(operation, times, iterations);
    this.results.push(result);
    this.printResult(result);

    return result;
  }

  /**
   * 查询历史记录性能测试
   */
  async benchmarkGetHistory(): Promise<BenchmarkResult> {
    const operation = 'account.getHistory';
    const iterations = 100;
    const times: number[] = [];

    console.log(`\n📊 测试: ${operation}`);
    console.log(`   迭代次数: ${iterations}`);

    const testOwner = 'perf-history-test';
    try {
      await this.accountService.createAccount(testOwner, BigInt(1000));
    } catch (error) {
      // 忽略错误
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      try {
        await this.accountService.getHistory(testOwner, 10);
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        const end = performance.now();
        times.push(end - start);
      }
    }

    const result = this.calculateMetrics(operation, times, iterations);
    this.results.push(result);
    this.printResult(result);

    return result;
  }

  /**
   * 计算性能指标
   */
  private calculateMetrics(
    operation: string,
    times: number[],
    iterations: number
  ): BenchmarkResult {
    const sortedTimes = [...times].sort((a, b) => a - b);
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / iterations;
    const minTime = sortedTimes[0];
    const maxTime = sortedTimes[sortedTimes.length - 1];
    const p50 = sortedTimes[Math.floor(iterations * 0.5)];
    const p95 = sortedTimes[Math.floor(iterations * 0.95)];
    const p99 = sortedTimes[Math.floor(iterations * 0.99)];
    const opsPerSecond = 1000 / avgTime;

    const sla = API_RESPONSE_TIME_SLA[operation];
    const violations: string[] = [];
    let passed = true;

    if (sla) {
      if (p50 > sla.p50) {
        violations.push(`P50 ${p50.toFixed(2)}ms > SLA ${sla.p50}ms`);
        passed = false;
      }
      if (p95 > sla.p95) {
        violations.push(`P95 ${p95.toFixed(2)}ms > SLA ${sla.p95}ms`);
        passed = false;
      }
      if (p99 > sla.p99) {
        violations.push(`P99 ${p99.toFixed(2)}ms > SLA ${sla.p99}ms`);
        passed = false;
      }
      if (maxTime > sla.max) {
        violations.push(`Max ${maxTime.toFixed(2)}ms > SLA ${sla.max}ms`);
        passed = false;
      }
    }

    return {
      operation,
      iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      p50,
      p95,
      p99,
      opsPerSecond,
      passed,
      violations,
    };
  }

  /**
   * 打印单个测试结果
   */
  private printResult(result: BenchmarkResult): void {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} ${result.operation}`);
    console.log(`   平均时间: ${result.avgTime.toFixed(2)}ms`);
    console.log(`   P50: ${result.p50.toFixed(2)}ms`);
    console.log(`   P95: ${result.p95.toFixed(2)}ms`);
    console.log(`   P99: ${result.p99.toFixed(2)}ms`);
    console.log(`   最小/最大: ${result.minTime.toFixed(2)}ms / ${result.maxTime.toFixed(2)}ms`);
    console.log(`   吞吐量: ${result.opsPerSecond.toFixed(2)} ops/sec`);

    if (result.violations.length > 0) {
      console.log(`   ⚠️  违反SLA:`);
      result.violations.forEach((v) => console.log(`      - ${v}`));
    }
  }

  /**
   * 打印测试总结
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📈 账户系统性能测试总结');
    console.log('='.repeat(80));

    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`\n通过率: ${passed}/${total} (${passRate}%)`);

    console.log('\n性能指标汇总:');
    console.log(
      '操作'.padEnd(25) +
        '平均时间'.padEnd(15) +
        'P95'.padEnd(15) +
        'P99'.padEnd(15) +
        '吞吐量'.padEnd(15) +
        '状态'
    );
    console.log('-'.repeat(100));

    this.results.forEach((result) => {
      const status = result.passed ? '✅' : '❌';
      console.log(
        result.operation.padEnd(25) +
          `${result.avgTime.toFixed(2)}ms`.padEnd(15) +
          `${result.p95.toFixed(2)}ms`.padEnd(15) +
          `${result.p99.toFixed(2)}ms`.padEnd(15) +
          `${result.opsPerSecond.toFixed(0)} ops/s`.padEnd(15) +
          status
      );
    });

    console.log('\n' + '='.repeat(80));
  }
}

// 运行基准测试
if (require.main === module) {
  const benchmark = new AccountBenchmark();
  benchmark
    .runAllBenchmarks()
    .then(() => {
      console.log('\n✅ 基准测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 基准测试失败:', error);
      process.exit(1);
    });
}
