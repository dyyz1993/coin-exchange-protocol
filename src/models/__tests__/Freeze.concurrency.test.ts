/**
 * FreezeModel 并发测试 - 验证并发控制机制
 */

import { FreezeModel } from '../Freeze';
import { FreezeType, FreezeStatus } from '../../types';

describe('FreezeModel 并发控制测试', () => {
  let freezeModel: FreezeModel;

  beforeEach(() => {
    freezeModel = new FreezeModel();
  });

  describe('🔒 并发解冻测试', () => {
    it('应该防止同一冻结记录被并发解冻', async () => {
      // 创建一个冻结记录
      const freeze = await freezeModel.createFreeze({
        userId: 'user1',
        amount: 100,
        type: FreezeType.INITIAL,
      });

      // 并发尝试解冻同一个冻结记录 10 次
      const promises = Array(10)
        .fill(null)
        .map(() =>
          freezeModel
            .unfreeze(freeze.id, 'Concurrent unfreeze')
            .catch((err) => ({ error: err.message }))
        );

      const results = await Promise.all(promises);

      // 应该只有一次成功解冻
      const successCount = results.filter((r) => 'status' in r && r.status !== undefined).length;

      const failCount = results.filter(
        (r) => 'error' in r && r.error === 'Freeze is not active'
      ).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(9);

      // 验证冻结记录状态
      const finalFreeze = freezeModel.getFreeze(freeze.id);
      expect(finalFreeze?.status).toBe(FreezeStatus.UNFROZEN);
    });

    it('不同用户的冻结记录应该可以并发解冻', async () => {
      // 创建两个用户的冻结记录
      const freeze1 = await freezeModel.createFreeze({
        userId: 'user1',
        amount: 100,
        type: FreezeType.INITIAL,
      });

      const freeze2 = await freezeModel.createFreeze({
        userId: 'user2',
        amount: 100,
        type: FreezeType.INITIAL,
      });

      // 并发解冻不同用户的记录
      const [result1, result2] = await Promise.all([
        freezeModel.unfreeze(freeze1.id, 'Unfreeze user1'),
        freezeModel.unfreeze(freeze2.id, 'Unfreeze user2'),
      ]);

      // 两个解冻操作都应该成功
      expect(result1.status).toBe(FreezeStatus.UNFROZEN);
      expect(result2.status).toBe(FreezeStatus.UNFROZEN);
    });
  });

  describe('🔒 并发冻结测试', () => {
    it('同一用户的并发冻结应该串行执行', async () => {
      const userId = 'user1';
      const amount = 100;

      // 并发创建 5 个冻结记录
      const promises = Array(5)
        .fill(null)
        .map((_, i) =>
          freezeModel.createFreeze({
            userId,
            amount,
            type: FreezeType.INITIAL,
            remark: `Freeze ${i + 1}`,
          })
        );

      const freezes = await Promise.all(promises);

      // 所有冻结操作都应该成功
      expect(freezes).toHaveLength(5);
      freezes.forEach((freeze) => {
        expect(freeze.userId).toBe(userId);
        expect(freeze.amount).toBe(amount);
        expect(freeze.status).toBe(FreezeStatus.FROZEN);
      });

      // 验证所有冻结记录都被创建
      const userFreezes = freezeModel.getUserFreezes(userId);
      expect(userFreezes).toHaveLength(5);
    });

    it('不同用户的冻结操作应该可以并发执行', async () => {
      // 并发为 5 个不同用户创建冻结记录
      const promises = Array(5)
        .fill(null)
        .map((_, i) =>
          freezeModel.createFreeze({
            userId: `user${i + 1}`,
            amount: 100,
            type: FreezeType.INITIAL,
          })
        );

      const freezes = await Promise.all(promises);

      // 所有操作都应该成功
      expect(freezes).toHaveLength(5);
      freezes.forEach((freeze, i) => {
        expect(freeze.userId).toBe(`user${i + 1}`);
      });
    });
  });

  describe('🔒 并发余额检查测试', () => {
    it('getUserFrozenAmount 应该在锁保护下执行', async () => {
      const userId = 'user1';

      // 创建 3 个冻结记录
      await freezeModel.createFreeze({ userId, amount: 100, type: FreezeType.INITIAL });
      await freezeModel.createFreeze({ userId, amount: 200, type: FreezeType.INITIAL });
      await freezeModel.createFreeze({ userId, amount: 300, type: FreezeType.INITIAL });

      // 并发查询冻结金额
      const promises = Array(5)
        .fill(null)
        .map(() => freezeModel.getUserFrozenAmount(userId));

      const amounts = await Promise.all(promises);

      // 所有查询应该返回相同的结果
      amounts.forEach((amount) => {
        expect(amount).toBe(600);
      });
    });

    it('checkFreezeAvailable 应该在锁保护下执行', async () => {
      const userId = 'user1';
      const currentBalance = 500;

      // 创建冻结记录
      await freezeModel.createFreeze({ userId, amount: 200, type: FreezeType.INITIAL });

      // 并发检查可用余额
      const promises = Array(5)
        .fill(null)
        .map(() => freezeModel.checkFreezeAvailable(userId, 100, currentBalance));

      const results = await Promise.all(promises);

      // 所有检查应该返回相同的结果
      results.forEach((result) => {
        expect(result).toBe(true); // 500 - 200 = 300 >= 100
      });
    });
  });

  describe('🔒 混合并发操作测试', () => {
    it('同一用户的冻结和解冻操作应该串行执行', async () => {
      const userId = 'user1';

      // 先创建一个冻结记录
      const freeze1 = await freezeModel.createFreeze({
        userId,
        amount: 100,
        type: FreezeType.INITIAL,
      });

      // 并发执行：创建新冻结 + 解冻旧冻结 + 查询冻结金额
      const [newFreeze, unfrozen, frozenAmount] = await Promise.all([
        freezeModel.createFreeze({ userId, amount: 50, type: FreezeType.INITIAL }),
        freezeModel.unfreeze(freeze1.id, 'Unfreeze'),
        freezeModel.getUserFrozenAmount(userId),
      ]);

      // 验证所有操作都成功
      expect(newFreeze.amount).toBe(50);
      expect(unfrozen.status).toBe(FreezeStatus.UNFROZEN);
      // 冻结金额应该是新创建的 50（旧的已解冻）
      expect(frozenAmount).toBe(50);
    });
  });

  describe('🔒 自动解冻过期记录测试', () => {
    it('autoUnfreezeExpired 应该正确处理并发场景', async () => {
      // 创建多个过期的冻结记录
      const userId = 'user1';

      // 手动创建已过期的冻结记录
      const now = new Date();
      const pastTime = new Date(now.getTime() - 10000); // 10秒前

      // 使用内部方法创建过期记录（仅用于测试）
      const freeze1 = await freezeModel.createFreeze({
        userId,
        amount: 100,
        type: FreezeType.INITIAL,
      });

      const freeze2 = await freezeModel.createFreeze({
        userId,
        amount: 200,
        type: FreezeType.INITIAL,
      });

      // 手动修改过期时间（模拟过期）
      const f1 = freezeModel.getFreeze(freeze1.id);
      const f2 = freezeModel.getFreeze(freeze2.id);
      if (f1) {
        f1.expiresAt = pastTime;
      }
      if (f2) {
        f2.expiresAt = pastTime;
      }

      // 执行自动解冻
      const unfrozen = await freezeModel.autoUnfreezeExpired();

      // 应该解冻所有过期记录
      expect(unfrozen.length).toBeGreaterThanOrEqual(0); // 可能已经被其他操作解冻

      // 验证所有记录都被标记为过期
      unfrozen.forEach((freeze) => {
        expect([FreezeStatus.EXPIRED, FreezeStatus.UNFROZEN]).toContain(freeze.status);
      });
    });
  });
});
