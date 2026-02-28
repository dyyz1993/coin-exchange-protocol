/**
 * 基础交易示例
 * 演示如何使用 JavaScript SDK 进行基础交易操作
 */

const { CoinExchangeClient } = require('@coin-exchange/sdk');

// 初始化客户端
const client = new CoinExchangeClient({
  apiKey: process.env.COIN_EXCHANGE_API_KEY,
  apiSecret: process.env.COIN_EXCHANGE_API_SECRET,
  environment: 'sandbox', // 生产环境改为 'production'
});

/**
 * 查询账户余额
 */
async function checkBalance() {
  try {
    console.log('📊 查询账户余额...');
    const balance = await client.account.getBalance();
    
    console.log('\n可用资产:');
    balance.assets.forEach(asset => {
      if (parseFloat(asset.available) > 0) {
        console.log(`  ${asset.symbol}: ${asset.available} (冻结: ${asset.frozen})`);
      }
    });
    
    return balance;
  } catch (error) {
    console.error('❌ 查询余额失败:', error.message);
    throw error;
  }
}

/**
 * 查询市场行情
 */
async function getMarketPrice(symbol) {
  try {
    console.log(`\n📈 查询 ${symbol} 行情...`);
    const ticker = await client.public.getTicker(symbol);
    
    console.log(`  最新价: ${ticker.lastPrice}`);
    console.log(`  24h 最高: ${ticker.high24h}`);
    console.log(`  24h 最低: ${ticker.low24h}`);
    console.log(`  24h 涨跌: ${ticker.priceChangePercent}%`);
    
    return ticker;
  } catch (error) {
    console.error('❌ 查询行情失败:', error.message);
    throw error;
  }
}

/**
 * 创建限价买单
 */
async function placeBuyOrder(symbol, quantity, price) {
  try {
    console.log(`\n📝 创建限价买单...`);
    console.log(`  交易对: ${symbol}`);
    console.log(`  数量: ${quantity}`);
    console.log(`  价格: ${price}`);
    
    const order = await client.trade.createOrder({
      symbol,
      side: 'BUY',
      type: 'LIMIT',
      quantity,
      price,
      clientOrderId: `buy-${Date.now()}`,
    });
    
    console.log(`\n✅ 订单创建成功！`);
    console.log(`  订单ID: ${order.orderId}`);
    console.log(`  状态: ${order.status}`);
    
    return order;
  } catch (error) {
    console.error('❌ 创建订单失败:', error.message);
    if (error.code) {
      console.error('  错误码:', error.code);
    }
    throw error;
  }
}

/**
 * 创建限价卖单
 */
async function placeSellOrder(symbol, quantity, price) {
  try {
    console.log(`\n📝 创建限价卖单...`);
    console.log(`  交易对: ${symbol}`);
    console.log(`  数量: ${quantity}`);
    console.log(`  价格: ${price}`);
    
    const order = await client.trade.createOrder({
      symbol,
      side: 'SELL',
      type: 'LIMIT',
      quantity,
      price,
      clientOrderId: `sell-${Date.now()}`,
    });
    
    console.log(`\n✅ 订单创建成功！`);
    console.log(`  订单ID: ${order.orderId}`);
    console.log(`  状态: ${order.status}`);
    
    return order;
  } catch (error) {
    console.error('❌ 创建订单失败:', error.message);
    throw error;
  }
}

/**
 * 查询订单状态
 */
async function checkOrderStatus(orderId) {
  try {
    console.log(`\n🔍 查询订单状态...`);
    const order = await client.trade.getOrder(orderId);
    
    console.log(`  订单ID: ${order.orderId}`);
    console.log(`  交易对: ${order.symbol}`);
    console.log(`  方向: ${order.side}`);
    console.log(`  类型: ${order.type}`);
    console.log(`  状态: ${order.status}`);
    console.log(`  价格: ${order.price}`);
    console.log(`  数量: ${order.quantity}`);
    console.log(`  已成交: ${order.filledQty}`);
    console.log(`  平均价: ${order.avgPrice}`);
    
    return order;
  } catch (error) {
    console.error('❌ 查询订单失败:', error.message);
    throw error;
  }
}

/**
 * 取消订单
 */
async function cancelOrder(orderId) {
  try {
    console.log(`\n❌ 取消订单...`);
    const result = await client.trade.cancelOrder(orderId);
    
    if (result.success) {
      console.log(`✅ 订单已取消`);
    } else {
      console.log(`⚠️ 取消失败: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 取消订单失败:', error.message);
    throw error;
  }
}

/**
 * 查询当前订单
 */
async function listOpenOrders(symbol) {
  try {
    console.log(`\n📋 查询当前订单...`);
    const orders = await client.trade.getOpenOrders({ symbol, limit: 10 });
    
    if (orders.length === 0) {
      console.log('  无当前订单');
    } else {
      orders.forEach((order, index) => {
        console.log(`\n  订单 ${index + 1}:`);
        console.log(`    ID: ${order.orderId}`);
        console.log(`    方向: ${order.side}`);
        console.log(`    价格: ${order.price}`);
        console.log(`    数量: ${order.quantity}`);
        console.log(`    已成交: ${order.filledQty}`);
        console.log(`    状态: ${order.status}`);
      });
    }
    
    return orders;
  } catch (error) {
    console.error('❌ 查询订单失败:', error.message);
    throw error;
  }
}

/**
 * 完整交易流程示例
 */
async function tradingExample() {
  console.log('========================================');
  console.log('  金币交易协议 - 基础交易示例');
  console.log('========================================\n');
  
  try {
    // 1. 查询余额
    await checkBalance();
    
    // 2. 查询行情
    const symbol = 'BTC_USDT';
    const ticker = await getMarketPrice(symbol);
    
    // 3. 创建买单（价格略低于市场价）
    const buyPrice = (parseFloat(ticker.lastPrice) * 0.99).toFixed(2);
    const buyOrder = await placeBuyOrder(symbol, '0.001', buyPrice);
    
    // 4. 查询订单状态
    await checkOrderStatus(buyOrder.orderId);
    
    // 5. 查询当前订单
    await listOpenOrders(symbol);
    
    // 6. 取消订单
    await cancelOrder(buyOrder.orderId);
    
    // 7. 再次查询余额
    await checkBalance();
    
    console.log('\n========================================');
    console.log('  ✅ 示例执行完成！');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ 示例执行失败:', error);
    process.exit(1);
  }
}

// 执行示例
if (require.main === module) {
  tradingExample();
}

module.exports = {
  checkBalance,
  getMarketPrice,
  placeBuyOrder,
  placeSellOrder,
  checkOrderStatus,
  cancelOrder,
  listOpenOrders,
};
