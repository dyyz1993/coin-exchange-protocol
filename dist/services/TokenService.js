/**
 * 代币服务 - 核心业务逻辑
 */
import { accountModel } from '../models/Account';
import { TransactionType } from '../types';
export class TokenService {
    /**
     * 获取用户余额
     */
    getBalance(userId) {
        const account = accountModel.getAccountByUserId(userId);
        if (!account) {
            return {
                userId,
                balance: 0,
                frozenBalance: 0,
                availableBalance: 0
            };
        }
        return {
            userId: account.userId,
            balance: account.balance,
            frozenBalance: account.frozenBalance,
            availableBalance: account.balance
        };
    }
    /**
     * 增加余额（内部方法）
     */
    addBalance(userId, amount, description, type) {
        return accountModel.addBalance(userId, amount, description, type);
    }
    /**
     * 扣减余额
     */
    deductBalance(userId, amount, description) {
        return accountModel.deductBalance(userId, amount, description, TransactionType.TRANSFER);
    }
    /**
     * 转账
     */
    transfer(fromUserId, toUserId, amount, description) {
        return accountModel.transfer(fromUserId, toUserId, amount, description);
    }
    /**
     * 冻结余额
     */
    freezeBalance(userId, amount) {
        return accountModel.freezeBalance(userId, amount);
    }
    /**
     * 解冻余额
     */
    unfreezeBalance(userId, amount) {
        return accountModel.unfreezeBalance(userId, amount);
    }
    /**
     * 获取用户交易历史
     */
    getTransactionHistory(userId) {
        return accountModel.getUserTransactions(userId);
    }
    /**
     * 获取交易详情
     */
    getTransaction(transactionId) {
        return accountModel.getTransaction(transactionId);
    }
}
// 导出单例
export const tokenService = new TokenService();
