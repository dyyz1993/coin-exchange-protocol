/**
 * 空投超额领取修复测试
 * 验证 Issue #201 修复：确保额度耗尽时抛出异常
 */

import { airdropModel } from '../models/Airdrop';
import { airdropService } from '../services/airdrop.service';
import { AirdropStatus } from '../types';

describe('空投超额领取修复测试 (Issue #201)', () => {
  beforeEach(() => {
    // 清空所有数据
    (airdropModel as any).airdrops.clear();
    (airdropModel as any).claims.clear();
    (airdropModel as any).userClaims.clear();
    // 🔥 清空 mutex 状态（避免锁残留）
    (airdropModel as any).airdropMutexes.clear();
  });

  test('✅ 正常领取 - 额度充足时应成功', async () => {
    // 创建空投：总额100，每人10
    const airdrop = airdropModel.createAirdrop({
      name: '测试空投',
      description: '测试',
      totalAmount: 100,
      perUserAmount: 10,
      startTime: new Date(Date.now() - 10000),
      endTime: new Date(Date.now() + 10000),
    });

    // 激活空投
    airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

    // 用户1领取
    const result = await airdropService.claimAirdrop(airdrop.id, 'user1');
    expect(result.success).toBe(true);
    expect(result.amount).toBe(10);
    expect(result.newBalance).toBe(10);

    // 验证 claimedAmount 更新
    const updatedAirdrop = airdropModel.getAirdrop(airdrop.id);
    expect(updatedAirdrop?.claimedAmount).toBe(10);
  });

  test('❌ 超额领取 - 额度不足时应抛出异常', async () => {
    // 创建空投：总额20，每人10（只能2人领取）
    const airdrop = airdropModel.createAirdrop({
      name: '限额空投',
      description: '测试超额领取',
      totalAmount: 20,
      perUserAmount: 10,
      startTime: new Date(Date.now() - 10000),
      endTime: new Date(Date.now() + 10000),
    });

    // 激活空投
    airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

    // 用户1领取成功
    await airdropService.claimAirdrop(airdrop.id, 'user1');

    // 用户2领取成功
    await airdropService.claimAirdrop(airdrop.id, 'user2');

    // 验证 claimedAmount = 20
    const airdropAfter2Claims = airdropModel.getAirdrop(airdrop.id);
    expect(airdropAfter2Claims?.claimedAmount).toBe(20);

    // 🔥 关键测试：用户3尝试领取时应抛出异常
    await expect(airdropService.claimAirdrop(airdrop.id, 'user3')).rejects.toThrow(
      /空投金额已耗尽/
    );

    // 验证用户3的余额未增加
    const finalAirdrop = airdropModel.getAirdrop(airdrop.id);
    expect(finalAirdrop?.claimedAmount).toBe(20); // 仍然是20，没有超额
  });

  test('🔒 并发安全 - 防止多个用户同时领取导致超额', async () => {
    // 创建空投：总额15，每人10（理论上只能1人领取）
    const airdrop = airdropModel.createAirdrop({
      name: '并发测试空投',
      description: '测试并发领取',
      totalAmount: 15,
      perUserAmount: 10,
      startTime: new Date(Date.now() - 10000),
      endTime: new Date(Date.now() + 10000),
    });

    // 激活空投
    airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

    // 模拟并发领取（虽然JS是单线程，但这里测试逻辑正确性）
    const promises = [
      airdropService.claimAirdrop(airdrop.id, 'user1').catch((e) => e),
      airdropService.claimAirdrop(airdrop.id, 'user2').catch((e) => e),
    ];

    const results = await Promise.all(promises);

    // 至少有一个失败（因为额度只够1人）
    const successCount = results.filter((r) => !(r instanceof Error)).length;
    const failCount = results.filter((r) => r instanceof Error).length;

    expect(successCount).toBe(1);
    expect(failCount).toBe(1);

    // 验证最终额度正确
    const finalAirdrop = airdropModel.getAirdrop(airdrop.id);
    expect(finalAirdrop?.claimedAmount).toBe(10); // 只有10，没有超额
  });

  test('📊 数据一致性 - Service 和 Model 的额度数据应一致', async () => {
    // 创建空投
    const airdrop = airdropModel.createAirdrop({
      name: '一致性测试',
      description: '测试数据一致性',
      totalAmount: 100,
      perUserAmount: 10,
      startTime: new Date(Date.now() - 10000),
      endTime: new Date(Date.now() + 10000),
    });

    airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

    // 多个用户领取
    for (let i = 1; i <= 5; i++) {
      await airdropService.claimAirdrop(airdrop.id, `user${i}`);
    }

    // 验证 claimedAmount 和实际领取记录一致
    const finalAirdrop = airdropModel.getAirdrop(airdrop.id);
    const claims = airdropModel.getAirdropClaims(airdrop.id);
    const totalClaimedFromRecords = claims.reduce((sum, claim) => sum + claim.amount, 0);

    expect(finalAirdrop?.claimedAmount).toBe(50);
    expect(totalClaimedFromRecords).toBe(50);
    expect(finalAirdrop?.claimedAmount).toBe(totalClaimedFromRecords);
  });
});
