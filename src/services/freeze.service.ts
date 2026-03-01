/**
 * 冻结服务 - 交易冻结机制核心业务逻辑
 */

import { freezeModel } from '../models/Freeze';
import { accountModel } from '../models/Account';
import {
  FreezeRecord,
  FreezeType,
  FreezeStatus,
  FREEZE_CONFIG,
  FreezeStatusResponse,
  FreezeListQuery,
} from '../types';
import { TransactionType } from '../types';

export class FreezeService {
  private autoUnfreezeTimer?: NodeJS.Timeout;

  /**
   * 初始化服务，启动自动解冻定时任务
   */
  initialize() {
    this.startAutoUnfreeze();
  }

  /**
   * 启动自动解冻定时任务
   */
  private startAutoUnfreeze() {
    // 清除之前的定时器
    if (this.autoUnfreezeTimer) {
      clearInterval(this.autoUnfreezeTimer);
    }

    // 设置定时任务
    this.autoUnfreezeTimer = setInterval(() => {
      this.autoUnfreezeExpired();
    }, FREEZE_CONFIG.AUTO_UNFREEZE_INTERVAL);

    console.log(
      `✅ 自动解冻定时任务已启动，检查间隔: ${FREEZE_CONFIG.AUTO_UNFREEZE_INTERVAL / 1000}秒`
    );
  }

  /**
   * 停止自动解冻定时任务
   */
  stopAutoUnfreeze() {
    if (this.autoUnfreezeTimer) {
      clearInterval(this.autoUnfreezeTimer);
      this.autoUnfreezeTimer = undefined;
      console.log('⏹️ 自动解冻定时任务已停止');
    }
  }

  /**
   * 创建初始冻结（交易确认阶段，5分钟）
   */
  async createInitialFreeze(params: {
    userId: string;
    amount: number;
    transactionId: string;
    remark?: string;
  }): Promise<FreezeRecord> {
    const account = accountModel.getAccountByUserId(params.userId);
    if (!account) {
      throw new Error('用户账户不存在');
    }

    // 检查是否有足够的可用余额
    const available = this.getAvailableBalance(params.userId);
    if (available < params.amount) {
      throw new Error(`余额不足，可用余额: ${available}, 需要: ${params.amount}`);
    }

    // 创建冻结记录
    const freeze = freezeModel.createFreeze({
      userId: params.userId,
      amount: params.amount,
      type: FreezeType.INITIAL,
      transactionId: params.transactionId,
      remark: params.remark || '交易初始冻结',
    });

    // 执行账户冻结
    await accountModel.freezeBalance(params.userId, params.amount);

    return freeze;
  }

  /**
   * 创建争议冻结（客服介入阶段，30分钟）
   */
  async createDisputeFreeze(params: {
    userId: string;
    amount: number;
    transactionId: string;
    remark?: string;
  }): Promise<FreezeRecord> {
    const account = accountModel.getAccountByUserId(params.userId);
    if (!account) {
      throw new Error('用户账户不存在');
    }

    // 创建冻结记录
    const freeze = freezeModel.createFreeze({
      userId: params.userId,
      amount: params.amount,
      type: FreezeType.DISPUTE,
      transactionId: params.transactionId,
      remark: params.remark || '争议冻结',
    });

    // 执行账户冻结
    await accountModel.freezeBalance(params.userId, params.amount);

    return freeze;
  }

  /**
   * 解冻
   */
  async unfreeze(freezeId: string, reason?: string): Promise<FreezeRecord> {
    const freeze = freezeModel.getFreeze(freezeId);
    if (!freeze) {
      throw new Error('冻结记录不存在');
    }

    if (freeze.status !== FreezeStatus.FROZEN) {
      throw new Error('冻结已失效或已解冻');
    }

    // 执行模型层的解冻
    const result = freezeModel.unfreeze(freezeId, reason);

    // 执行账户解冻
    await accountModel.unfreezeBalance(freeze.userId, freeze.amount);

    return result;
  }

  /**
   * 手动解冻（指定原因）
   */
  async manualUnfreeze(freezeId: string, reason: string): Promise<FreezeRecord> {
    return await this.unfreeze(freezeId, reason);
  }

  /**
   * 自动解冻过期的冻结记录
   */
  async autoUnfreezeExpired(): Promise<
    Array<{ freeze: FreezeRecord; success: boolean; error?: string }>
  > {
    const results: Array<{ freeze: FreezeRecord; success: boolean; error?: string }> = [];
    const expiredFreezes = freezeModel.getExpiredFreezes();

    console.log(`🔄 开始自动解冻过期冻结记录，共 ${expiredFreezes.length} 条`);

    for (const freeze of expiredFreezes) {
      try {
        const result = await this.unfreeze(freeze.id, '自动解冻：过期');
        results.push({ freeze: result, success: true });
        console.log(`✅ 自动解冻成功: ${freeze.id}, 金额: ${freeze.amount}`);
      } catch (error) {
        results.push({
          freeze,
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
        });
        console.error(`❌ 自动解冻失败: ${freeze.id}`, error);
      }
    }

    return results;
  }

  /**
   * 查询冻结状态
   */
  getFreezeStatus(freezeId: string): FreezeStatusResponse {
    const freeze = freezeModel.getFreeze(freezeId);
    if (!freeze) {
      throw new Error('冻结记录不存在');
    }

    const now = new Date();
    const remainingTime =
      freeze.status === FreezeStatus.FROZEN && freeze.expiresAt > now
        ? freeze.expiresAt.getTime() - now.getTime()
        : 0;

    return {
      freezeId: freeze.id,
      userId: freeze.userId,
      amount: freeze.amount,
      type: freeze.type,
      status: freeze.status,
      frozenAt: freeze.frozenAt,
      expiresAt: freeze.expiresAt,
      remainingTime,
    };
  }

  /**
   * 查询用户冻结列表
   */
  getUserFreezes(userId: string, status?: FreezeStatus): FreezeRecord[] {
    const freezes = freezeModel.getUserFreezes(userId);

    if (status) {
      return freezes.filter((freeze) => freeze.status === status);
    }

    return freezes;
  }

  /**
   * 查询用户活跃冻结
   */
  getActiveFreezes(userId: string): FreezeRecord[] {
    return freezeModel.getActiveFreezes(userId);
  }

  /**
   * 根据交易ID查询冻结记录
   */
  getFreezeByTransactionId(transactionId: string): FreezeRecord | undefined {
    return freezeModel.getFreezeByTransactionId(transactionId);
  }

  /**
   * 获取用户可用余额（考虑冻结金额）
   *
   * 修复：冻结时 accountModel.freezeBalance() 已经从 balance 中扣除并转移到 frozenBalance
   * 所以 account.balance 已经是可用余额，不需要再减去冻结金额
   */
  getAvailableBalance(userId: string): number {
    const account = accountModel.getAccountByUserId(userId);
    if (!account) {
      return 0;
    }

    // account.balance 已经是可用余额（冻结时已扣除）
    return account.balance;
  }

  /**
   * 检查是否可以冻结
   */
  canFreeze(userId: string, amount: number): boolean {
    const available = this.getAvailableBalance(userId);
    return available >= amount;
  }

  /**
   * 获取冻结统计
   */
  getFreezeStats() {
    return freezeModel.getFreezeStats();
  }

  /**
   * 获取所有活跃冻结记录（官方平台查看）
   */
  getAllActiveFreezes(): FreezeRecord[] {
    return freezeModel.getAllActiveFreezes();
  }

  /**
   * 延长冻结时间（争议场景）
   */
  extendFreeze(freezeId: string, durationMinutes: number): FreezeRecord {
    const freeze = freezeModel.getFreeze(freezeId);
    if (!freeze) {
      throw new Error('冻结记录不存在');
    }

    if (freeze.status !== FreezeStatus.FROZEN) {
      throw new Error('冻结已失效或已解冻');
    }

    // 直接修改模型的 expiresAt（注意：这需要模型支持，或者使用特殊方法）
    const newExpiresAt = new Date(freeze.expiresAt.getTime() + durationMinutes * 60 * 1000);

    // 由于模型没有公开设置 expiresAt 的方法，我们需要通过重新创建或修改模型来实现
    // 这里我们创建一个新的冻结记录来替换旧的
    // 更好的方式是扩展模型功能

    throw new Error('需要扩展模型以支持延长冻结时间');
  }

  /**
   * 批量解冻用户的指定冻结记录
   */
  async unfreezeMultiple(
    freezeIds: string[],
    reason?: string
  ): Promise<Array<{ freezeId: string; success: boolean; error?: string }>> {
    const results: Array<{ freezeId: string; success: boolean; error?: string }> = [];

    for (const freezeId of freezeIds) {
      try {
        await this.unfreeze(freezeId, reason);
        results.push({ freezeId, success: true });
      } catch (error) {
        results.push({
          freezeId,
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return results;
  }
}

// 导出单例
export const freezeService = new FreezeService();
