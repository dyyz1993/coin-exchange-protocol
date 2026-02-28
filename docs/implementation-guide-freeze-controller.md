# FreezeController 实施指南

## 📋 任务概述

**目标：** 创建 `src/controllers/freeze.controller.ts`，实现完整的冻结管理功能

**当前状态：**
- 文件不存在
- 需要从零创建

---

## 🔧 实施步骤

### 步骤 1：创建文件

```bash
touch src/controllers/freeze.controller.ts
```

### 步骤 2：编写基础结构

```typescript
/**
 * 冻结控制器 - 处理账户冻结相关的HTTP请求
 */

import { freezeService } from '../services/freeze.service';
import { ApiResponse } from '../types';

export class FreezeController {
  // 方法将在这里添加
}

export const freezeController = new FreezeController();
```

### 步骤 3：添加完整的方法

#### 3.1 申请冻结

```typescript
/**
 * 申请冻结
 * POST /api/freeze/apply
 * Body: { userId: string, amount: number, reason: string }
 */
async applyFreeze(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { userId, amount, reason } = body;
    
    // 输入验证
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: '无效的用户ID' };
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return { success: false, error: '无效的冻结金额' };
    }
    
    if (!reason || typeof reason !== 'string') {
      return { success: false, error: '冻结原因不能为空' };
    }
    
    // 调用服务层
    return freezeService.applyFreeze(userId, amount, reason);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '申请冻结失败' 
    };
  }
}
```

#### 3.2 审核通过

```typescript
/**
 * 审核通过
 * POST /api/freeze/approve
 * Body: { freezeId: string, approver: string, comment?: string }
 */
async approveFreeze(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { freezeId, approver, comment } = body;
    
    // 输入验证
    if (!freezeId || typeof freezeId !== 'string') {
      return { success: false, error: '无效的冻结ID' };
    }
    
    if (!approver || typeof approver !== 'string') {
      return { success: false, error: '无效的审核人ID' };
    }
    
    // 调用服务层
    return freezeService.approveFreeze(freezeId, approver, comment);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '审核失败' 
    };
  }
}
```

#### 3.3 审核拒绝

```typescript
/**
 * 审核拒绝
 * POST /api/freeze/reject
 * Body: { freezeId: string, approver: string, reason: string }
 */
async rejectFreeze(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { freezeId, approver, reason } = body;
    
    // 输入验证
    if (!freezeId || typeof freezeId !== 'string') {
      return { success: false, error: '无效的冻结ID' };
    }
    
    if (!approver || typeof approver !== 'string') {
      return { success: false, error: '无效的审核人ID' };
    }
    
    if (!reason || typeof reason !== 'string') {
      return { success: false, error: '拒绝原因不能为空' };
    }
    
    // 调用服务层
    return freezeService.rejectFreeze(freezeId, approver, reason);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '审核失败' 
    };
  }
}
```

#### 3.4 解冻

```typescript
/**
 * 解冻
 * POST /api/freeze/unfreeze
 * Body: { freezeId: string, operator: string, reason: string }
 */
async unfreeze(req: Request): Promise<ApiResponse> {
  try {
    const body = await req.json();
    const { freezeId, operator, reason } = body;
    
    // 输入验证
    if (!freezeId || typeof freezeId !== 'string') {
      return { success: false, error: '无效的冻结ID' };
    }
    
    if (!operator || typeof operator !== 'string') {
      return { success: false, error: '无效的操作人ID' };
    }
    
    if (!reason || typeof reason !== 'string') {
      return { success: false, error: '解冻原因不能为空' };
    }
    
    // 调用服务层
    return freezeService.unfreeze(freezeId, operator, reason);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '解冻失败' 
    };
  }
}
```

#### 3.5 查询冻结记录列表

```typescript
/**
 * 查询冻结记录列表
 * GET /api/freeze/list?userId=xxx&status=xxx&page=1&pageSize=10
 */
async getFreezeList(req: Request): Promise<ApiResponse> {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    // 输入验证
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return { success: false, error: '无效的分页参数' };
    }
    
    // 调用服务层
    return freezeService.getFreezeList({ userId, status, page, pageSize });
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '查询失败' 
    };
  }
}
```

#### 3.6 查询单个冻结记录

```typescript
/**
 * 查询单个冻结记录
 * GET /api/freeze/:id
 */
async getFreezeById(req: Request): Promise<ApiResponse> {
  try {
    const url = new URL(req.url);
    const freezeId = url.pathname.split('/').pop();
    
    if (!freezeId) {
      return { success: false, error: '缺少冻结ID' };
    }
    
    // 调用服务层
    return freezeService.getFreezeById(freezeId);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '查询失败' 
    };
  }
}
```

---

## 📄 完整文件模板

```typescript
/**
 * 冻结控制器 - 处理账户冻结相关的HTTP请求
 */

import { freezeService } from '../services/freeze.service';
import { ApiResponse } from '../types';

export class FreezeController {
  /**
   * 申请冻结
   * POST /api/freeze/apply
   */
  async applyFreeze(req: Request): Promise<ApiResponse> {
    try {
      const body = await req.json();
      const { userId, amount, reason } = body;
      
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: '无效的用户ID' };
      }
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return { success: false, error: '无效的冻结金额' };
      }
      
      if (!reason || typeof reason !== 'string') {
        return { success: false, error: '冻结原因不能为空' };
      }
      
      return freezeService.applyFreeze(userId, amount, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '申请冻结失败' 
      };
    }
  }

  /**
   * 审核通过
   * POST /api/freeze/approve
   */
  async approveFreeze(req: Request): Promise<ApiResponse> {
    try {
      const body = await req.json();
      const { freezeId, approver, comment } = body;
      
      if (!freezeId || typeof freezeId !== 'string') {
        return { success: false, error: '无效的冻结ID' };
      }
      
      if (!approver || typeof approver !== 'string') {
        return { success: false, error: '无效的审核人ID' };
      }
      
      return freezeService.approveFreeze(freezeId, approver, comment);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '审核失败' 
      };
    }
  }

  /**
   * 审核拒绝
   * POST /api/freeze/reject
   */
  async rejectFreeze(req: Request): Promise<ApiResponse> {
    try {
      const body = await req.json();
      const { freezeId, approver, reason } = body;
      
      if (!freezeId || typeof freezeId !== 'string') {
        return { success: false, error: '无效的冻结ID' };
      }
      
      if (!approver || typeof approver !== 'string') {
        return { success: false, error: '无效的审核人ID' };
      }
      
      if (!reason || typeof reason !== 'string') {
        return { success: false, error: '拒绝原因不能为空' };
      }
      
      return freezeService.rejectFreeze(freezeId, approver, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '审核失败' 
      };
    }
  }

  /**
   * 解冻
   * POST /api/freeze/unfreeze
   */
  async unfreeze(req: Request): Promise<ApiResponse> {
    try {
      const body = await req.json();
      const { freezeId, operator, reason } = body;
      
      if (!freezeId || typeof freezeId !== 'string') {
        return { success: false, error: '无效的冻结ID' };
      }
      
      if (!operator || typeof operator !== 'string') {
        return { success: false, error: '无效的操作人ID' };
      }
      
      if (!reason || typeof reason !== 'string') {
        return { success: false, error: '解冻原因不能为空' };
      }
      
      return freezeService.unfreeze(freezeId, operator, reason);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '解冻失败' 
      };
    }
  }

  /**
   * 查询冻结记录列表
   * GET /api/freeze/list
   */
  async getFreezeList(req: Request): Promise<ApiResponse> {
    try {
      const url = new URL(req.url);
      const userId = url.searchParams.get('userId') || undefined;
      const status = url.searchParams.get('status') || undefined;
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
      
      if (page < 1 || pageSize < 1 || pageSize > 100) {
        return { success: false, error: '无效的分页参数' };
      }
      
      return freezeService.getFreezeList({ userId, status, page, pageSize });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '查询失败' 
      };
    }
  }

  /**
   * 查询单个冻结记录
   * GET /api/freeze/:id
   */
  async getFreezeById(req: Request): Promise<ApiResponse> {
    try {
      const url = new URL(req.url);
      const freezeId = url.pathname.split('/').pop();
      
      if (!freezeId) {
        return { success: false, error: '缺少冻结ID' };
      }
      
      return freezeService.getFreezeById(freezeId);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '查询失败' 
      };
    }
  }
}

export const freezeController = new FreezeController();
```

---

## ✅ 验收标准

完成后，文件应满足以下标准：

1. **文件已创建：** `src/controllers/freeze.controller.ts`
2. **文件大小：** > 2500 bytes
3. **方法数量：** 6 个
4. **每个方法都有：**
   - JSDoc 注释
   - 输入验证
   - 错误处理（try-catch）
   - 返回 ApiResponse 类型
5. **导出：** `freezeController` 实例

---

## 🧪 测试方法

```bash
# 1. 申请冻结
curl -X POST http://localhost:3000/api/freeze/apply \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001", "amount": 100, "reason": "争议处理"}'

# 2. 查询冻结列表
curl "http://localhost:3000/api/freeze/list?userId=user001&status=pending"

# 3. 审核通过
curl -X POST http://localhost:3000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"freezeId": "freeze001", "approver": "admin001", "comment": "审核通过"}'

# 4. 解冻
curl -X POST http://localhost:3000/api/freeze/unfreeze \
  -H "Content-Type: application/json" \
  -d '{"freezeId": "freeze001", "operator": "admin001", "reason": "争议已解决"}'
```

---

## 📝 提交代码

```bash
# 1. 查看修改
git status

# 2. 提交代码
git add src/controllers/freeze.controller.ts
git commit -m "feat: 创建 FreezeController - 实现完整的冻结管理功能

- 添加 applyFreeze 方法
- 添加 approveFreeze 方法
- 添加 rejectFreeze 方法
- 添加 unfreeze 方法
- 添加 getFreezeList 方法
- 添加 getFreezeById 方法
- 所有方法都有输入验证和错误处理"

# 3. 推送到远程
git push origin feature/your-branch-name
```

---

## ❓ 常见问题

### Q1: freezeService 不存在怎么办？

**A:** 检查 `src/services/freeze.service.ts` 是否存在。如果不存在，需要先创建 Service 层。

### Q2: 如何测试这个控制器？

**A:** 可以先创建简单的测试脚本：

```typescript
// test-freeze-controller.ts
import { freezeController } from './src/controllers/freeze.controller';

// 模拟 Request 对象
const mockRequest = (body: any) => ({
  json: async () => body,
  url: 'http://localhost:3000/api/freeze/apply'
}) as Request;

// 测试
freezeController.applyFreeze(mockRequest({
  userId: 'user001',
  amount: 100,
  reason: '测试冻结'
})).then(console.log);
```

---

## 🎯 完成标志

当您完成此任务后，请确认：

- [ ] 文件已创建：src/controllers/freeze.controller.ts
- [ ] 文件大小 > 2500 bytes
- [ ] 所有 6 个方法都已实现
- [ ] 代码已提交到 Git
- [ ] 代码已推送到远程分支
- [ ] 已创建 Pull Request

---

**预计完成时间：** 10-15 分钟
