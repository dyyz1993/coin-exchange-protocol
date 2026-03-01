/**
 * 代币服务 - 核心业务逻辑
 */
import { BalanceResponse, TransactionType, Transaction } from '../types';
export declare class TokenService {
    /**
     * 获取用户余额
     */
    getBalance(userId: string): BalanceResponse;
    /**
     * 增加余额（内部方法）
     */
    addBalance(userId: string, amount: number, description: string, type: TransactionType): Transaction;
    /**
     * 扣减余额
     */
    deductBalance(userId: string, amount: number, description: string): Transaction;
    /**
     * 转账
     */
    transfer(fromUserId: string, toUserId: string, amount: number, description: string): Transaction;
    /**
     * 冻结余额
     */
    freezeBalance(userId: string, amount: number): Transaction;
    /**
     * 解冻余额
     */
    unfreezeBalance(userId: string, amount: number): Transaction;
    /**
     * 获取用户交易历史
     */
    getTransactionHistory(userId: string): Transaction[];
    /**
     * 获取交易详情
     */
    getTransaction(transactionId: string): Transaction | undefined;
}
export declare const tokenService: TokenService;
