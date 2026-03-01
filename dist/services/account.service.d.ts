/**
 * 账户服务 - 管理用户账户和代币余额
 */
import { TransactionType, Transaction } from '../types/common';
export declare class AccountService {
    /**
     * 创建新用户账户
     */
    createAccount(userId: string, initialData?: {
        email?: string;
        phone?: string;
        nickname?: string;
    }): Promise<{
        accountId: string;
        createdAt: Date;
    }>;
    /**
     * 获取用户账户信息
     */
    getAccountInfo(userId: string): {
        balance: number;
        frozenBalance: number;
        availableBalance: number;
        totalEarned?: number;
        totalSpent?: number;
    } | null;
    /**
     * 获取用户代币余额
     */
    getTokenBalance(userId: string): {
        balance: number;
        frozenBalance: number;
        availableBalance: number;
    } | null;
    /**
     * 增加用户代币（奖励、空投等）
     */
    addTokens(userId: string, amount: number, type: TransactionType, description: string, relatedId?: string): Promise<{
        success: boolean;
        newBalance: number;
        transactionId: string;
    }>;
    /**
     * 扣除用户代币（消费、惩罚等）
     */
    deductTokens(userId: string, amount: number, type: TransactionType, description: string, relatedId?: string): Promise<{
        success: boolean;
        newBalance: number;
        transactionId: string;
    }>;
    /**
     * 冻结用户代币
     */
    freezeTokens(userId: string, amount: number, reason: string, relatedId?: string): Promise<{
        success: boolean;
        frozenAmount: number;
        availableBalance: number;
    }>;
    /**
     * 解冻用户代币
     */
    unfreezeTokens(userId: string, amount: number, reason: string): Promise<{
        success: boolean;
        unfrozenAmount: number;
        availableBalance: number;
    }>;
    /**
     * 转账（用户之间）
     */
    transfer(fromUserId: string, toUserId: string, amount: number, description: string): Promise<{
        success: boolean;
        fromNewBalance: number;
        toNewBalance: number;
        transactionId: string;
    }>;
    /**
     * 获取交易记录
     */
    getTransactionHistory(userId: string, options?: {
        type?: TransactionType;
        limit?: number;
        offset?: number;
    }): Transaction[];
    /**
     * 检查用户是否有足够余额
     */
    hasEnoughBalance(userId: string, amount: number): boolean;
    /**
     * 获取账户统计信息
     */
    getAccountStats(userId: string): {
        totalTransactions: number;
        totalEarned: number;
        totalSpent: number;
        accountAge: number;
    } | null;
    /**
     * 更新账户信息
     * 注意：当前 AccountModel 没有更新账户信息的方法，这里只是占位
     */
    updateAccountInfo(userId: string, updates: {
        email?: string;
        phone?: string;
        nickname?: string;
        avatar?: string;
    }): any;
    /**
     * 停用账户
     * 注意：当前 AccountModel 没有 status 字段，这里只是占位
     */
    deactivateAccount(userId: string, reason: string): Promise<boolean>;
    /**
     * 激活账户
     * 注意：当前 AccountModel 没有 status 字段，这里只是占位
     */
    activateAccount(userId: string): Promise<boolean>;
    /**
     * 获取余额 - getTokenBalance 的别名
     * 为 AccountController 提供的便捷方法
     */
    getBalance(userId: string): Promise<{
        balance: number;
        frozenBalance: number;
        availableBalance: number;
    } | null>;
    /**
     * 充值 - addTokens 的别名
     * 为 AccountController 提供的便捷方法
     */
    deposit(userId: string, amount: number, reason?: string): Promise<{
        success: boolean;
        newBalance: number;
        transactionId: string;
    }>;
    /**
     * 提现 - deductTokens 的别名
     * 为 AccountController 提供的便捷方法
     */
    withdraw(userId: string, amount: number, reason?: string): Promise<{
        success: boolean;
        newBalance: number;
        transactionId: string;
    }>;
    /**
     * 冻结账户 - freezeTokens 的别名
     * 为 AccountController 提供的便捷方法
     */
    freezeAccount(userId: string, reason: string, duration?: number): Promise<{
        success: boolean;
        frozenAmount: number;
        availableBalance: number;
    }>;
    /**
     * 解冻账户 - unfreezeTokens 的别名
     * 为 AccountController 提供的便捷方法
     */
    unfreezeAccount(userId: string, reason: string): Promise<{
        success: boolean;
        unfrozenAmount: number;
        availableBalance: number;
    }>;
    /**
     * 获取交易记录 - getTransactionHistory 的别名
     * 为 AccountController 提供的便捷方法
     */
    getTransactions(userId: string): Promise<Transaction[]>;
    /**
     * 获取冻结账户列表
     * 注意：AccountModel 没有专门的冻结账户列表，这里返回所有有冻结余额的账户
     */
    getFrozenAccounts(): Promise<any[]>;
    /**
     * 更新账户状态
     * 注意：AccountModel 没有状态字段，这里只是占位
     */
    updateAccountStatus(userId: string, status: string): Promise<{
        success: boolean;
        status: string;
    }>;
}
export declare const accountService: AccountService;
