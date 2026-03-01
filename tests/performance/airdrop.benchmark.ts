/**
 * 空投系统性能基准测试
 * 测试空投领取、查询、状态检查等操作的性能
 */

import { performance } from 'perf_hooks';
import { AirdropService } from '../../src/services/airdrop.service';
import { AccountService } from '../../src/services/account.service';
import { API_RESPONSE_TIME_SLA } from './sla.config';
import { BenchmarkResult } from './account.benchmark';

export class AirdropBenchmark {
  private airdropService: AirdropService;
  private accountService: AccountService;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.airdropService = new AirdropService();
    this.accountService = new AccountService();
  }

  /**
   * 运行所有空投系统性能测试
   */
  async runAllBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('🚀 开始空投系统性能基准测试...\n');

    // 1. 查询空投资格性能测试
    await this.benchmarkCheckEligibility();

    // 2. 领取空投性能测试
    await this.benchmarkClaimAirdrop();

    // 3. 查询空投状态性能测试
    await this.benchmarkGetAirdropStatus();

    // 4. 批量空投查询性能测试
    await this.benchmarkBatchQuery();

    this.printSummary();

    return this.results;
  }

  /**
   * 查询空投资格性能测试
   */
  async benchmarkCheckEligibility(): Promise<BenchmarkResult> {
    const operation = 'airdrop.check';
    const iterations = 300;
    const times: number[] = [];

    console.log(`\n📊 测试: ${operation}`);
    console.log(`   迭代次数: ${iterations}`);

    // 创建测试账户
    const testOwners: string[] = [];
    for (let i = 0; i < 50; i++) {
      const owner = `perf-airdrop-check-${i}`;
      testOwners.push(owner);
      try {
        await this.accountService.createAccount(owner, BigInt(0));
      } catch (error) {
        // 忽略错误
      }
    }

    for (let i = 0; i < iterations; i++) {
      const owner = testOwners[i % testOwners.length];
      const start = performance.now();

      try {
        await this.airdropService.checkEligibility(owner);
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
   * 领取空投性能测试
   */
  async benchmarkClaimAirdrop(): Promise<BenchmarkResult> {
    const operation = 'airdrop.claim';
    const iterations = 50;
    const times: number[] = [];

    console.log(`\n📊 测试: ${operation}`);
    console.log(`   迭代次数: ${iterations}`);

    for (let i = 0; i < iterations; i++) {
      const owner = `perf-airdrop-claim-${i}`;

      // 创建测试账户
      try {
        await this.accountService.createAccount(owner, BigInt(0));
      } catch (error) {
        // 忽略错误
      }

      const start = performance.now();

      try {
        await this.airdropService.claimAirdrop(owner);
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        // 可能已经领取过
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
   * 查询空投状态性能测试
   */
  async benchmarkGetAirdropStatus(): Promise<BenchmarkResult> {
    const operation = 'airdrop.getStatus';
    const iterations = 300;
    const times: number[] = [];

    console.log(`\n📊 测试: ${operation}`);
    console.log(`   迭代次数: ${iterations}`);

    // 使用之前创建的测试账户
    const testOwners: string[] = [];
    for (let i = 0; i < 50; i++) {
      testOwners.push(`perf-airdrop-status-${i}`);
    }

    for (let i = 0; i < iterations; i++) {
      const owner = testOwners[i % testOwners.length];
      const start = performance.now();

      try {
        await this.airdropService.getAirdropStatus(owner);
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
   * 批量空投查询性能测试
   */
  async benchmarkBatchQuery(): Promise<BenchmarkResult> {
    const operation = 'airdrop.batchQuery';
    const iterations = 30;
    const times: number[] = [];

    console.log(`\n📊 测试: ${operation}`);
    console.log(`   迭代次数: ${iterations}`);

    const batchSize = 20;

    for (let i = 0; i < iterations; i++) {
      const owners: string[] = [];
      for (let j = 0; j < batchSize; j++) {
        owners.push(`perf-batch-${i}-${j}`);
      }

      const start = performance.now();

      try {
        // 模拟批量查询
        await Promise.all(
          owners.map((owner) => this.airdropService.checkEligibility(owner).catch(() => {}))
        );
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
    console.log('📈 空投系统性能测试总结');
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
  const benchmark = new AirdropBenchmark();
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
