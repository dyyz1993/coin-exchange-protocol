// 性能测试报告生成器
// 收集和分析 k6 测试结果，生成性能报告

import { jUnit, textSummary } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// 性能测试报告配置
export function generateReport(data, testName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = `./performance-reports/${timestamp}`;
  
  return {
    // JUnit XML 格式报告（用于 CI/CD）
    junit: jUnit(data, { 
      name: testName,
      file: `${reportDir}/junit.xml` 
    }),
    
    // HTML 可视化报告
    html: htmlReport(data, {
      title: `${testName} - Performance Report`,
      file: `${reportDir}/report.html`,
    }),
    
    // 文本摘要
    summary: textSummary(data, { 
      indent: ' ',
      enableColors: true 
    }),
  };
}

// 性能指标分析
export function analyzePerformanceMetrics(metrics) {
  const analysis = {
    overallStatus: 'PASS',
    criticalIssues: [],
    warnings: [],
    recommendations: [],
    score: 100,
  };
  
  // 分析 HTTP 请求失败率
  if (metrics.http_req_failed) {
    const failRate = metrics.http_req_failed.values.rate;
    if (failRate > 0.05) {
      analysis.criticalIssues.push(`❌ HTTP 失败率过高: ${(failRate * 100).toFixed(2)}%`);
      analysis.overallStatus = 'FAIL';
      analysis.score -= 30;
    } else if (failRate > 0.01) {
      analysis.warnings.push(`⚠️ HTTP 失败率略高: ${(failRate * 100).toFixed(2)}%`);
      analysis.score -= 10;
    }
  }
  
  // 分析响应时间
  if (metrics.http_req_duration) {
    const p95 = metrics.http_req_duration.values['p(95)'];
    const p99 = metrics.http_req_duration.values['p(99)'];
    
    if (p95 > 500) {
      analysis.criticalIssues.push(`❌ P95 响应时间过长: ${p95}ms (目标 < 300ms)`);
      analysis.overallStatus = 'FAIL';
      analysis.score -= 25;
    } else if (p95 > 300) {
      analysis.warnings.push(`⚠️ P95 响应时间偏高: ${p95}ms (目标 < 300ms)`);
      analysis.score -= 10;
    }
    
    if (p99 > 1000) {
      analysis.criticalIssues.push(`❌ P99 响应时间过长: ${p99}ms (目标 < 500ms)`);
      analysis.score -= 20;
    } else if (p99 > 500) {
      analysis.warnings.push(`⚠️ P99 响应时间偏高: ${p99}ms (目标 < 500ms)`);
      analysis.score -= 10;
    }
  }
  
  // 分析吞吐量
  if (metrics.iterations) {
    const rps = metrics.iterations.values.rate;
    if (rps < 50) {
      analysis.warnings.push(`⚠️ 吞吐量偏低: ${rps.toFixed(2)} RPS`);
      analysis.recommendations.push('💡 建议优化数据库查询或增加缓存');
      analysis.score -= 10;
    }
  }
  
  // 生成建议
  if (analysis.score < 80) {
    analysis.recommendations.push('💡 建议进行性能优化后重新测试');
    analysis.recommendations.push('💡 检查数据库索引和查询性能');
    analysis.recommendations.push('💡 考虑增加缓存层');
  }
  
  if (analysis.score < 60) {
    analysis.recommendations.push('💡 建议进行架构审查');
    analysis.recommendations.push('💡 考虑水平扩展');
  }
  
  return analysis;
}

// 性能基线比较
export function compareWithBaseline(currentMetrics, baselineMetrics) {
  const comparison = {
    improvements: [],
    regressions: [],
    unchanged: [],
  };
  
  const metricsToCompare = [
    'http_req_duration',
    'http_req_failed',
    'iterations',
  ];
  
  for (const metricName of metricsToCompare) {
    if (currentMetrics[metricName] && baselineMetrics[metricName]) {
      const current = currentMetrics[metricName].values;
      const baseline = baselineMetrics[metricName].values;
      
      // 比较响应时间
      if (metricName === 'http_req_duration') {
        const currentP95 = current['p(95)'];
        const baselineP95 = baseline['p(95)'];
        const change = ((currentP95 - baselineP95) / baselineP95) * 100;
        
        if (change > 10) {
          comparison.regressions.push(
            `📉 ${metricName} P95 增加 ${change.toFixed(2)}% (${baselineP95}ms → ${currentP95}ms)`
          );
        } else if (change < -10) {
          comparison.improvements.push(
            `📈 ${metricName} P95 减少 ${Math.abs(change).toFixed(2)}% (${baselineP95}ms → ${currentP95}ms)`
          );
        } else {
          comparison.unchanged.push(
            `➡️ ${metricName} P95 基本不变 (${baselineP95}ms → ${currentP95}ms)`
          );
        }
      }
      
      // 比较失败率
      if (metricName === 'http_req_failed') {
        const currentRate = current.rate;
        const baselineRate = baseline.rate;
        const change = ((currentRate - baselineRate) / baselineRate) * 100;
        
        if (change > 50) {
          comparison.regressions.push(
            `📉 失败率增加 ${change.toFixed(2)}% (${(baselineRate * 100).toFixed(2)}% → ${(currentRate * 100).toFixed(2)}%)`
          );
        } else if (change < -50) {
          comparison.improvements.push(
            `📈 失败率减少 ${Math.abs(change).toFixed(2)}% (${(baselineRate * 100).toFixed(2)}% → ${(currentRate * 100).toFixed(2)}%)`
          );
        }
      }
      
      // 比较吞吐量
      if (metricName === 'iterations') {
        const currentRPS = current.rate;
        const baselineRPS = baseline.rate;
        const change = ((currentRPS - baselineRPS) / baselineRPS) * 100;
        
        if (change > 20) {
          comparison.improvements.push(
            `📈 吞吐量增加 ${change.toFixed(2)}% (${baselineRPS.toFixed(2)} RPS → ${currentRPS.toFixed(2)} RPS)`
          );
        } else if (change < -20) {
          comparison.regressions.push(
            `📉 吞吐量减少 ${Math.abs(change).toFixed(2)}% (${baselineRPS.toFixed(2)} RPS → ${currentRPS.toFixed(2)} RPS)`
          );
        }
      }
    }
  }
  
  return comparison;
}

// SLA 违规检查
export function checkSLACompliance(metrics, slaThresholds) {
  const violations = [];
  
  // 检查响应时间 SLA
  if (metrics.http_req_duration && slaThresholds.responseTime) {
    const p95 = metrics.http_req_duration.values['p(95)'];
    const p99 = metrics.http_req_duration.values['p(99)'];
    
    if (p95 > slaThresholds.responseTime.p95) {
      violations.push({
        type: 'response_time_p95',
        severity: 'high',
        actual: p95,
        threshold: slaThresholds.responseTime.p95,
        message: `P95 响应时间 ${p95}ms 超过 SLA 阈值 ${slaThresholds.responseTime.p95}ms`,
      });
    }
    
    if (p99 > slaThresholds.responseTime.p99) {
      violations.push({
        type: 'response_time_p99',
        severity: 'critical',
        actual: p99,
        threshold: slaThresholds.responseTime.p99,
        message: `P99 响应时间 ${p99}ms 超过 SLA 阈值 ${slaThresholds.responseTime.p99}ms`,
      });
    }
  }
  
  // 检查错误率 SLA
  if (metrics.http_req_failed && slaThresholds.errorRate) {
    const errorRate = metrics.http_req_failed.values.rate;
    
    if (errorRate > slaThresholds.errorRate) {
      violations.push({
        type: 'error_rate',
        severity: 'critical',
        actual: errorRate,
        threshold: slaThresholds.errorRate,
        message: `错误率 ${(errorRate * 100).toFixed(2)}% 超过 SLA 阈值 ${(slaThresholds.errorRate * 100).toFixed(2)}%`,
      });
    }
  }
  
  // 检查吞吐量 SLA
  if (metrics.iterations && slaThresholds.throughput) {
    const rps = metrics.iterations.values.rate;
    
    if (rps < slaThresholds.throughput) {
      violations.push({
        type: 'throughput',
        severity: 'high',
        actual: rps,
        threshold: slaThresholds.throughput,
        message: `吞吐量 ${rps.toFixed(2)} RPS 低于 SLA 阈值 ${slaThresholds.throughput} RPS`,
      });
    }
  }
  
  return {
    compliant: violations.length === 0,
    violations: violations,
    summary: violations.length === 0 
      ? '✅ 所有 SLA 指标均符合要求'
      : `❌ 发现 ${violations.length} 个 SLA 违规`,
  };
}

export default function () {
  // 此文件仅提供工具函数，不执行测试
  console.log('📊 性能测试报告生成器已加载');
}
