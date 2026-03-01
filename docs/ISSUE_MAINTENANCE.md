# Issue 维护流程指南

> **目标**：建立规范的 Issue 管理流程，防止重复 Issue 的产生，提高团队协作效率

---

## 📋 目录

- [1. Issue 创建前检查](#1-issue-创建前检查)
- [2. Issue 标签体系](#2-issue-标签体系)
- [3. Issue 生命周期](#3-issue-生命周期)
- [4. 定期维护流程](#4-定期维护流程)
- [5. 重复 Issue 处理流程](#5-重复-issue-处理流程)
- [6. Issue 模板使用](#6-issue-模板使用)

---

## 1. Issue 创建前检查

### ✅ 创建前必做检查清单

在创建新 Issue 之前，**必须**完成以下检查：

- [ ] **搜索现有 Issue**
  - 使用关键词搜索相关 Issue
  - 检查已关闭的 Issue（可能已解决）
  - 查看 [FAQ](./FAQ.md) 和 [文档](./README.md)

- [ ] **确认 Issue 类型**
  - 🐛 Bug 报告
  - 💡 功能请求
  - 📚 文档改进
  - 🔧 重构建议
  - ❓ 问题咨询

- [ ] **收集必要信息**
  - 版本号、环境信息
  - 复现步骤
  - 预期行为 vs 实际行为
  - 错误日志/截图

### 🔍 搜索技巧

```bash
# 在 GitHub Issue 中搜索
# 示例：搜索与"登录"相关的 Issue
is:issue 登录
is:issue is:open 登录  # 只搜索未关闭的
is:issue is:closed 登录  # 只搜索已关闭的

# 搜索特定标签
label:bug 登录
label:"good first issue"  # 适合新手的 Issue
```

---

## 2. Issue 标签体系

### 🏷️ 标签分类

#### 优先级标签
| 标签 | 含义 | 响应时间 |
|------|------|----------|
| `P0: critical` | 紧急，系统崩溃/安全漏洞 | < 1 小时 |
| `P1: high` | 高优先级，影响核心功能 | < 24 小时 |
| `P2: medium` | 中优先级，功能改进 | < 3 天 |
| `P3: low` | 低优先级，优化建议 | < 1 周 |

#### 类型标签
| 标签 | 含义 |
|------|------|
| `bug` | 🐛 错误报告 |
| `enhancement` | 💡 功能增强 |
| `documentation` | 📚 文档相关 |
| `refactor` | 🔧 代码重构 |
| `question` | ❓ 问题咨询 |
| `duplicate` | ⚠️ 重复 Issue |
| `wontfix` | 🚫 不予修复 |
| `invalid` | ❌ 无效 Issue |

#### 状态标签
| 标签 | 含义 |
|------|------|
| `status: triage` | 待分类 |
| `status: in-progress` | 进行中 |
| `status: blocked` | 阻塞中 |
| `status: review` | 待审查 |
| `status: confirmed` | 已确认 |

#### 难度标签
| 标签 | 含义 | 预计工时 |
|------|------|----------|
| `good first issue` | 适合新手 | < 2 小时 |
| `difficulty: easy` | 简单 | 2-4 小时 |
| `difficulty: medium` | 中等 | 4-8 小时 |
| `difficulty: hard` | 困难 | > 8 小时 |

---

## 3. Issue 生命周期

### 🔄 生命周期流程图

```
[新建 Issue]
     ↓
[status: triage] ← 待分类
     ↓
   核心成员审查
     ↓
    是否有效？
     ├─ No → [invalid] → 关闭
     ├─ Duplicate → [duplicate] → 关闭并引用原 Issue
     └─ Yes ↓
         
    分类打标签
     ↓
  [优先级 + 类型 + 难度]
     ↓
    分配负责人
     ↓
  [status: in-progress]
     ↓
    开发修复
     ├─ 遇到阻塞 → [status: blocked] + 说明原因
     └─ 完成开发 ↓
         
  [status: review]
     ↓
    代码审查
     ├─ 需要修改 → 返回开发
     └─ 审查通过 ↓
         
    合并代码
     ↓
  [关闭 Issue]
```

### 📝 状态转换规则

1. **新建 Issue**
   - 自动添加 `status: triage` 标签
   - 核心成员在 24 小时内完成分类

2. **分类审查**
   - 确认是否为有效 Issue
   - 检查是否重复
   - 添加合适的标签
   - 评估优先级和难度

3. **分配与执行**
   - 分配给合适的开发者
   - 更新状态为 `status: in-progress`
   - 定期更新进度

4. **完成与关闭**
   - PR 合并后自动关闭（通过 commit message）
   - 或手动关闭并说明原因

---

## 4. 定期维护流程

### 🗓️ 维护计划

#### 每日维护（自动化）
- [ ] CI/CD 自动标记过期 Issue
- [ ] 自动关闭超过 30 天无响应的 Issue
- [ ] 自动提醒未分类的 Issue

#### 每周维护（周五）
- [ ] 审查 `status: triage` 的 Issue
- [ ] 清理重复 Issue
- [ ] 更新阻塞 Issue 的状态
- [ ] 回复用户问题

#### 每月维护（第一周周一）
- [ ] 统计 Issue 处理数据
- [ ] 分析高频问题，优化文档
- [ ] 调整标签体系
- [ ] 关闭已解决但未关闭的 Issue

### 📊 维护脚本示例

```bash
# 查找超过 30 天未更新的开放 Issue
gh issue list \
  --state open \
  --json number,title,updatedAt \
  --jq '.[] | select(.updatedAt < (now - 2592000 | todate))'

# 查找重复 Issue
gh issue list \
  --label duplicate \
  --state open

# 批量关闭重复 Issue
gh issue close <issue-number> --comment "关闭重复 Issue，参见 #<original-issue>"
```

---

## 5. 重复 Issue 处理流程

### 🚨 处理步骤

1. **确认重复**
   ```markdown
   搜索关键词：[关键词列表]
   原始 Issue：#XXX
   相似度：高/中/低
   ```

2. **标记重复**
   - 添加 `duplicate` 标签
   - 评论说明原因并引用原 Issue
   - 关闭重复 Issue

3. **模板回复**
   ```markdown
   ### ⚠️ 重复 Issue
   
   感谢您的报告！经过检查，这个问题已经在以下 Issue 中被追踪：
   
   - **原始 Issue**: #XXX
   
   建议您：
   1. 在原 Issue 中添加 👍 反应，帮助我们评估优先级
   2. 订阅原 Issue 以获取更新通知
   3. 如有新的信息，请在原 Issue 中评论
   
   此 Issue 将被关闭。感谢您的理解！
   ```

4. **更新原 Issue**
   - 如果新 Issue 提供了额外信息，补充到原 Issue
   - 更新优先级（如果必要）

### 📋 重复 Issue 统计

定期分析重复 Issue 的原因：

| 原因 | 解决方案 |
|------|----------|
| 搜索功能不好用 | 改进 Issue 模板，添加关键词提示 |
| 文档不清晰 | 更新 README 和 FAQ |
| Issue 标题不明确 | 规范 Issue 标题格式 |
| 常见问题 | 添加到 FAQ 文档 |

---

## 6. Issue 模板使用

### 📝 模板位置

项目提供以下 Issue 模板（`.github/ISSUE_TEMPLATE/`）：

```
.github/
└── ISSUE_TEMPLATE/
    ├── bug_report.yml        # Bug 报告
    ├── feature_request.yml   # 功能请求
    ├── documentation.yml     # 文档改进
    └── config.yml            # 模板配置
```

### 🐛 Bug 报告模板

```yaml
name: 🐛 Bug 报告
description: 报告一个 Bug
labels: ["bug", "status: triage"]
body:
  - type: checkboxes
    id: search
    attributes:
      label: 🔍 创建前检查
      options:
        - label: 我已经搜索了现有 Issue
          required: true
        - label: 我已经阅读了 README 和文档
          required: true

  - type: textarea
    id: description
    attributes:
      label: 📝 Bug 描述
      description: 清晰简洁地描述这个 Bug
      placeholder: "当我尝试...时，发生了..."
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: 🔄 复现步骤
      description: 详细描述如何复现这个 Bug
      placeholder: |
        1. 进入 '...'
        2. 点击 '...'
        3. 滚动到 '...'
        4. 看到错误
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: ✅ 预期行为
      description: 你期望发生什么？
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: ❌ 实际行为
      description: 实际发生了什么？
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: 🖥️ 环境信息
      description: 请提供环境信息
      placeholder: |
        - OS: [e.g. macOS 12.0]
        - Node.js: [e.g. 18.0.0]
        - npm: [e.g. 9.0.0]
        - 项目版本: [e.g. 1.0.0]
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: 📋 日志/截图
      description: 如果适用，添加日志或截图帮助解释问题
```

### 💡 功能请求模板

```yaml
name: 💡 功能请求
description: 提出一个新功能建议
labels: ["enhancement", "status: triage"]
body:
  - type: checkboxes
    id: search
    attributes:
      label: 🔍 创建前检查
      options:
        - label: 我已经搜索了现有 Issue
          required: true
        - label: 我确认这是一个新功能建议，而不是 Bug 报告
          required: true

  - type: textarea
    id: problem
    attributes:
      label: 🎯 问题背景
      description: 这个功能请求是为了解决什么问题？
      placeholder: "我总是感到困扰，当..."
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: 💡 希望的解决方案
      description: 你希望如何解决这个问题？
      placeholder: "我希望能够..."
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: 🔄 替代方案
      description: 你考虑过哪些替代方案？

  - type: dropdown
    id: priority
    attributes:
      label: 📊 优先级建议
      description: 你认为这个功能的优先级是？
      options:
        - "P0: 关键功能，没有它无法使用"
        - "P1: 重要功能，显著改善体验"
        - "P2: 有则更好"
        - "P3: 锦上添花"
    validations:
      required: true

  - type: textarea
    id: additional
    attributes:
      label: 📎 附加信息
      description: 其他相关信息、截图或草图
```

---

## 📚 参考资源

- [GitHub Issue 指南](https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-an-issue)
- [开源项目 Issue 最佳实践](https://opensource.guide/finding-users/)
- [如何编写好的 Bug 报告](https://www.chiark.greenend.org.uk/~sgtatham/bugs.html)

---

## 🤝 贡献

如果您发现本流程可以改进，欢迎：
1. 创建 Issue 提出建议
2. 提交 PR 修改文档
3. 在团队会议中讨论

---

**最后更新**：2026-03-01
**维护者**：开发团队
**相关文档**：[CONTRIBUTING.md](../CONTRIBUTING.md) | [README.md](../README.md)
