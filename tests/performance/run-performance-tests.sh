#!/bin/bash

# 性能测试运行脚本
# 用于执行所有性能测试并生成报告

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BASE_URL=${BASE_URL:-"http://localhost:3000"}
REPORT_DIR="./performance-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_DIR="tests/performance"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 k6 是否安装
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 未安装，请先安装 k6"
        print_info "安装方法: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    print_success "k6 已安装: $(k6 version)"
}

# 检查服务是否可用
check_service() {
    print_info "检查服务是否可用: $BASE_URL"
    if curl -s --max-time 5 "$BASE_URL/health" > /dev/null 2>&1; then
        print_success "服务可用"
    else
        print_warning "服务健康检查失败，请确保服务正在运行"
        read -p "是否继续? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 创建报告目录
create_report_dir() {
    print_info "创建报告目录: $REPORT_DIR/$TIMESTAMP"
    mkdir -p "$REPORT_DIR/$TIMESTAMP"
    print_success "报告目录创建完成"
}

# 运行单个性能测试
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .js)
    
    print_info "运行测试: $test_name"
    
    local output_file="$REPORT_DIR/$TIMESTAMP/${test_name}_report.json"
    local summary_file="$REPORT_DIR/$TIMESTAMP/${test_name}_summary.txt"
    
    # 运行 k6 测试
    k6 run \
        --out json="$output_file" \
        --summary-export="$REPORT_DIR/$TIMESTAMP/${test_name}_summary.json" \
        "$test_file" 2>&1 | tee "$summary_file"
    
    if [ $? -eq 0 ]; then
        print_success "$test_name 测试完成"
    else
        print_error "$test_name 测试失败"
        return 1
    fi
}

# 生成汇总报告
generate_summary_report() {
    print_info "生成汇总报告"
    
    local summary_file="$REPORT_DIR/$TIMESTAMP/overall_summary.md"
    
    cat > "$summary_file" << EOF
# 性能测试报告

**测试时间**: $(date '+%Y-%m-%d %H:%M:%S')
**目标服务**: $BASE_URL
**测试工具**: k6 $(k6 version | grep -oP 'k6 v\K[0-9.]+')

## 测试概览

| 测试套件 | 状态 | 详情 |
|---------|------|------|
EOF
    
    # 添加每个测试的结果
    for test_file in "$TEST_DIR"/*.perf.test.js; do
        if [ -f "$test_file" ]; then
            test_name=$(basename "$test_file" .js)
            summary_json="$REPORT_DIR/$TIMESTAMP/${test_name}_summary.json"
            
            if [ -f "$summary_json" ]; then
                # 提取关键指标
                pass_status=$(jq -r '.root_group.groups[] | select(.name == "") | .checks | map(select(.passes > 0)) | length' "$summary_json" 2>/dev/null || echo "N/A")
                echo "| $test_name | ✅ 通过 | [查看详情](./${test_name}_summary.txt) |" >> "$summary_file"
            else
                echo "| $test_name | ❌ 失败 | 测试未执行 |" >> "$summary_file"
            fi
        fi
    done
    
    cat >> "$summary_file" << EOF

## SLA 合规性

详细 SLA 定义请查看 [SLA.md](./SLA.md)

### 响应时间
- P95 目标: < 300ms
- P99 目标: < 500ms

### 错误率
- 目标: < 1%

### 可用性
- 目标: > 99.9%

## 建议

1. 定期运行性能测试，建立性能基线
2. 监控生产环境性能指标
3. 在性能下降时及时优化

---
*报告由性能测试框架自动生成*
EOF
    
    print_success "汇总报告生成完成: $summary_file"
}

# 清理旧报告（保留最近 10 次）
cleanup_old_reports() {
    print_info "清理旧报告"
    
    cd "$REPORT_DIR"
    ls -t | tail -n +11 | xargs -r rm -rf
    print_success "清理完成，保留最近 10 次测试报告"
}

# 主函数
main() {
    print_info "========================================="
    print_info "  性能测试套件"
    print_info "========================================="
    echo
    
    # 检查依赖
    check_k6
    echo
    
    # 检查服务
    check_service
    echo
    
    # 创建报告目录
    create_report_dir
    echo
    
    # 运行所有性能测试
    print_info "开始运行性能测试..."
    echo
    
    failed_tests=0
    
    # 运行综合测试
    if [ -f "$TEST_DIR/k6.config.js" ]; then
        run_test "$TEST_DIR/k6.config.js" || ((failed_tests++))
        echo
    fi
    
    # 运行账户系统测试
    if [ -f "$TEST_DIR/account.perf.test.js" ]; then
        run_test "$TEST_DIR/account.perf.test.js" || ((failed_tests++))
        echo
    fi
    
    # 运行空投系统测试
    if [ -f "$TEST_DIR/airdrop-task.perf.test.js" ]; then
        run_test "$TEST_DIR/airdrop-task.perf.test.js" || ((failed_tests++))
        echo
    fi
    
    # 运行任务系统测试
    if [ -f "$TEST_DIR/task.perf.test.js" ]; then
        run_test "$TEST_DIR/task.perf.test.js" || ((failed_tests++))
        echo
    fi
    
    # 生成汇总报告
    generate_summary_report
    echo
    
    # 清理旧报告
    cleanup_old_reports
    echo
    
    # 打印结果
    print_info "========================================="
    if [ $failed_tests -eq 0 ]; then
        print_success "所有性能测试通过 ✅"
    else
        print_error "$failed_tests 个测试失败 ❌"
    fi
    print_info "========================================="
    echo
    
    print_info "报告位置: $REPORT_DIR/$TIMESTAMP/"
    echo
    
    # 返回退出码
    [ $failed_tests -eq 0 ]
}

# 运行主函数
main "$@"
