// 完整调试脚本 - 模拟测试流程
import { airdropModel } from './src/models/Airdrop';
import { airdropService } from './src/services/airdrop.service';
import { AirdropStatus } from './src/types';

async function test() {
  console.log('Step 1: Clearing data...');
  (airdropModel as any).airdrops.clear();
  (airdropModel as any).claims.clear();
  (airdropModel as any).userClaims.clear();
  (airdropModel as any).airdropMutexes.clear();

  console.log('Step 2: Creating airdrop...');
  const airdrop = airdropModel.createAirdrop({
    name: '测试空投',
    description: '测试',
    totalAmount: 100,
    perUserAmount: 10,
    startTime: new Date(Date.now() - 10000),
    endTime: new Date(Date.now() + 10000),
  });
  console.log('Airdrop created:', airdrop.id);

  console.log('Step 3: Activating airdrop...');
  airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

  console.log('Step 4: Claiming airdrop via service...');
  const startTime = Date.now();
  try {
    const result = await airdropService.claimAirdrop(airdrop.id, 'user1');
    console.log('Claim successful in', Date.now() - startTime, 'ms');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error claiming airdrop:', error);
  }
}

test()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
