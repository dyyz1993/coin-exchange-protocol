package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/coin-exchange/go-sdk"
)

func main() {
	// 初始化客户端
	client := coinexchange.NewClient(
		os.Getenv("COIN_EXCHANGE_API_KEY"),
		os.Getenv("COIN_EXCHANGE_API_SECRET"),
		coinexchange.Sandbox, // 生产环境改为 coinexchange.Production
	)

	// 创建带超时的 context
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 运行示例
	if err := runExample(ctx, client); err != nil {
		log.Fatal(err)
	}
}

func runExample(ctx context.Context, client *coinexchange.Client) error {
	fmt.Println("========================================")
	fmt.Println("  金币交易协议 - 基础交易示例")
	fmt.Println("========================================")
	fmt.Println()

	// 1. 查询余额
	if err := checkBalance(ctx, client); err != nil {
		return fmt.Errorf("查询余额失败: %w", err)
	}

	// 2. 查询行情
	symbol := "BTC_USDT"
	ticker, err := getMarketPrice(ctx, client, symbol)
	if err != nil {
		return fmt.Errorf("查询行情失败: %w", err)
	}

	// 3. 创建买单
	buyPrice := fmt.Sprintf("%.2f", parseFloat(ticker.LastPrice)*0.99)
	buyOrder, err := placeBuyOrder(ctx, client, symbol, "0.001", buyPrice)
	if err != nil {
		return fmt.Errorf("创建订单失败: %w", err)
	}

	// 4. 查询订单状态
	if err := checkOrderStatus(ctx, client, buyOrder.OrderID); err != nil {
		return fmt.Errorf("查询订单失败: %w", err)
	}

	// 5. 查询当前订单
	if err := listOpenOrders(ctx, client, symbol); err != nil {
		return fmt.Errorf("查询当前订单失败: %w", err)
	}

	// 6. 取消订单
	if err := cancelOrder(ctx, client, buyOrder.OrderID); err != nil {
		return fmt.Errorf("取消订单失败: %w", err)
	}

	// 7. 再次查询余额
	if err := checkBalance(ctx, client); err != nil {
		return fmt.Errorf("查询余额失败: %w", err)
	}

	fmt.Println()
	fmt.Println("========================================")
	fmt.Println("  ✅ 示例执行完成！")
	fmt.Println("========================================")

	return nil
}

func checkBalance(ctx context.Context, client *coinexchange.Client) error {
	fmt.Println("📊 查询账户余额...")

	balance, err := client.Account.GetBalance(ctx)
	if err != nil {
		return err
	}

	fmt.Println("\n可用资产:")
	for _, asset := range balance.Assets {
		if parseFloat(asset.Available) > 0 {
			fmt.Printf("  %s: %s (冻结: %s)\n", asset.Symbol, asset.Available, asset.Frozen)
		}
	}

	return nil
}

func getMarketPrice(ctx context.Context, client *coinexchange.Client, symbol string) (*coinexchange.Ticker, error) {
	fmt.Printf("\n📈 查询 %s 行情...\n", symbol)

	ticker, err := client.Public.GetTicker(ctx, symbol)
	if err != nil {
		return nil, err
	}

	fmt.Printf("  最新价: %s\n", ticker.LastPrice)
	fmt.Printf("  24h 最高: %s\n", ticker.High24h)
	fmt.Printf("  24h 最低: %s\n", ticker.Low24h)
	fmt.Printf("  24h 涨跌: %s%%\n", ticker.PriceChangePercent)

	return ticker, nil
}

func placeBuyOrder(ctx context.Context, client *coinexchange.Client, symbol, quantity, price string) (*coinexchange.Order, error) {
	fmt.Println("\n📝 创建限价买单...")
	fmt.Printf("  交易对: %s\n", symbol)
	fmt.Printf("  数量: %s\n", quantity)
	fmt.Printf("  价格: %s\n", price)

	order, err := client.Trade.CreateOrder(ctx, &coinexchange.OrderRequest{
		Symbol:        symbol,
		Side:          coinexchange.OrderSideBuy,
		Type:          coinexchange.OrderTypeLimit,
		Quantity:      quantity,
		Price:         price,
		ClientOrderID: fmt.Sprintf("buy-%d", time.Now().UnixMilli()),
	})
	if err != nil {
		return nil, err
	}

	fmt.Println("\n✅ 订单创建成功！")
	fmt.Printf("  订单ID: %s\n", order.OrderID)
	fmt.Printf("  状态: %s\n", order.Status)

	return order, nil
}

func checkOrderStatus(ctx context.Context, client *coinexchange.Client, orderID string) error {
	fmt.Println("\n🔍 查询订单状态...")

	order, err := client.Trade.GetOrder(ctx, orderID)
	if err != nil {
		return err
	}

	fmt.Printf("  订单ID: %s\n", order.OrderID)
	fmt.Printf("  交易对: %s\n", order.Symbol)
	fmt.Printf("  方向: %s\n", order.Side)
	fmt.Printf("  类型: %s\n", order.Type)
	fmt.Printf("  状态: %s\n", order.Status)
	fmt.Printf("  价格: %s\n", order.Price)
	fmt.Printf("  数量: %s\n", order.Quantity)
	fmt.Printf("  已成交: %s\n", order.FilledQty)
	fmt.Printf("  平均价: %s\n", order.AvgPrice)

	return nil
}

func listOpenOrders(ctx context.Context, client *coinexchange.Client, symbol string) error {
	fmt.Println("\n📋 查询当前订单...")

	orders, err := client.Trade.GetOpenOrders(ctx, &coinexchange.OrderQuery{
		Symbol: symbol,
		Limit:  10,
	})
	if err != nil {
		return err
	}

	if len(orders) == 0 {
		fmt.Println("  无当前订单")
	} else {
		for i, order := range orders {
			fmt.Printf("\n  订单 %d:\n", i+1)
			fmt.Printf("    ID: %s\n", order.OrderID)
			fmt.Printf("    方向: %s\n", order.Side)
			fmt.Printf("    价格: %s\n", order.Price)
			fmt.Printf("    数量: %s\n", order.Quantity)
			fmt.Printf("    已成交: %s\n", order.FilledQty)
			fmt.Printf("    状态: %s\n", order.Status)
		}
	}

	return nil
}

func cancelOrder(ctx context.Context, client *coinexchange.Client, orderID string) error {
	fmt.Println("\n❌ 取消订单...")

	result, err := client.Trade.CancelOrder(ctx, orderID)
	if err != nil {
		return err
	}

	if result.Success {
		fmt.Println("✅ 订单已取消")
	} else {
		fmt.Printf("⚠️ 取消失败: %s\n", result.Message)
	}

	return nil
}

func parseFloat(s string) float64 {
	var f float64
	fmt.Sscanf(s, "%f", &f)
	return f
}
