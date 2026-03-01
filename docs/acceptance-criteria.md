# 功能验收标准和测试用例文档

> 📋 **文档版本**: v1.0  
> 📅 **最后更新**: 2026-03-01  
> 👤 **负责人**: 测试工程师  
> 🏷️ **标签**: `quality` `testing` `documentation` `P1`

## 目录

1. [概述](#概述)
2. [验收标准](#验收标准)
3. [测试用例模板](#测试用例模板)
4. [核心功能验收标准](#核心功能验收标准)
5. [非功能性验收标准](#非功能性验收标准)
6. [测试报告模板](#测试报告模板)

---

## 概述

### 目的
本文档定义了金币交易协议系统的功能验收标准和测试用例，确保所有功能符合业务需求和质量标准。

### 适用范围
- 账户系统
- 空投系统
- 任务系统
- 冻结系统

### 验收标准
- ✅ 至少覆盖4个核心模块
- ✅ 每个功能至少5个测试用例
- ✅ 测试通过率 > 80%

---

## 验收标准

### 1. 功能验收标准

| 标准 | 描述 | 指标 |
|------|------|------|
| 功能完整性 | 所有需求功能均已实现 | 100% |
| 功能正确性 | 功能符合业务逻辑 | 通过率 > 95% |
| 边界处理 | 边界情况正确处理 | 通过率 > 90% |
| 异常处理 | 异常情况合理提示 | 通过率 > 90% |
| 数据一致性 | 数据状态保持一致 | 100% |

### 2. 非功能验收标准

| 标准 | 描述 | 指标 |
|------|------|------|
| 性能 | API响应时间 | P95 < 200ms |
| 安全 | 输入验证、权限控制 | 无安全漏洞 |
| 可用性 | 系统可用性 | > 99.9% |
| 可维护性 | 代码覆盖率 | > 80% |

---

## 测试用例模板

### 测试用例分类

#### 1. 正常流程测试（Positive Testing）
验证功能在正常输入下的行为。

**模板:**
```
测试ID: TC-[模块]-[功能]-N[编号]
测试名称: [功能名称] - [测试场景]
前置条件: [需要的前置条件]
测试步骤:
  1. [步骤1]
  2. [步骤2]
  3. [步骤3]
预期结果: [预期输出]
优先级: P0/P1/P2/P3
```

#### 2. 边界值测试（Boundary Testing）
验证功能在边界值下的行为。

**模板:**
```
测试ID: TC-[模块]-[功能]-B[编号]
测试名称: [功能名称] - 边界值测试
测试数据: [边界值数据]
预期结果: [预期输出]
```

#### 3. 异常测试（Negative Testing）
验证功能在异常输入下的行为。

**模板:**
```
测试ID: TC-[模块]-[功能]-E[编号]
测试名称: [功能名称] - 异常场景
异常场景: [描述异常情况]
预期结果: [预期的错误提示]
```

#### 4. 并发测试（Concurrency Testing）
验证功能在并发场景下的行为。

**模板:**
```
测试ID: TC-[模块]-[功能]-C[编号]
测试名称: [功能名称] - 并发测试
并发数: [并发用户数]
测试场景: [描述并发场景]
预期结果: [预期行为]
```

#### 5. 性能测试（Performance Testing）
验证功能的性能指标。

**模板:**
```
测试ID: TC-[模块]-[功能]-P[编号]
测试名称: [功能名称] - 性能测试
性能指标: [响应时间/吞吐量等]
目标值: [期望值]
实际值: [测试结果]
```

---

## 核心功能验收标准

### 1. 账户系统

#### 1.1 创建账户

**API**: `POST /api/account/create`

**验收标准:**
- ✅ 能够成功创建新账户
- ✅ 初始余额正确设置
- ✅ 重复创建返回错误
- ✅ 无效参数返回错误提示

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-ACCT-CREATE-N01 | 正常创建账户 | {userId: "user001", initialBalance: 100} | 成功创建，余额100 | P0 |
| TC-ACCT-CREATE-N02 | 创建账户默认余额 | {userId: "user002"} | 成功创建，余额0 | P0 |
| TC-ACCT-CREATE-N03 | 创建账户初始余额为0 | {userId: "user003", initialBalance: 0} | 成功创建，余额0 | P1 |
| TC-ACCT-CREATE-B01 | 边界值-最大余额 | {userId: "user004", initialBalance: MAX_VALUE} | 成功创建或合理提示 | P2 |
| TC-ACCT-CREATE-E01 | 重复创建账户 | {userId: "user001", initialBalance: 100} | 返回错误：账户已存在 | P0 |
| TC-ACCT-CREATE-E02 | 无效用户ID | {userId: "", initialBalance: 100} | 返回错误：无效的用户ID | P0 |
| TC-ACCT-CREATE-E03 | 负数初始余额 | {userId: "user005", initialBalance: -100} | 返回错误：无效的初始余额 | P0 |
| TC-ACCT-CREATE-E04 | 非数字初始余额 | {userId: "user006", initialBalance: "abc"} | 返回错误：无效的初始余额 | P1 |
| TC-ACCT-CREATE-E05 | 缺少用户ID | {initialBalance: 100} | 返回错误：无效的用户ID | P0 |

#### 1.2 查询余额

**API**: `GET /api/account/balance/:userId`

**验收标准:**
- ✅ 正确返回账户余额
- ✅ 账户不存在时返回错误
- ✅ 返回数据包含总余额、可用余额、冻结余额

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-ACCT-BALANCE-N01 | 查询正常账户余额 | userId: "user001" | 返回余额信息 | P0 |
| TC-ACCT-BALANCE-N02 | 查询零余额账户 | userId: "user002" | 返回余额0 | P0 |
| TC-ACCT-BALANCE-N03 | 查询有冻结余额的账户 | userId: "frozen_user" | 返回总余额、可用余额、冻结余额 | P1 |
| TC-ACCT-BALANCE-E01 | 查询不存在的账户 | userId: "nonexistent" | 返回错误：账户不存在 | P0 |
| TC-ACCT-BALANCE-E02 | 无效用户ID | userId: "" | 返回错误：缺少用户ID | P0 |

#### 1.3 充值

**API**: `POST /api/account/deposit`

**验收标准:**
- ✅ 余额正确增加
- ✅ 交易记录正确生成
- ✅ 充值金额必须大于0
- ✅ 充值到不存在的账户返回错误

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-ACCT-DEPOSIT-N01 | 正常充值 | {userId: "user001", amount: 100, reason: "充值"} | 余额增加100 | P0 |
| TC-ACCT-DEPOSIT-N02 | 大额充值 | {userId: "user001", amount: 1000000} | 余额正确增加 | P1 |
| TC-ACCT-DEPOSIT-N03 | 无备注充值 | {userId: "user001", amount: 50} | 成功充值 | P2 |
| TC-ACCT-DEPOSIT-B01 | 最小金额充值 | {userId: "user001", amount: 0.01} | 成功充值 | P2 |
| TC-ACCT-DEPOSIT-E01 | 充值负数 | {userId: "user001", amount: -100} | 返回错误：无效的充值金额 | P0 |
| TC-ACCT-DEPOSIT-E02 | 充值0 | {userId: "user001", amount: 0} | 返回错误：无效的充值金额 | P0 |
| TC-ACCT-DEPOSIT-E03 | 充值到不存在账户 | {userId: "nonexistent", amount: 100} | 返回错误：账户不存在 | P0 |
| TC-ACCT-DEPOSIT-E04 | 非数字金额 | {userId: "user001", amount: "abc"} | 返回错误：无效的充值金额 | P1 |

#### 1.4 提现

**API**: `POST /api/account/withdraw`

**验收标准:**
- ✅ 余额正确减少
- ✅ 不能提现超过可用余额
- ✅ 交易记录正确生成
- ✅ 冻结账户不能提现

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| TC-ACCT-WITHDRAW-N01 | 正常提现 | {userId: "user001", amount: 50} | 余额100 | 成功提现，余额50 | P0 |
| TC-ACCT-WITHDRAW-N02 | 提现全部余额 | {userId: "user001", amount: 100} | 余额100 | 成功提现，余额0 | P1 |
| TC-ACCT-WITHDRAW-E01 | 提现超过余额 | {userId: "user001", amount: 200} | 余额100 | 返回错误：余额不足 | P0 |
| TC-ACCT-WITHDRAW-E02 | 提现负数 | {userId: "user001", amount: -50} | 余额100 | 返回错误：无效的提现金额 | P0 |
| TC-ACCT-WITHDRAW-E03 | 提现0 | {userId: "user001", amount: 0} | 余额100 | 返回错误：无效的提现金额 | P0 |
| TC-ACCT-WITHDRAW-E04 | 冻结账户提现 | {userId: "frozen_user", amount: 50} | 账户已冻结 | 返回错误：账户已冻结 | P0 |
| TC-ACCT-WITHDRAW-E05 | 提现超过可用余额 | {userId: "user001", amount: 80} | 总余额100，冻结30 | 返回错误：可用余额不足 | P1 |

#### 1.5 转账

**API**: `POST /api/account/transfer`

**验收标准:**
- ✅ 转出账户余额正确减少
- ✅ 转入账户余额正确增加
- ✅ 转账记录正确生成
- ✅ 不能转账给自己
- ✅ 不能转账超过可用余额

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| TC-ACCT-TRANSFER-N01 | 正常转账 | {fromUserId: "user001", toUserId: "user002", amount: 50} | user001余额100 | 转账成功 | P0 |
| TC-ACCT-TRANSFER-N02 | 转账全部余额 | {fromUserId: "user001", toUserId: "user002", amount: 100} | user001余额100 | 转账成功 | P1 |
| TC-ACCT-TRANSFER-N03 | 带备注转账 | {fromUserId: "user001", toUserId: "user002", amount: 50, reason: "还款"} | user001余额100 | 转账成功 | P2 |
| TC-ACCT-TRANSFER-E01 | 转账给自己 | {fromUserId: "user001", toUserId: "user001", amount: 50} | - | 返回错误：不能转账给自己 | P0 |
| TC-ACCT-TRANSFER-E02 | 转账超过余额 | {fromUserId: "user001", toUserId: "user002", amount: 200} | user001余额100 | 返回错误：余额不足 | P0 |
| TC-ACCT-TRANSFER-E03 | 转账到不存在账户 | {fromUserId: "user001", toUserId: "nonexistent", amount: 50} | - | 返回错误：目标账户不存在 | P0 |
| TC-ACCT-TRANSFER-E04 | 转账负数 | {fromUserId: "user001", toUserId: "user002", amount: -50} | - | 返回错误：无效的转账金额 | P0 |
| TC-ACCT-TRANSFER-E05 | 冻结账户转账 | {fromUserId: "frozen_user", toUserId: "user002", amount: 50} | frozen_user已冻结 | 返回错误：账户已冻结 | P0 |
| TC-ACCT-TRANSFER-C01 | 并发转账 | 10个并发转账请求 | user001余额1000 | 所有转账成功或部分失败，数据一致 | P1 |

#### 1.6 查询交易记录

**API**: `GET /api/account/transactions/:userId`

**验收标准:**
- ✅ 返回所有交易记录
- ✅ 记录包含类型、金额、时间、余额变化
- ✅ 记录按时间倒序排列

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-ACCT-TRANS-N01 | 查询交易记录 | userId: "user001" | 返回所有交易记录 | P0 |
| TC-ACCT-TRANS-N02 | 查询空记录 | userId: "new_user" | 返回空数组 | P1 |
| TC-ACCT-TRANS-N03 | 验证记录顺序 | userId: "user001" | 按时间倒序排列 | P1 |
| TC-ACCT-TRANS-E01 | 查询不存在的账户 | userId: "nonexistent" | 返回错误：账户不存在 | P0 |

#### 1.7 冻结账户

**API**: `POST /api/account/freeze`

**验收标准:**
- ✅ 账户状态变为冻结
- ✅ 不能进行转账、提现操作
- ✅ 记录冻结原因和时间

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-ACCT-FREEZE-N01 | 正常冻结账户 | {userId: "user001", reason: "违规操作"} | 冻结成功 | P0 |
| TC-ACCT-FREEZE-N02 | 冻结带期限 | {userId: "user001", reason: "审核", duration: 7} | 冻结成功，7天后自动解冻 | P1 |
| TC-ACCT-FREEZE-E01 | 冻结不存在的账户 | {userId: "nonexistent", reason: "test"} | 返回错误：账户不存在 | P0 |
| TC-ACCT-FREEZE-E02 | 重复冻结 | {userId: "frozen_user", reason: "test"} | 返回错误：账户已冻结 | P1 |
| TC-ACCT-FREEZE-E03 | 缺少冻结原因 | {userId: "user001"} | 返回错误：冻结原因不能为空 | P0 |

#### 1.8 解冻账户

**API**: `POST /api/account/unfreeze`

**验收标准:**
- ✅ 账户状态变为正常
- ✅ 可以进行转账、提现操作
- ✅ 记录解冻原因和时间

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| TC-ACCT-UNFREEZE-N01 | 正常解冻账户 | {userId: "frozen_user"} | 账户已冻结 | 解冻成功 | P0 |
| TC-ACCT-UNFREEZE-N02 | 解冻带原因 | {userId: "frozen_user", reason: "审核通过"} | 账户已冻结 | 解冻成功 | P1 |
| TC-ACCT-UNFREEZE-E01 | 解冻正常账户 | {userId: "user001"} | 账户正常 | 返回错误：账户未冻结 | P1 |
| TC-ACCT-UNFREEZE-E02 | 解冻不存在的账户 | {userId: "nonexistent"} | - | 返回错误：账户不存在 | P0 |

---

### 2. 空投系统

#### 2.1 创建空投

**API**: `POST /api/airdrop/create`

**验收标准:**
- ✅ 空投信息正确保存
- ✅ 初始状态为待激活
- ✅ 总金额和单用户金额验证
- ✅ 时间范围验证

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-AIRDROP-CREATE-N01 | 正常创建空投 | {name: "新年空投", totalAmount: 10000, perUserAmount: 100, startTime: "2026-01-01", endTime: "2026-01-07"} | 创建成功 | P0 |
| TC-AIRDROP-CREATE-N02 | 创建带描述的空投 | {name: "春节空投", description: "春节活动", totalAmount: 50000, perUserAmount: 500, ...} | 创建成功 | P1 |
| TC-AIRDROP-CREATE-B01 | 单用户金额等于总金额 | {totalAmount: 100, perUserAmount: 100, ...} | 创建成功 | P2 |
| TC-AIRDROP-CREATE-E01 | 单用户金额超过总金额 | {totalAmount: 100, perUserAmount: 200, ...} | 返回错误 | P0 |
| TC-AIRDROP-CREATE-E02 | 结束时间早于开始时间 | {startTime: "2026-01-07", endTime: "2026-01-01", ...} | 返回错误 | P0 |
| TC-AIRDROP-CREATE-E03 | 缺少必填参数 | {name: "test"} | 返回错误：缺少必要参数 | P0 |
| TC-AIRDROP-CREATE-E04 | 负数金额 | {totalAmount: -100, ...} | 返回错误 | P1 |

#### 2.2 领取空投

**API**: `POST /api/airdrop/claim`

**验收标准:**
- ✅ 正确发放空投金额
- ✅ 不能重复领取
- ✅ 空投总额正确扣减
- ✅ 领取记录正确生成

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| TC-AIRDROP-CLAIM-N01 | 正常领取空投 | {airdropId: "airdrop001", userId: "user001"} | 空投已激活 | 领取成功 | P0 |
| TC-AIRDROP-CLAIM-N02 | 首次领取 | {airdropId: "airdrop001", userId: "user002"} | 用户未领取过 | 领取成功 | P0 |
| TC-AIRDROP-CLAIM-E01 | 重复领取 | {airdropId: "airdrop001", userId: "user001"} | 用户已领取 | 返回错误：已领取 | P0 |
| TC-AIRDROP-CLAIM-E02 | 领取未激活空投 | {airdropId: "inactive_airdrop", userId: "user001"} | 空投未激活 | 返回错误：空投未激活 | P0 |
| TC-AIRDROP-CLAIM-E03 | 领取已结束空投 | {airdropId: "ended_airdrop", userId: "user001"} | 空投已结束 | 返回错误：空投已结束 | P0 |
| TC-AIRDROP-CLAIM-E04 | 领取金额耗尽的空投 | {airdropId: "exhausted_airdrop", userId: "user003"} | 总金额已领完 | 返回错误：空投已领完 | P0 |
| TC-AIRDROP-CLAIM-E05 | 不存在的空投 | {airdropId: "nonexistent", userId: "user001"} | - | 返回错误：空投不存在 | P0 |
| TC-AIRDROP-CLAIM-C01 | 并发领取 | 100个并发领取请求 | 总金额5000 | 正确扣减，无超发 | P1 |

#### 2.3 查询空投

**API**: `GET /api/airdrop/:airdropId`

**验收标准:**
- ✅ 返回空投详细信息
- ✅ 包含剩余金额、领取人数
- ✅ 不存在的空投返回错误

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-AIRDROP-GET-N01 | 查询存在的空投 | airdropId: "airdrop001" | 返回空投详情 | P0 |
| TC-AIRDROP-GET-N02 | 查询包含领取记录 | airdropId: "airdrop001" | 返回领取人数和剩余金额 | P1 |
| TC-AIRDROP-GET-E01 | 查询不存在的空投 | airdropId: "nonexistent" | 返回错误：空投不存在 | P0 |

#### 2.4 获取活跃空投

**API**: `GET /api/airdrop/active`

**验收标准:**
- ✅ 返回所有可领取的空投
- ✅ 不包含未激活、已结束的空投
- ✅ 按结束时间排序

**测试用例:**

| 测试ID | 测试场景 | 预期结果 | 优先级 |
|--------|---------|---------|--------|
| TC-AIRDROP-ACTIVE-N01 | 查询活跃空投 | 返回所有可领取的空投 | P0 |
| TC-AIRDROP-ACTIVE-N02 | 无活跃空投 | 返回空数组 | P1 |
| TC-AIRDROP-ACTIVE-N03 | 验证排序 | 按结束时间升序排列 | P2 |

#### 2.5 检查用户是否可领取

**API**: `GET /api/airdrop/can-claim/:airdropId/:userId`

**验收标准:**
- ✅ 正确判断用户是否可领取
- ✅ 返回不可领取的原因

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| TC-AIRDROP-CANCLAIM-N01 | 可领取 | {airdropId: "airdrop001", userId: "user003"} | 用户未领取，空投激活 | 返回：可领取 | P0 |
| TC-AIRDROP-CANCLAIM-E01 | 已领取 | {airdropId: "airdrop001", userId: "user001"} | 用户已领取 | 返回：已领取 | P0 |
| TC-AIRDROP-CANCLAIM-E02 | 空投未激活 | {airdropId: "inactive", userId: "user001"} | 空投未激活 | 返回：空投未激活 | P1 |
| TC-AIRDROP-CANCLAIM-E03 | 空投已结束 | {airdropId: "ended", userId: "user001"} | 空投已结束 | 返回：空投已结束 | P1 |

---

### 3. 任务系统

#### 3.1 创建任务

**API**: `POST /api/task/create`

**验收标准:**
- ✅ 任务信息正确保存
- ✅ 初始状态为待激活
- ✅ 奖励金额验证
- ✅ 时间范围验证

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-TASK-CREATE-N01 | 创建每日任务 | {title: "每日签到", reward: 10, type: "daily"} | 创建成功 | P0 |
| TC-TASK-CREATE-N02 | 创建限时任务 | {title: "活动任务", reward: 100, type: "event", startTime: "2026-01-01", endTime: "2026-01-07"} | 创建成功 | P1 |
| TC-TASK-CREATE-N03 | 创建带最大完成次数的任务 | {title: "限量任务", reward: 50, maxCompletions: 100} | 创建成功 | P1 |
| TC-TASK-CREATE-B01 | 奖励为0 | {title: "免费任务", reward: 0} | 创建成功 | P2 |
| TC-TASK-CREATE-E01 | 缺少标题 | {reward: 10} | 返回错误：缺少必要参数 | P0 |
| TC-TASK-CREATE-E02 | 缺少奖励 | {title: "测试任务"} | 返回错误：缺少必要参数 | P0 |
| TC-TASK-CREATE-E03 | 负数奖励 | {title: "错误任务", reward: -10} | 返回错误 | P1 |
| TC-TASK-CREATE-E04 | 结束时间早于开始时间 | {startTime: "2026-01-07", endTime: "2026-01-01", ...} | 返回错误 | P1 |

#### 3.2 完成任务

**API**: `POST /api/task/complete`

**验收标准:**
- ✅ 正确发放任务奖励
- ✅ 不能重复完成（除非允许多次）
- ✅ 完成次数正确增加
- ✅ 奖励记录正确生成

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| TC-TASK-COMPLETE-N01 | 完成任务 | {taskId: "task001", userId: "user001"} | 任务已激活，用户未完成 | 完成成功，获得奖励 | P0 |
| TC-TASK-COMPLETE-N02 | 完成可重复任务 | {taskId: "repeat_task", userId: "user001"} | 任务允许多次完成 | 完成成功 | P1 |
| TC-TASK-COMPLETE-E01 | 重复完成一次性任务 | {taskId: "task001", userId: "user001"} | 用户已完成 | 返回错误：已完成 | P0 |
| TC-TASK-COMPLETE-E02 | 完成未激活任务 | {taskId: "inactive_task", userId: "user001"} | 任务未激活 | 返回错误：任务未激活 | P0 |
| TC-TASK-COMPLETE-E03 | 完成已结束任务 | {taskId: "ended_task", userId: "user001"} | 任务已结束 | 返回错误：任务已结束 | P0 |
| TC-TASK-COMPLETE-E04 | 超过最大完成次数 | {taskId: "limited_task", userId: "user001"} | 已达最大次数 | 返回错误：已达最大完成次数 | P1 |
| TC-TASK-COMPLETE-E05 | 不存在的任务 | {taskId: "nonexistent", userId: "user001"} | - | 返回错误：任务不存在 | P0 |
| TC-TASK-COMPLETE-C01 | 并发完成 | 100个并发完成请求 | 最大完成次数100 | 正确计数，不超发 | P1 |

#### 3.3 查询任务

**API**: `GET /api/task/:taskId`

**验收标准:**
- ✅ 返回任务详细信息
- ✅ 包含完成人数、剩余次数
- ✅ 不存在的任务返回错误

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-TASK-GET-N01 | 查询存在的任务 | taskId: "task001" | 返回任务详情 | P0 |
| TC-TASK-GET-N02 | 查询包含完成统计 | taskId: "task001" | 返回完成人数和剩余次数 | P1 |
| TC-TASK-GET-E01 | 查询不存在的任务 | taskId: "nonexistent" | 返回错误：任务不存在 | P0 |

#### 3.4 获取活跃任务

**API**: `GET /api/task/active`

**验收标准:**
- ✅ 返回所有可完成的任务
- ✅ 不包含未激活、已结束的任务
- ✅ 按奖励金额或时间排序

**测试用例:**

| 测试ID | 测试场景 | 预期结果 | 优先级 |
|--------|---------|---------|--------|
| TC-TASK-ACTIVE-N01 | 查询活跃任务 | 返回所有可完成的任务 | P0 |
| TC-TASK-ACTIVE-N02 | 无活跃任务 | 返回空数组 | P1 |
| TC-TASK-ACTIVE-N03 | 验证排序 | 按创建时间或奖励排序 | P2 |

#### 3.5 获取用户可完成任务

**API**: `GET /api/task/available/:userId`

**验收标准:**
- ✅ 返回用户可完成的任务列表
- ✅ 排除用户已完成的任务（一次性）
- ✅ 显示剩余完成次数

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-TASK-AVAILABLE-N01 | 查询可完成任务 | userId: "user001" | 返回未完成的任务 | P0 |
| TC-TASK-AVAILABLE-N02 | 验证排除已完成 | userId: "user001" | 不包含已完成的任务 | P1 |
| TC-TASK-AVAILABLE-E01 | 用户不存在 | userId: "nonexistent" | 返回空数组或错误 | P1 |

#### 3.6 暂停/取消任务

**API**: `POST /api/task/pause/:taskId` / `POST /api/task/cancel/:taskId`

**验收标准:**
- ✅ 暂停后任务不可完成
- ✅ 取消后任务永久失效
- ✅ 状态正确更新

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| TC-TASK-PAUSE-N01 | 暂停任务 | taskId: "task001" | 任务激活 | 暂停成功 | P1 |
| TC-TASK-PAUSE-E01 | 暂停已暂停的任务 | taskId: "paused_task" | 任务已暂停 | 返回错误或忽略 | P2 |
| TC-TASK-CANCEL-N01 | 取消任务 | taskId: "task001" | 任务存在 | 取消成功 | P1 |
| TC-TASK-CANCEL-E01 | 取消已取消的任务 | taskId: "cancelled_task" | 任务已取消 | 返回错误或忽略 | P2 |

---

### 4. 冻结系统

#### 4.1 申请冻结

**API**: `POST /api/freeze/apply`

**验收标准:**
- ✅ 冻结申请正确提交
- ✅ 初始状态为待审核
- ✅ 金额和原因验证

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-FREEZE-APPLY-N01 | 正常申请冻结 | {userId: "user001", amount: 100, reason: "违规"} | 申请成功 | P0 |
| TC-FREEZE-APPLY-N02 | 申请带备注 | {userId: "user001", amount: 100, reason: "审核中", comment: "需进一步调查"} | 申请成功 | P1 |
| TC-FREEZE-APPLY-B01 | 冻结全部余额 | {userId: "user001", amount: 1000} | 余额1000 | 申请成功 | P1 |
| TC-FREEZE-APPLY-E01 | 冻结超过余额 | {userId: "user001", amount: 2000} | 余额1000 | 返回错误 | P0 |
| TC-FREEZE-APPLY-E02 | 冻结负数 | {userId: "user001", amount: -100} | 返回错误 | P0 |
| TC-FREEZE-APPLY-E03 | 缺少冻结原因 | {userId: "user001", amount: 100} | 返回错误：原因不能为空 | P0 |
| TC-FREEZE-APPLY-E04 | 冻结不存在账户 | {userId: "nonexistent", amount: 100} | 返回错误：账户不存在 | P0 |

#### 4.2 审核冻结

**API**: `POST /api/freeze/approve` / `POST /api/freeze/reject`

**验收标准:**
- ✅ 审核通过后余额正确冻结
- ✅ 审核拒绝后申请失效
- ✅ 审核记录正确生成
- ✅ 不能重复审核

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| TC-FREEZE-APPROVE-N01 | 审核通过 | {freezeId: "freeze001", approver: "admin001"} | 申请待审核 | 审核通过，余额冻结 | P0 |
| TC-FREEZE-APPROVE-N02 | 审核通过带备注 | {freezeId: "freeze001", approver: "admin001", comment: "确认违规"} | 申请待审核 | 审核通过 | P1 |
| TC-FREEZE-REJECT-N01 | 审核拒绝 | {freezeId: "freeze002", approver: "admin001", reason: "证据不足"} | 申请待审核 | 审核拒绝 | P0 |
| TC-FREEZE-APPROVE-E01 | 重复审核 | {freezeId: "freeze001", approver: "admin002"} | 已审核 | 返回错误：已审核 | P0 |
| TC-FREEZE-APPROVE-E02 | 审核不存在的申请 | {freezeId: "nonexistent", approver: "admin001"} | - | 返回错误：申请不存在 | P0 |

#### 4.3 解冻申请

**API**: `POST /api/freeze/unfreeze-apply`

**验收标准:**
- ✅ 解冻申请正确提交
- ✅ 初始状态为待审核
- ✅ 只能对已冻结的金额申请解冻

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| TC-FREEZE-UNAPPLY-N01 | 申请解冻 | {freezeId: "freeze001", reason: "审核通过"} | 冻结已生效 | 申请成功 | P0 |
| TC-FREEZE-UNAPPLY-E01 | 申请解冻未冻结的金额 | {freezeId: "freeze002", reason: "test"} | 冻结未生效 | 返回错误 | P0 |
| TC-FREEZE-UNAPPLY-E02 | 重复申请解冻 | {freezeId: "freeze001", reason: "test"} | 已申请解冻 | 返回错误：已申请 | P1 |

#### 4.4 查询冻结记录

**API**: `GET /api/freeze/list/:userId`

**验收标准:**
- ✅ 返回用户所有冻结记录
- ✅ 包含冻结状态、金额、时间
- ✅ 按时间倒序排列

**测试用例:**

| 测试ID | 测试场景 | 输入数据 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-FREEZE-LIST-N01 | 查询冻结记录 | userId: "user001" | 返回所有冻结记录 | P0 |
| TC-FREEZE-LIST-N02 | 查询空记录 | userId: "new_user" | 返回空数组 | P1 |
| TC-FREEZE-LIST-N03 | 验证记录顺序 | userId: "user001" | 按时间倒序 | P1 |
| TC-FREEZE-LIST-E01 | 用户不存在 | userId: "nonexistent" | 返回空数组或错误 | P1 |

---

## 非功能性验收标准

### 1. 性能验收标准

| 指标 | 目标值 | 测试方法 |
|------|--------|---------|
| API响应时间 (P50) | < 50ms | 性能测试工具 |
| API响应时间 (P95) | < 200ms | 性能测试工具 |
| API响应时间 (P99) | < 500ms | 性能测试工具 |
| 并发处理能力 | > 100 QPS | 压力测试 |
| 数据库查询时间 | < 10ms | 数据库监控 |

**测试用例:**

| 测试ID | 测试场景 | 测试指标 | 目标值 | 优先级 |
|--------|---------|---------|--------|--------|
| TC-PERF-01 | 账户查询性能 | P95响应时间 | < 100ms | P1 |
| TC-PERF-02 | 转账性能 | P95响应时间 | < 200ms | P1 |
| TC-PERF-03 | 并发转账 | 成功率 | > 99% | P1 |
| TC-PERF-04 | 空投领取并发 | 无超发 | 100% | P0 |
| TC-PERF-05 | 任务完成并发 | 无超发 | 100% | P0 |

### 2. 安全验收标准

| 标准 | 描述 | 验证方法 |
|------|------|---------|
| 输入验证 | 所有输入参数验证 | 渗透测试 |
| 权限控制 | 正确的权限验证 | 安全审计 |
| SQL注入 | 无SQL注入漏洞 | 安全扫描 |
| XSS攻击 | 无XSS漏洞 | 安全扫描 |
| 数据加密 | 敏感数据加密 | 代码审计 |

**测试用例:**

| 测试ID | 测试场景 | 测试方法 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-SEC-01 | SQL注入测试 | 输入SQL语句 | 被正确转义或拒绝 | P0 |
| TC-SEC-02 | XSS攻击测试 | 输入脚本代码 | 被正确转义或拒绝 | P0 |
| TC-SEC-03 | 权限绕过测试 | 越权访问 | 被正确拦截 | P0 |
| TC-SEC-04 | 参数篡改测试 | 修改关键参数 | 被正确验证 | P0 |
| TC-SEC-05 | 重复提交测试 | 重复提交请求 | 被正确处理 | P1 |

### 3. 可用性验收标准

| 标准 | 描述 | 指标 |
|------|------|------|
| 系统可用性 | 系统正常运行时间 | > 99.9% |
| 错误处理 | 友好的错误提示 | 100% |
| API文档 | 完整的API文档 | 100% |
| 日志记录 | 完整的操作日志 | 100% |

**测试用例:**

| 测试ID | 测试场景 | 验证内容 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| TC-USA-01 | 错误提示友好性 | 各种错误场景 | 返回清晰错误信息 | P1 |
| TC-USA-02 | API文档完整性 | 所有API端点 | 文档覆盖100% | P1 |
| TC-USA-03 | 日志完整性 | 关键操作 | 日志记录完整 | P1 |
| TC-USA-04 | 响应格式一致性 | 所有API响应 | 格式统一 | P2 |

### 4. 可维护性验收标准

| 标准 | 描述 | 指标 |
|------|------|------|
| 代码覆盖率 | 单元测试覆盖率 | > 80% |
| 代码质量 | 无严重代码问题 | SonarQube扫描 |
| 文档完整性 | 代码注释和文档 | > 90% |
| 代码复用 | 减少重复代码 | < 5% |

**测试用例:**

| 测试ID | 测试场景 | 验证内容 | 目标值 | 优先级 |
|--------|---------|---------|--------|--------|
| TC-MAIN-01 | 单元测试覆盖率 | 核心业务逻辑 | > 80% | P1 |
| TC-MAIN-02 | 集成测试覆盖率 | API端点 | > 70% | P1 |
| TC-MAIN-03 | 代码质量扫描 | 代码异味和安全漏洞 | 无严重问题 | P2 |

---

## 测试报告模板

### 1. 测试执行报告

```markdown
# 测试执行报告

## 基本信息
- 测试日期: [YYYY-MM-DD]
- 测试人员: [姓名]
- 测试环境: [开发/测试/预发布]
- 测试版本: [版本号]

## 测试概览
- 测试用例总数: [数量]
- 通过数量: [数量]
- 失败数量: [数量]
- 阻塞数量: [数量]
- 通过率: [百分比]

## 测试详情
| 模块 | 用例数 | 通过 | 失败 | 阻塞 | 通过率 |
|------|--------|------|------|------|--------|
| 账户系统 | - | - | - | - | - |
| 空投系统 | - | - | - | - | - |
| 任务系统 | - | - | - | - | - |
| 冻结系统 | - | - | - | - | - |

## 缺陷统计
| 严重程度 | 数量 | 已修复 | 待修复 |
|----------|------|--------|--------|
| 致命 | - | - | - |
| 严重 | - | - | - |
| 一般 | - | - | - |
| 轻微 | - | - | - |

## 性能测试结果
| API | P50 | P95 | P99 | 是否达标 |
|-----|-----|-----|-----|----------|
| - | - | - | - | - |

## 测试结论
[通过/不通过] - [说明]

## 建议
1. [建议1]
2. [建议2]
```

### 2. 缺陷报告模板

```markdown
# 缺陷报告

## 基本信息
- 缺陷ID: [BUG-XXX]
- 标题: [简短描述]
- 严重程度: [致命/严重/一般/轻微]
- 优先级: [P0/P1/P2/P3]
- 报告人: [姓名]
- 报告日期: [YYYY-MM-DD]

## 环境信息
- 测试环境: [环境]
- 浏览器/客户端: [版本]
- 测试版本: [版本号]

## 缺陷描述
[详细描述缺陷]

## 复现步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

## 预期结果
[预期的正确行为]

## 实际结果
[实际发生的行为]

## 附件
- 截图: [链接]
- 日志: [链接]
- 视频录像: [链接]

## 影响范围
[哪些功能或用户受影响]
```

---

## 附录

### A. 测试数据准备

#### 账户测试数据
```json
[
  {"userId": "user001", "initialBalance": 1000},
  {"userId": "user002", "initialBalance": 500},
  {"userId": "frozen_user", "initialBalance": 1000, "status": "frozen"},
  {"userId": "zero_user", "initialBalance": 0}
]
```

#### 空投测试数据
```json
[
  {
    "airdropId": "airdrop001",
    "name": "新年空投",
    "totalAmount": 10000,
    "perUserAmount": 100,
    "status": "active",
    "startTime": "2026-01-01",
    "endTime": "2026-12-31"
  }
]
```

#### 任务测试数据
```json
[
  {
    "taskId": "task001",
    "title": "每日签到",
    "reward": 10,
    "type": "daily",
    "status": "active",
    "maxCompletions": 0
  }
]
```

### B. 测试工具

- **单元测试**: Jest
- **集成测试**: Supertest
- **性能测试**: k6 / Artillery
- **安全测试**: OWASP ZAP
- **代码覆盖率**: Istanbul / Jest

### C. 参考资料

- [Jest 测试框架文档](https://jestjs.io/)
- [API 测试最佳实践](https://restfulapi.net/testing-rest-api-best-practices/)
- [性能测试指南](https://k6.io/docs/)

---

**文档变更历史**

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2026-03-01 | 测试工程师 | 初始版本 |

---

**审批记录**

| 角色 | 姓名 | 日期 | 状态 |
|------|------|------|------|
| 开发工程师 | - | - | 待审批 |
| 测试工程师 | - | 2026-03-01 | 已完成 |
| 开发总监 | - | - | 待审批 |
