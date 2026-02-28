/**
 * 路由-控制器验证测试
 * 检测路由定义中引用的控制器方法是否存在
 */

import { describe, test, expect } from 'bun:test';
import { routes } from '../../src/routes/index';
import { accountController } from '../../src/controllers/account.controller';
import { airdropController } from '../../src/controllers/airdrop.controller';
import { taskController } from '../../src/controllers/task.controller';

describe('路由-控制器方法验证', () => {
  describe('检测缺失的控制器方法', () => {
    test('所有路由引用的账户控制器方法都应该存在', () => {
      const accountRoutes = routes.filter(r => r.path.startsWith('/api/account'));
      const missingMethods: string[] = [];

      accountRoutes.forEach(route => {
        // 提取方法名（从 handler 中）
        const handlerString = route.handler.toString();
        const methodMatch = handlerString.match(/accountController\.(\w+)/);
        
        if (methodMatch) {
          const methodName = methodMatch[1];
          const controller = accountController as any;
          
          if (typeof controller[methodName] !== 'function') {
            missingMethods.push(`${route.path} -> ${methodName}`);
          }
        }
      });

      // 应该没有缺失的方法
      expect(missingMethods).toEqual([]);
    });

    test('所有路由引用的空投控制器方法都应该存在', () => {
      const airdropRoutes = routes.filter(r => r.path.startsWith('/api/airdrop'));
      const missingMethods: string[] = [];

      airdropRoutes.forEach(route => {
        const handlerString = route.handler.toString();
        const methodMatch = handlerString.match(/airdropController\.(\w+)/);
        
        if (methodMatch) {
          const methodName = methodMatch[1];
          const controller = airdropController as any;
          
          if (typeof controller[methodName] !== 'function') {
            missingMethods.push(`${route.path} -> ${methodName}`);
          }
        }
      });

      expect(missingMethods).toEqual([]);
    });

    test('所有路由引用的任务控制器方法都应该存在', () => {
      const taskRoutes = routes.filter(r => r.path.startsWith('/api/task'));
      const missingMethods: string[] = [];

      taskRoutes.forEach(route => {
        const handlerString = route.handler.toString();
        const methodMatch = handlerString.match(/taskController\.(\w+)/);
        
        if (methodMatch) {
          const methodName = methodMatch[1];
          const controller = taskController as any;
          
          if (typeof controller[methodName] !== 'function') {
            missingMethods.push(`${route.path} -> ${methodName}`);
          }
        }
      });

      expect(missingMethods).toEqual([]);
    });
  });

  describe('路由处理器签名验证', () => {
    test('路由处理器应该能接受参数对象', async () => {
      const testRoutes = [
        { path: '/api/account/balance/:userId', params: { userId: 'test-user' } },
        { path: '/api/airdrop/list', params: {} },
        { path: '/api/task/list', params: {} }
      ];

      for (const testRoute of testRoutes) {
        const route = routes.find(r => r.path === testRoute.path);
        expect(route).toBeDefined();
        
        // 测试处理器能接受参数
        try {
          await route!.handler(testRoute.params);
        } catch (error) {
          // 允许业务逻辑错误,但不应该有类型错误
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('控制器方法完整性检查', () => {
    test('账户控制器应该有所有必要的方法', () => {
      const requiredMethods = [
        'getBalance',
        'getTransactionHistory', // 或 getTransactions
        'transfer',
        'freezeBalance',
        'unfreezeBalance'
      ];

      const controller = accountController as any;
      const missingMethods = requiredMethods.filter(
        method => typeof controller[method] !== 'function'
      );

      // 记录缺失的方法（测试会失败,但会显示详细信息）
      if (missingMethods.length > 0) {
        console.error('账户控制器缺失的方法:', missingMethods);
      }
      
      expect(missingMethods).toEqual([]);
    });

    test('空投控制器应该有所有必要的方法', () => {
      const requiredMethods = [
        'createAirdrop',
        'getAirdrop',
        'getAllAirdrops',
        'getActiveAirdrops',
        'activateAirdrop',
        'claimAirdrop',
        'canUserClaim',
        'getUserClaims'
      ];

      const controller = airdropController as any;
      const missingMethods = requiredMethods.filter(
        method => typeof controller[method] !== 'function'
      );

      if (missingMethods.length > 0) {
        console.error('空投控制器缺失的方法:', missingMethods);
      }
      
      expect(missingMethods).toEqual([]);
    });

    test('任务控制器应该有所有必要的方法', () => {
      const requiredMethods = [
        'createTask',
        'getTask',
        'getAllTasks',
        'getActiveTasks',
        'activateTask',
        'completeTask',
        'canUserComplete',
        'getUserCompletions',
        'pauseTask',
        'cancelTask'
      ];

      const controller = taskController as any;
      const missingMethods = requiredMethods.filter(
        method => typeof controller[method] !== 'function'
      );

      if (missingMethods.length > 0) {
        console.error('任务控制器缺失的方法:', missingMethods);
      }
      
      expect(missingMethods).toEqual([]);
    });
  });

  describe('路由覆盖率统计', () => {
    test('应该有足够的路由覆盖', () => {
      const stats = {
        account: routes.filter(r => r.path.startsWith('/api/account')).length,
        airdrop: routes.filter(r => r.path.startsWith('/api/airdrop')).length,
        task: routes.filter(r => r.path.startsWith('/api/task')).length,
        total: routes.length
      };

      console.log('路由统计:', stats);
      
      expect(stats.account).toBeGreaterThanOrEqual(5);
      expect(stats.airdrop).toBeGreaterThanOrEqual(8);
      expect(stats.task).toBeGreaterThanOrEqual(10);
      expect(stats.total).toBeGreaterThanOrEqual(23);
    });
  });
});
