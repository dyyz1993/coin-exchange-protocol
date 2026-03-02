/**
 * FreezeController 集成测试
 * 测试范围：冻结控制器的所有方法、参数验证、错误处理
 */

import { FreezeController } from '../../src/controllers/freeze.controller';
import { AccountService } from '../../src/services/account.service';
import { FreezeService } from '../../src/services/freeze.service';
import { AccountModel } from '../../src/models/Account';
import { TokenAccountModel } from '../../src/models/TokenAccount';
import { freezeModel } from '../../src/models/Freeze';
import { TransactionType } from '../../src/types';

describe('FreezeController Integration Tests', () => {
  let freezeController: FreezeController;
  let accountService: AccountService;
  let freezeService: FreezeService;

  beforeEach(() => {
    freezeController = new FreezeController();
    accountService = new AccountService();
    freezeService = new FreezeService();
    freezeService.initialize();

    // 清空所有测试数据
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
    (freezeModel as any).freezes.clear();
  });

  afterEach(() => {
    freezeService.stopAutoUnfreeze();

    // 清理所有测试数据
    (AccountModel as any).accounts.clear();
    (TokenAccountModel as any).tokenAccounts.clear();
    (freezeModel as any).freezes.clear();
  });

  describe('applyFreeze()', () => {
    test('应该成功申请冻结', async () => {
      const userId = 'freeze-user-001';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const result = await freezeController.applyFreeze({
        userId,
        amount: 500,
        reason: '测试冻结',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.amount).toBe(500);
    });

    test('应该拒绝无效的用户ID', async () => {
      const result = await freezeController.applyFreeze({
        userId: '',
        amount: 100,
        reason: '测试',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的用户ID');
    });

    test('应该拒绝无效的冻结金额', async () => {
      const userId = 'freeze-user-002';
      await accountService.createAccount(userId);

      const result = await freezeController.applyFreeze({
        userId,
        amount: -100,
        reason: '测试',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的冻结金额');
    });

    test('应该拒绝空的冻结原因', async () => {
      const userId = 'freeze-user-003';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const result = await freezeController.applyFreeze({
        userId,
        amount: 100,
        reason: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('冻结原因不能为空');
    });

    test('应该拒绝余额不足的冻结申请', async () => {
      const userId = 'freeze-user-004';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 100, TransactionType.REWARD, '初始奖励');

      const result = await freezeController.applyFreeze({
        userId,
        amount: 500,
        reason: '超额冻结',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('approveFreeze()', () => {
    test('应该成功审核通过冻结申请', async () => {
      const userId = 'approve-user-001';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      // 先申请冻结
      const applyResult = await freezeController.applyFreeze({
        userId,
        amount: 500,
        reason: '测试冻结',
      });

      expect(applyResult.success).toBe(true);
      const freezeId = applyResult.data?.id;

      // 审核通过
      const approveResult = await freezeController.approveFreeze({
        freezeId,
        approver: 'admin-001',
        comment: '审核通过',
      });

      expect(approveResult.success).toBe(true);
      expect(approveResult.data?.status).toBe('APPROVED');
    });

    test('应该拒绝无效的冻结ID', async () => {
      const result = await freezeController.approveFreeze({
        freezeId: '',
        approver: 'admin-001',
        comment: '测试',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的冻结ID');
    });

    test('应该拒绝无效的审核人ID', async () => {
      const result = await freezeController.approveFreeze({
        freezeId: 'freeze-001',
        approver: '',
        comment: '测试',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的审核人ID');
    });
  });

  describe('rejectFreeze()', () => {
    test('应该成功审核拒绝冻结申请', async () => {
      const userId = 'reject-user-001';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      // 先申请冻结
      const applyResult = await freezeController.applyFreeze({
        userId,
        amount: 500,
        reason: '测试冻结',
      });

      const freezeId = applyResult.data?.id;

      // 审核拒绝
      const rejectResult = await freezeController.rejectFreeze({
        freezeId,
        approver: 'admin-001',
        reason: '不符合冻结条件',
      });

      expect(rejectResult.success).toBe(true);
      expect(rejectResult.data?.status).toBe('REJECTED');
    });

    test('应该拒绝空的拒绝原因', async () => {
      const result = await freezeController.rejectFreeze({
        freezeId: 'freeze-001',
        approver: 'admin-001',
        reason: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('拒绝原因不能为空');
    });
  });

  describe('unfreeze()', () => {
    test('应该成功解冻', async () => {
      const userId = 'unfreeze-user-001';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      // 申请并审核通过
      const applyResult = await freezeController.applyFreeze({
        userId,
        amount: 500,
        reason: '测试冻结',
      });

      const freezeId = applyResult.data?.id;

      await freezeController.approveFreeze({
        freezeId,
        approver: 'admin-001',
        comment: '审核通过',
      });

      // 解冻
      const unfreezeResult = await freezeController.unfreeze({
        freezeId,
        operator: 'admin-001',
        reason: '解冻测试',
      });

      expect(unfreezeResult.success).toBe(true);
      expect(unfreezeResult.data?.status).toBe('UNFROZEN');
    });

    test('应该拒绝无效的冻结ID', async () => {
      const result = await freezeController.unfreeze({
        freezeId: '',
        operator: 'admin-001',
        reason: '测试',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的冻结ID');
    });

    test('应该拒绝空的操作人ID', async () => {
      const result = await freezeController.unfreeze({
        freezeId: 'freeze-001',
        operator: '',
        reason: '测试',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的操作人ID');
    });

    test('应该拒绝空的解冻原因', async () => {
      const result = await freezeController.unfreeze({
        freezeId: 'freeze-001',
        operator: 'admin-001',
        reason: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('解冻原因不能为空');
    });
  });

  describe('getFreezeList()', () => {
    test('应该成功获取冻结记录列表', async () => {
      const userId = 'list-user-001';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      // 创建多个冻结记录
      await freezeController.applyFreeze({
        userId,
        amount: 100,
        reason: '冻结1',
      });

      await freezeController.applyFreeze({
        userId,
        amount: 200,
        reason: '冻结2',
      });

      const result = await freezeController.getFreezeList({
        userId,
        page: 1,
        pageSize: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.items).toBeDefined();
      expect(result.data?.items.length).toBeGreaterThanOrEqual(2);
    });

    test('应该拒绝无效的分页参数 - page < 1', async () => {
      const result = await freezeController.getFreezeList({
        page: 0,
        pageSize: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的分页参数');
    });

    test('应该拒绝无效的分页参数 - pageSize > 100', async () => {
      const result = await freezeController.getFreezeList({
        page: 1,
        pageSize: 101,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的分页参数');
    });

    test('应该正确过滤用户ID', async () => {
      const userId1 = 'filter-user-001';
      const userId2 = 'filter-user-002';

      await accountService.createAccount(userId1);
      await accountService.createAccount(userId2);
      await accountService.addTokens(userId1, 1000, TransactionType.REWARD, '初始奖励');
      await accountService.addTokens(userId2, 1000, TransactionType.REWARD, '初始奖励');

      await freezeController.applyFreeze({
        userId: userId1,
        amount: 100,
        reason: '冻结1',
      });

      await freezeController.applyFreeze({
        userId: userId2,
        amount: 200,
        reason: '冻结2',
      });

      const result = await freezeController.getFreezeList({
        userId: userId1,
        page: 1,
        pageSize: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBe(1);
      expect(result.data?.items[0].userId).toBe(userId1);
    });
  });

  describe('getFreezeById()', () => {
    test('应该成功获取单个冻结记录', async () => {
      const userId = 'getbyid-user-001';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const applyResult = await freezeController.applyFreeze({
        userId,
        amount: 500,
        reason: '测试冻结',
      });

      const freezeId = applyResult.data?.id;

      const result = await freezeController.getFreezeById({ id: freezeId });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(freezeId);
      expect(result.data?.amount).toBe(500);
    });

    test('应该拒绝缺少冻结ID', async () => {
      const result = await freezeController.getFreezeById({ id: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少冻结ID');
    });

    test('应该返回错误当冻结记录不存在', async () => {
      const result = await freezeController.getFreezeById({ id: 'non-existent-id' });

      expect(result.success).toBe(false);
    });
  });

  describe('完整流程测试', () => {
    test('完整流程：申请 -> 审核 -> 解冻', async () => {
      const userId = 'full-flow-user-001';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      // 1. 申请冻结
      const applyResult = await freezeController.applyFreeze({
        userId,
        amount: 500,
        reason: '测试冻结申请',
      });

      expect(applyResult.success).toBe(true);
      const freezeId = applyResult.data?.id;

      // 2. 审核通过
      const approveResult = await freezeController.approveFreeze({
        freezeId,
        approver: 'admin-001',
        comment: '审核通过',
      });

      expect(approveResult.success).toBe(true);
      expect(approveResult.data?.status).toBe('APPROVED');

      // 3. 解冻
      const unfreezeResult = await freezeController.unfreeze({
        freezeId,
        operator: 'admin-001',
        reason: '测试解冻',
      });

      expect(unfreezeResult.success).toBe(true);
      expect(unfreezeResult.data?.status).toBe('UNFROZEN');
    });

    test('完整流程：申请 -> 拒绝', async () => {
      const userId = 'full-flow-user-002';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      // 1. 申请冻结
      const applyResult = await freezeController.applyFreeze({
        userId,
        amount: 500,
        reason: '测试冻结申请',
      });

      const freezeId = applyResult.data?.id;

      // 2. 审核拒绝
      const rejectResult = await freezeController.rejectFreeze({
        freezeId,
        approver: 'admin-001',
        reason: '不符合冻结条件',
      });

      expect(rejectResult.success).toBe(true);
      expect(rejectResult.data?.status).toBe('REJECTED');
    });
  });

  describe('边界情况测试', () => {
    test('处理 null 和 undefined 参数', async () => {
      const result1 = await freezeController.applyFreeze(null as any);
      expect(result1.success).toBe(false);

      const result2 = await freezeController.applyFreeze(undefined as any);
      expect(result2.success).toBe(false);
    });

    test('处理字符串类型的金额', async () => {
      const userId = 'edge-user-001';
      await accountService.createAccount(userId);

      const result = await freezeController.applyFreeze({
        userId,
        amount: '100' as any,
        reason: '测试',
      });

      expect(result.success).toBe(false);
    });

    test('处理超大金额', async () => {
      const userId = 'edge-user-002';
      await accountService.createAccount(userId);
      await accountService.addTokens(userId, 1000, TransactionType.REWARD, '初始奖励');

      const result = await freezeController.applyFreeze({
        userId,
        amount: Number.MAX_SAFE_INTEGER,
        reason: '超大金额',
      });

      expect(result.success).toBe(false);
    });
  });
});
