/**
 * 路由配置 - API 端点定义
 */

import { accountController } from '../controllers/account.controller';
import { airdropController } from '../controllers/airdrop.controller';
import { taskController } from '../controllers/task.controller';
import { freezeController } from '../controllers/freeze.controller';

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: (params: any) => any | Promise<any>;
  description: string;
}

export const routes: Route[] = [
  // ==================== 账户相关 ====================
  {
    method: 'GET',
    path: '/api/account/balance/:userId',
    handler: (params) => accountController.getBalance(params),
    description: '获取账户余额'
  },
  {
    method: 'GET',
    path: '/api/account/transactions/:userId',
    handler: (params) => accountController.getTransactions(params),
    description: '获取交易历史'
  },
  {
    method: 'POST',
    path: '/api/account/transfer',
    handler: (params) => accountController.transfer(params),
    description: '转账'
  },
  {
    method: 'POST',
    path: '/api/account/freeze',
    handler: (params) => accountController.freezeAccount(params),
    description: '冻结账户'
  },
  {
    method: 'POST',
    path: '/api/account/unfreeze',
    handler: (params) => accountController.unfreezeAccount(params),
    description: '解冻账户'
  },

  // ==================== 空投相关 ====================
  {
    method: 'POST',
    path: '/api/airdrop/create',
    handler: (params) => airdropController.createAirdrop(params),
    description: '创建空投活动'
  },
  {
    method: 'GET',
    path: '/api/airdrop/:airdropId',
    handler: (params) => airdropController.getAirdrop(params),
    description: '获取空投详情'
  },
  {
    method: 'GET',
    path: '/api/airdrop/list',
    handler: () => airdropController.getAllAirdrops(),
    description: '获取所有空投活动'
  },
  {
    method: 'GET',
    path: '/api/airdrop/active',
    handler: () => airdropController.getActiveAirdrops(),
    description: '获取活跃空投活动'
  },
  {
    method: 'POST',
    path: '/api/airdrop/activate/:airdropId',
    handler: (params) => airdropController.activateAirdrop(params),
    description: '激活空投'
  },
  {
    method: 'POST',
    path: '/api/airdrop/claim',
    handler: (params) => airdropController.claimAirdrop(params),
    description: '领取空投'
  },
  {
    method: 'GET',
    path: '/api/airdrop/can-claim/:airdropId/:userId',
    handler: (params) => airdropController.canUserClaim(params),
    description: '检查用户是否可领取空投'
  },
  {
    method: 'GET',
    path: '/api/airdrop/claims/:userId',
    handler: (params) => airdropController.getUserClaims(params),
    description: '获取用户领取记录'
  },

  // ==================== 任务相关 ====================
  {
    method: 'POST',
    path: '/api/task/create',
    handler: (params) => taskController.createTask(params),
    description: '创建任务'
  },
  {
    method: 'GET',
    path: '/api/task/:taskId',
    handler: (params) => taskController.getTask(params),
    description: '获取任务详情'
  },
  {
    method: 'GET',
    path: '/api/task/list',
    handler: () => taskController.getAllTasks(),
    description: '获取所有任务'
  },
  {
    method: 'GET',
    path: '/api/task/active',
    handler: () => taskController.getActiveTasks(),
    description: '获取活跃任务'
  },
  {
    method: 'POST',
    path: '/api/task/activate/:taskId',
    handler: (params) => taskController.activateTask(params),
    description: '激活任务'
  },
  {
    method: 'POST',
    path: '/api/task/complete',
    handler: (params) => taskController.completeTask(params),
    description: '完成任务'
  },
  {
    method: 'GET',
    path: '/api/task/can-complete/:taskId/:userId',
    handler: (params) => taskController.canUserComplete(params),
    description: '检查用户是否可完成任务'
  },
  {
    method: 'GET',
    path: '/api/task/completions/:userId',
    handler: (params) => taskController.getUserCompletions(params),
    description: '获取用户完成记录'
  },
  {
    method: 'POST',
    path: '/api/task/pause/:taskId',
    handler: (params) => taskController.pauseTask(params),
    description: '暂停任务'
  },
  {
    method: 'POST',
    path: '/api/task/cancel/:taskId',
    handler: (params) => taskController.cancelTask(params),
    description: '取消任务'
  },

  // ==================== 冻结相关 ====================
  {
    method: 'POST',
    path: '/api/freeze/apply',
    handler: (params) => freezeController.applyFreeze(params),
    description: '申请冻结'
  },
  {
    method: 'POST',
    path: '/api/freeze/approve',
    handler: (params) => freezeController.approveFreeze(params),
    description: '审核通过冻结'
  },
  {
    method: 'POST',
    path: '/api/freeze/reject',
    handler: (params) => freezeController.rejectFreeze(params),
    description: '审核拒绝冻结'
  },
  {
    method: 'POST',
    path: '/api/freeze/unfreeze',
    handler: (params) => freezeController.unfreeze(params),
    description: '解冻'
  },
  {
    method: 'GET',
    path: '/api/freeze/list',
    handler: (params) => freezeController.getFreezeList(params),
    description: '获取冻结记录列表'
  },
  {
    method: 'GET',
    path: '/api/freeze/:id',
    handler: (params) => freezeController.getFreezeById(params),
    description: '获取冻结记录详情'
  }
];

/**
 * 路由匹配器
 */
export function matchRoute(method: string, path: string): { route: Route; params: any } | null {
  for (const route of routes) {
    if (route.method !== method) {continue;}

    const routeParts = route.path.split('/');
    const pathParts = path.split('/');

    if (routeParts.length !== pathParts.length) {continue;}

    const params: any = {};
    let match = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].substring(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      return { route, params };
    }
  }

  return null;
}
