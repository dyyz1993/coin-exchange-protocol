# Issue 管理维护流程指南

> 📋 本文档定义了金币交易协议项目的 Issue 管理规范，旨在提高问题跟踪效率，避免重复 Issue 的产生。

**维护责任人**: 开发总监  
**更新频率**: 每月审查一次  
**最后更新**: 2026-03-01

---

## 📌 目录

- [背景与问题](#背景与问题)
- [Issue 创建规范](#issue-创建规范)
- [标签使用指南](#标签使用指南)
- [定期维护流程](#定期维护流程)
- [Issue 关闭标准](#issue-关闭标准)
- [重复 Issue 处理流程](#重复-issue-处理流程)
- [操作检查清单](#操作检查清单)

---

## 背景与问题

### 历史问题分析

项目历史上曾出现多起重复 Issue，例如：

| 重复 Issue 组 | 问题类型 | 根本原因 |
|--------------|---------|---------|
| #201 / #195 | 功能重复 | 未搜索已有 Issue |
| #200 / #194 | Bug 重复 | 描述不清晰导致误判 |
| #203 / #197 | 改进建议 | 未定期回顾历史 Issue |

### 影响

- ❌ 浪费团队时间处理重复问题
- ❌ 优先级判断困难
- ❌ 进度跟踪不准确
- ❌ 团队士气下降

---

## Issue 创建规范

### ✅ 创建前必做检查清单

在创建新 Issue 前，**必须**完成以下检查：

#### 1. 搜索已有 Issue（最重要！）

```bash
# 搜索关键词（英文和中文）
关键词1 OR 关键词2 OR "关键词3"

# 示例：搜索与登录相关的问题
login OR "登录" OR authentication OR "认证"
```

**检查要点**：
- [ ] 使用至少 3 个相关关键词搜索
- [ ] 检查 Open 和 Closed 状态的 Issue
- [ ] 查看最近 6 个月的历史记录
- [ ] 如果找到相似 Issue，在该 Issue 下评论补充信息，**不要创建新 Issue**

#### 2. 确认问题类型

| 类型 | 标签 | 说明 | 创建前确认 |
|-----|------|------|-----------|
| 🐛 Bug | `bug` | 代码错误或异常行为 | [ ] 确认是 Bug 而非功能需求 |
| ✨ Feature | `enhancement` | 新功能请求 | [ ] 确认不在 Roadmap 中 |
| 📚 Documentation | `documentation` | 文档改进 | [ ] 确认文档确实缺失或错误 |
| 🔧 Maintenance | `maintenance` | 代码重构、优化 | [ ] 确认有明确的改进目标 |
| ❓ Question | `question` | 使用问题咨询 | [ ] 先查阅文档和 FAQ |

#### 3. 收集必要信息

**Bug 报告必须包含**：
- [ ] 复现步骤（Step by step）
- [ ] 期望行为 vs 实际行为
- [ ] 环境信息（Node 版本、操作系统、浏览器）
- [ ] 错误日志或截图
- [ ] 最小复现代码（如适用）

**功能请求必须包含**：
- [ ] 功能描述（What）
- [ ] 使用场景（Why）
- [ ] 实现建议（How，可选）
- [ ] 优先级评估（P0/P1/P2/P3）

---

### 📝 Issue 标题规范

**格式**: `[类型] 简洁描述问题（不是解决方案）`

#### ✅ 好的标题示例

```
[BUG] 用户登录时出现 500 错误
[FEATURE] 添加交易历史导出为 CSV 功能
[DOCS] README 中缺少环境变量配置说明
[MAINTENANCE] 重构订单模块提高代码可读性
```

#### ❌ 不好的标题示例

```
登录失败                    # 不明确是 Bug 还是 Feature
添加 CSV 导出              # 缺少类型标识
文档问题                   # 太模糊
重构代码                   # 缺少具体目标
```

---

### 📋 Issue 模板

项目提供以下 Issue 模板（位于 `.github/ISSUE_TEMPLATE/`）：

1. **Bug Report** - `bug_report.md`
2. **Feature Request** - `feature_request.md`
3. **Documentation** - `documentation.md`

**强制要求**: 所有 Issue 必须使用模板创建，未使用模板的 Issue 将被标记为 `needs-triage` 并可能被关闭。

---

## 标签使用指南

### 标签分类体系

#### 1. 类型标签（Type）- 必须标记

| 标签 | 颜色 | 说明 | 使用场景 |
|-----|------|------|---------|
| `bug` | 🔴 红色 | 代码缺陷 | 功能不工作、崩溃、性能问题 |
| `enhancement` | 🟢 绿色 | 功能改进 | 新功能、功能优化 |
| `documentation` | 🟣 紫色 | 文档相关 | 文档缺失、错误、改进 |
| `maintenance` | 🔵 蓝色 | 维护任务 | 代码重构、依赖更新 |
| `question` | 🟡 黄色 | 问题咨询 | 使用疑问（应尽快关闭） |

#### 2. 优先级标签（Priority）- 必须标记

| 标签 | 颜色 | 响应时间 | 处理时限 | 示例 |
|-----|------|---------|---------|------|
| `P0-critical` | 🔴 红色 | 1 小时 | 24 小时 | 生产环境崩溃、安全漏洞 |
| `P1-high` | 🟠 橙色 | 4 小时 | 1 周 | 核心功能异常、严重性能问题 |
| `P2-medium` | 🟡 黄色 | 1 天 | 2 周 | 次要功能问题、一般优化 |
| `P3-low` | ⚪ 白色 | 1 周 | 1 月 | 优化建议、非紧急修复 |

#### 3. 状态标签（Status）- 自动或手动标记

| 标签 | 说明 | 谁来标记 |
|-----|------|---------|
| `needs-triage` | 等待分类 | 自动（新 Issue） |
| `confirmed` | 已确认问题 | 开发总监 |
| `in-progress` | 正在处理 | 开发者领取时 |
| `blocked` | 阻塞中 | 开发者遇到阻塞时 |
| `needs-info` | 需要更多信息 | 开发总监/开发者 |
| `wontfix` | 不予修复 | 开发总监 |
| `duplicate` | 重复 Issue | 开发总监 |

#### 4. 模块标签（Module）- 可选

| 标签 | 说明 |
|-----|------|
| `frontend` | 前端相关 |
| `backend` | 后端相关 |
| `api` | API 相关 |
| `database` | 数据库相关 |
| `security` | 安全相关 |
| `performance` | 性能相关 |

---

### 标签组合示例

```
示例 1: 严重 Bug
  bug, P0-critical, backend, in-progress

示例 2: 功能请求
  enhancement, P2-medium, frontend, needs-triage

示例 3: 文档改进
  documentation, P3-low, needs-triage

示例 4: 重复 Issue
  duplicate, P3-low, wontfix
```

---

## 定期维护流程

### 每周维护（开发总监执行）

**时间**: 每周一上午 10:00  
**耗时**: 约 30 分钟

#### 检查清单

- [ ] **新 Issue 分类**
  - 检查所有 `needs-triage` 标签的 Issue
  - 分配类型、优先级标签
  - 分配给合适的团队成员
  - 请求补充信息（如需要）

- [ ] **处理长期未响应 Issue**
  - 查询超过 14 天无更新的 Issue
  - 发起跟进："是否有进展？是否需要帮助？"
  - 关闭超过 30 天无响应的 `question` 类型 Issue

- [ ] **重复 Issue 检查**
  - 使用 GitHub 搜索检查相似 Issue
  - 合并重复 Issue（保留最早的）
  - 标记为 `duplicate` 并关闭

**GitHub 查询语句**:
```bash
# 查找未分类的 Issue
is:open is:issue label:needs-triage

# 查找长期未更新的 Issue
is:open is:issue updated:<2026-02-15

# 查找重复 Issue（手动检查）
is:open is:issue sort:created-asc
```

---

### 每月维护（开发总监执行）

**时间**: 每月第一个周一上午 10:00  
**耗时**: 约 1 小时

#### 检查清单

- [ ] **清理过期 Issue**
  - 关闭已解决但未关闭的 Issue
  - 关闭超过 3 个月无进展的 `P3-low` Issue（说明优先级不够）
  - 归档已发布的 `enhancement` Issue

- [ ] **标签审查**
  - 检查标签使用是否规范
  - 更新标签定义（如有需要）
  - 删除不再使用的标签

- [ ] **统计与报告**
  - 生成月度 Issue 报告：
    - 新建 Issue 数量
    - 关闭 Issue 数量
    - 平均处理时间
    - 重复 Issue 比例
  - 识别高频问题，考虑改进文档

- [ ] **Roadmap 更新**
  - 将高优先级 Feature Request 加入 Roadmap
  - 更新项目计划

**月度报告模板**:
```markdown
# Issue 月度报告 - YYYY年MM月

## 📊 数据概览

- 新建 Issue: X 个
- 关闭 Issue: X 个
- 仍在处理: X 个
- 平均处理时间: X 天
- 重复 Issue: X 个（占比 X%）

## 🔥 热点问题

1. [Issue #xxx] 标题 - 状态
2. [Issue #xxx] 标题 - 状态
3. [Issue #xxx] 标题 - 状态

## 📝 改进建议

- 建议 1
- 建议 2

## 📌 下月重点

- 重点 1
- 重点 2
```

---

## Issue 关闭标准

### ✅ 可以关闭 Issue 的情况

#### 1. Bug 已修复

**标准流程**:
1. 开发者修复 Bug 并提交 PR
2. PR 关联 Issue（在 Commit Message 或 PR 描述中）
3. PR 合并后，自动关闭 Issue（使用 `Closes #xxx`）
4. **不要手动关闭**，让自动化流程处理

**Commit Message 示例**:
```bash
git commit -m "fix: 修复用户登录时的 500 错误 (#123)

Closes #123

- 修复了空指针异常
- 添加了输入验证
- 增加了单元测试"
```

#### 2. Feature 已实现

**标准流程**:
1. Feature 开发完成并测试通过
2. 合并到主分支
3. 使用 `Closes #xxx` 自动关闭
4. 更新 CHANGELOG

#### 3. 重复 Issue

**处理流程**:
1. 在新 Issue 中评论：`Duplicate of #xxx`
2. 添加 `duplicate` 标签
3. 关闭新 Issue（保留最早的 Issue）
4. **不要删除**，保留历史记录

**示例评论**:
```markdown
感谢你的反馈！这个问题已经在 #xxx 中报告过了。

请在该 Issue 下继续讨论，我会在那里更新进展。

关闭此 Issue 以避免重复跟踪。
```

#### 4. 问题已解决（Question 类型）

**关闭标准**:
- [ ] 问题已得到解答
- [ ] 提问者确认问题解决
- [ ] 超过 7 天无后续问题

**关闭评论**:
```markdown
很高兴问题已解决！如果还有其他问题，欢迎随时提问。
```

#### 5. 不予实现（Won't Fix）

**适用场景**:
- 功能与项目定位不符
- 技术上不可行
- 维护成本过高
- 有更好的替代方案

**关闭流程**:
1. 添加 `wontfix` 标签
2. **必须**详细说明原因
3. 提供替代方案（如有）

**示例评论**:
```markdown
感谢你的建议！

经过评估，我们决定不实现这个功能，原因是：

1. **技术原因**: 这个功能会显著增加代码复杂度
2. **使用频率**: 根据用户调研，使用场景较少
3. **替代方案**: 你可以通过 [方案 X] 实现类似功能

如果你有其他想法，欢迎继续讨论！
```

#### 6. 过期 Issue

**过期标准**:
- `P3-low` Issue 超过 3 个月无进展
- `question` Issue 超过 30 天无响应
- 已在后续版本中解决的问题

**关闭流程**:
1. 发起最后确认："这个问题是否仍然存在？"
2. 7 天后仍无响应，关闭 Issue
3. 添加说明："因长期无响应而关闭，如问题仍存在请重新打开"

---

### ❌ 不应该关闭 Issue 的情况

- 🚫 问题未完全解决
- 🚫 测试未通过
- 🚫 文档未更新
- 🚫 用户反馈未确认
- 🚫 相关 Issue 仍在处理中

---

## 重复 Issue 处理流程

### 检测机制

#### 自动检测

GitHub 会自动提示相似 Issue，在创建 Issue 时注意查看提示。

#### 手动检测

**每周检查**（开发总监）:
1. 按创建时间排序查看所有 Open Issue
2. 重点关注以下类型：
   - 相似标题
   - 相同关键词
   - 同一提交者

**检测查询语句**:
```bash
# 查找可能的重复 Issue（示例）
is:open is:issue "登录" in:title
is:open is:issue "性能" in:title
is:open is:issue "优化" in:title
```

---

### 处理流程

```
发现重复 Issue
    ↓
确认重复关系（检查内容、时间、提交者）
    ↓
选择保留哪个 Issue？
    ├─ 保留最早的 Issue（通常）
    └─ 保留描述最详细的 Issue（如适用）
    ↓
在要关闭的 Issue 中评论
    ↓
添加 duplicate 标签
    ↓
关闭重复 Issue
    ↓
在保留的 Issue 中链接被关闭的 Issue
```

---

### 处理模板

#### 在重复 Issue 中的评论模板

```markdown
## 🔍 重复 Issue 检测

此 Issue 与 #xxx 重复。

**重复原因**: 两者描述的是同一个问题/需求。

**保留 Issue**: #xxx（创建时间更早/描述更详细）

**后续操作**:
- 请在 #xxx 下继续讨论
- 我会将这里的补充信息同步到 #xxx

感谢你的反馈！为避免重复跟踪，我将关闭此 Issue。
```

#### 在原 Issue 中的评论模板

```markdown
## 📌 相关 Issue

检测到重复报告：
- #yyy（已关闭）

已将相关信息合并到此 Issue。
```

---

## 操作检查清单

### 开发者 - 创建 Issue 前

```markdown
## ✅ Issue 创建前检查清单

在创建新 Issue 前，请确认：

### 1. 搜索检查
- [ ] 使用至少 3 个关键词搜索已有 Issue
- [ ] 检查了 Open 和 Closed 状态
- [ ] 查看了最近 6 个月的历史

### 2. 信息准备
- [ ] 明确了问题类型（Bug/Feature/Docs/etc）
- [ ] 收集了必要的环境信息
- [ ] 准备了复现步骤或使用场景
- [ ] 准备了截图或日志（如适用）

### 3. 标题规范
- [ ] 包含类型标识（[BUG]/[FEATURE]/etc）
- [ ] 简洁描述问题（不是解决方案）
- [ ] 避免过于宽泛的描述

### 4. 使用模板
- [ ] 选择了正确的 Issue 模板
- [ ] 填写了所有必填项
- [ ] 提供了足够的信息

如果以上都已完成，欢迎创建 Issue！
```

---

### 开发总监 - 每周维护

```markdown
## ✅ 每周 Issue 维护检查清单

**日期**: ____年__月__日  
**执行人**: ____________

### 1. 新 Issue 分类（约 15 分钟）
- [ ] 查询: is:open is:issue label:needs-triage
- [ ] 为每个新 Issue 分配类型标签
- [ ] 为每个新 Issue 分配优先级标签
- [ ] 分配给合适的团队成员
- [ ] 对信息不足的 Issue 请求补充

### 2. 长期未响应 Issue（约 10 分钟）
- [ ] 查询: is:open is:issue updated:<14-days-ago
- [ ] 发起跟进评论
- [ ] 关闭超过 30 天无响应的 question 类型 Issue

### 3. 重复 Issue 检查（约 5 分钟）
- [ ] 浏览最近 7 天的新 Issue
- [ ] 检查标题和内容相似性
- [ ] 合并并关闭重复 Issue

### 4. 统计记录
- [ ] 记录本周新建 Issue 数: ____
- [ ] 记录本周关闭 Issue 数: ____
- [ ] 记录发现重复 Issue 数: ____

### 5. 其他事项
- [ ] 备注: ___________________________
```

---

### 开发总监 - 每月维护

```markdown
## ✅ 每月 Issue 维护检查清单

**月份**: ____年__月  
**执行人**: ____________

### 1. 清理过期 Issue（约 20 分钟）
- [ ] 关闭已解决但未关闭的 Issue
- [ ] 关闭超过 3 个月无进展的 P3-low Issue
- [ ] 归档已发布的 enhancement Issue

### 2. 标签审查（约 10 分钟）
- [ ] 检查标签使用规范性
- [ ] 更新标签定义（如需要）
- [ ] 删除不再使用的标签

### 3. 统计与报告（约 20 分钟）
- [ ] 新建 Issue 数: ____
- [ ] 关闭 Issue 数: ____
- [ ] 仍在处理: ____
- [ ] 平均处理时间: ____ 天
- [ ] 重复 Issue: ____ 个（占比 ____%）
- [ ] 生成月度报告并发布

### 4. Roadmap 更新（约 10 分钟）
- [ ] 将高优先级 Feature Request 加入 Roadmap
- [ ] 更新项目计划

### 5. 改进建议
- [ ] 识别高频问题: ________________
- [ ] 需要改进的文档: ______________
- [ ] 流程优化建议: ________________
```

---

## 附录

### 常用 GitHub 查询语句

```bash
# 查找未分类的 Issue
is:open is:issue label:needs-triage

# 查找高优先级 Bug
is:open is:issue label:bug label:P0-critical,label:P1-high

# 查找长期未更新的 Issue
is:open is:issue updated:<2026-01-01

# 查找特定模块的 Issue
is:open is:issue label:frontend

# 查找需要信息的 Issue
is:open is:issue label:needs-info

# 查找正在处理的 Issue
is:open is:issue label:in-progress

# 查找重复 Issue
is:open is:issue label:duplicate

# 按创建者查找
is:open is:issue author:username

# 按分配人查找
is:open is:issue assignee:username
```

---

### 相关文档

- [CONTRIBUTING.md](../CONTRIBUTING.md) - 贡献者指南
- [README.md](../README.md) - 项目说明
- [CHANGELOG.md](../CHANGELOG.md) - 变更日志

---

### 联系方式

如有 Issue 管理相关问题，请联系：

- **开发总监**: @dev-director
- **GitHub Issues**: https://github.com/dyyz1993/coin-exchange-protocol/issues

---

**文档版本**: v1.0.0  
**创建日期**: 2026-03-01  
**最后更新**: 2026-03-01  
**维护者**: 开发总监

---

> 💡 **提示**: 本文档是动态文档，会根据项目发展和团队反馈持续改进。如有建议，欢迎提交 Issue！
