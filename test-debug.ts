// 简单调试脚本
import { AirdropModel } from './src/models/Airdrop';
import { AirdropStatus } from './src/types';

async function test() {
  console.log('Creating airdrop model...');
  const airdropModel = new AirdropModel();

  console.log('Creating airdrop...');
  const airdrop = airdropModel.createAirdrop({
    name: '测试空投',
    description: '测试',
    totalAmount: 100,
    perUserAmount: 10,
    startTime: new Date(Date.now() - 10000),
    endTime: new Date(Date.now() + 10000),
  });
  console.log('Airdrop created:', airdrop.id);

  console.log('Activating airdrop...');
  airdropModel.updateAirdropStatus(airdrop.id, AirdropStatus.ACTIVE);

  console.log('Creating claim...');
  const startTime = Date.now();
  try {
    const claim = await airdropModel.createClaim(airdrop.id, 'user1', 10);
    console.log('Claim created successfully in', Date.now() - startTime, 'ms');
    console.log('Claim:', claim);
  } catch (error) {
    console.error('Error creating claim:', error);
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
