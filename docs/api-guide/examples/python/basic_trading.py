"""
基础交易示例
演示如何使用 Python SDK 进行基础交易操作
"""

import os
from coin_exchange import CoinExchangeClient
from decimal import Decimal


# 初始化客户端
client = CoinExchangeClient(
    api_key=os.getenv('COIN_EXCHANGE_API_KEY'),
    api_secret=os.getenv('COIN_EXCHANGE_API_SECRET'),
    environment='sandbox',  # 生产环境改为 'production'
)


def check_balance():
    """查询账户余额"""
    try:
        print('📊 查询账户余额...')
        balance = client.account.get_balance()
        
        print('\n可用资产:')
        for asset in balance['assets']:
            if Decimal(asset['available']) > 0:
                print(f"  {asset['symbol']}: {asset['available']} (冻结: {asset['frozen']})")
        
        return balance
    except Exception as e:
        print(f'❌ 查询余额失败: {e}')
        raise


def get_market_price(symbol):
    """查询市场行情"""
    try:
        print(f'\n📈 查询 {symbol} 行情...')
        ticker = client.public.get_ticker(symbol)
        
        print(f"  最新价: {ticker['lastPrice']}")
        print(f"  24h 最高: {ticker['high24h']}")
        print(f"  24h 最低: {ticker['low24h']}")
        print(f"  24h 涨跌: {ticker['priceChangePercent']}%")
        
        return ticker
    except Exception as e:
        print(f'❌ 查询行情失败: {e}')
        raise


def place_buy_order(symbol, quantity, price):
    """创建限价买单"""
    try:
        print('\n📝 创建限价买单...')
        print(f'  交易对: {symbol}')
        print(f'  数量: {quantity}')
        print(f'  价格: {price}')
        
        order = client.trade.create_order(
            symbol=symbol,
            side='BUY',
            type='LIMIT',
            quantity=quantity,
            price=price,
            client_order_id=f'buy-{int(time.time() * 1000)}',
        )
        
        print('\n✅ 订单创建成功！')
        print(f"  订单ID: {order['orderId']}")
        print(f"  状态: {order['status']}")
        
        return order
    except Exception as e:
        print(f'❌ 创建订单失败: {e}')
        if hasattr(e, 'code'):
            print(f'  错误码: {e.code}')
        raise


def place_sell_order(symbol, quantity, price):
    """创建限价卖单"""
    try:
        print('\n📝 创建限价卖单...')
        print(f'  交易对: {symbol}')
        print(f'  数量: {quantity}')
        print(f'  价格: {price}')
        
        order = client.trade.create_order(
            symbol=symbol,
            side='SELL',
            type='LIMIT',
            quantity=quantity,
            price=price,
            client_order_id=f'sell-{int(time.time() * 1000)}',
        )
        
        print('\n✅ 订单创建成功！')
        print(f"  订单ID: {order['orderId']}")
        print(f"  状态: {order['status']}")
        
        return order
    except Exception as e:
        print(f'❌ 创建订单失败: {e}')
        raise


def check_order_status(order_id):
    """查询订单状态"""
    try:
        print('\n🔍 查询订单状态...')
        order = client.trade.get_order(order_id)
        
        print(f"  订单ID: {order['orderId']}")
        print(f"  交易对: {order['symbol']}")
        print(f"  方向: {order['side']}")
        print(f"  类型: {order['type']}")
        print(f"  状态: {order['status']}")
        print(f"  价格: {order['price']}")
        print(f"  数量: {order['quantity']}")
        print(f"  已成交: {order['filledQty']}")
        print(f"  平均价: {order['avgPrice']}")
        
        return order
    except Exception as e:
        print(f'❌ 查询订单失败: {e}')
        raise


def cancel_order(order_id):
    """取消订单"""
    try:
        print('\n❌ 取消订单...')
        result = client.trade.cancel_order(order_id)
        
        if result.get('success'):
            print('✅ 订单已取消')
        else:
            print(f"⚠️ 取消失败: {result.get('message')}")
        
        return result
    except Exception as e:
        print(f'❌ 取消订单失败: {e}')
        raise


def list_open_orders(symbol):
    """查询当前订单"""
    try:
        print('\n📋 查询当前订单...')
        orders = client.trade.get_open_orders(symbol=symbol, limit=10)
        
        if not orders:
            print('  无当前订单')
        else:
            for i, order in enumerate(orders, 1):
                print(f'\n  订单 {i}:')
                print(f"    ID: {order['orderId']}")
                print(f"    方向: {order['side']}")
                print(f"    价格: {order['price']}")
                print(f"    数量: {order['quantity']}")
                print(f"    已成交: {order['filledQty']}")
                print(f"    状态: {order['status']}")
        
        return orders
    except Exception as e:
        print(f'❌ 查询订单失败: {e}')
        raise


def trading_example():
    """完整交易流程示例"""
    print('========================================')
    print('  金币交易协议 - 基础交易示例')
    print('========================================\n')
    
    try:
        # 1. 查询余额
        check_balance()
        
        # 2. 查询行情
        symbol = 'BTC_USDT'
        ticker = get_market_price(symbol)
        
        # 3. 创建买单（价格略低于市场价）
        buy_price = str(Decimal(ticker['lastPrice']) * Decimal('0.99'))
        buy_price = str(round(Decimal(buy_price), 2))
        buy_order = place_buy_order(symbol, '0.001', buy_price)
        
        # 4. 查询订单状态
        check_order_status(buy_order['orderId'])
        
        # 5. 查询当前订单
        list_open_orders(symbol)
        
        # 6. 取消订单
        cancel_order(buy_order['orderId'])
        
        # 7. 再次查询余额
        check_balance()
        
        print('\n========================================')
        print('  ✅ 示例执行完成！')
        print('========================================\n')
        
    except Exception as e:
        print(f'\n❌ 示例执行失败: {e}')
        exit(1)


if __name__ == '__main__':
    import time
    trading_example()
