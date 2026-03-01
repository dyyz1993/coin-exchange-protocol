/**
 * 代币账户模型
 * 管理用户的代币余额和交易记录
 */
import type { TokenAccount, Transaction } from '../types';
export declare class TokenAccountModel {
    private accounts;
    private transactions;
    private accountCounter;
    private transactionCounter;
    /**
     * 创建账户
     */
    createAccount(userId: string): TokenAccount;
    /**
     * 根据用户ID获取账户
     */
    getAccountByUserId(userId: string): TokenAccount | undefined;
    /**
     * 根据账户ID获取账户
     */
    getAccountById(accountId: string): TokenAccount | undefined;
    /**
     * 获取或创建账户
     */
    getOrCreateAccount(userId: string): TokenAccount;
    /**
     * 增加余额
     */
    addBalance(accountId: string, amount: number, type: Transaction['type'], description: string, referenceId?: string): {
        account: TokenAccount;
        transaction: Transaction;
    } | null;
    /**
     * 扣除余额
     */
    deductBalance(accountId: string, amount: number, description: string): {
        account: TokenAccount;
        transaction: Transaction;
    } | null;
    /**
     * 查询交易记录
     */
    getTransactions(accountId: string, limit?: number, offset?: number): Transaction[];
    /**
     * 获取所有账户
     */
    getAllAccounts(): TokenAccount[];
}
export declare const tokenAccountModel: TokenAccountModel;
