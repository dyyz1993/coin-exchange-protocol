/**
 * 账户模型 - 管理代币账户和交易记录
 *
 * 修复并发竞态条件问题：
 * 1. 添加版本号实现乐观锁（Optimistic Locking）
 * 2. 使用内存锁确保同一账户操作串行化
 * 3. 转账操作使用有序锁避免死锁
 */
import { Account, Transaction, TransactionType } from '../types';
export declare class AccountModel {
    private accounts;
    private transactions;
    private userAccounts;
    private accountLocks;
    private readonly MAX_LOCK_RETRIES;
    private readonly LOCK_RETRY_DELAY;
    /**
     * 获取账户锁（同步等待）
     */
    private acquireLock;
    /**
     * 释放账户锁
     */
    private releaseLock;
    /**
     * 使用锁执行操作
     */
    private withLock;
    /**
     * 验证版本号并更新（CAS 操作）
     */
    private validateAndUpdateBalance;
    /**
     * 创建账户
     */
    createAccount(userId: string): Account;
    /**
     * 根据用户ID获取账户
     */
    getAccountByUserId(userId: string): Account | undefined;
    /**
     * 根据账户ID获取账户
     */
    getAccountById(accountId: string): Account | undefined;
    /**
     * 获取或创建账户
     */
    getOrCreateAccount(userId: string): Account;
    /**
     * 增加余额（带锁和版本控制）
     */
    addBalance(userId: string, amount: number, description: string, type: TransactionType): Transaction;
    /**
     * 扣减余额（带锁和版本控制）
     */
    deductBalance(userId: string, amount: number, description: string, type: TransactionType): Transaction;
    /**
     * 冻结余额（带锁和版本控制）
     */
    freezeBalance(userId: string, amount: number): Transaction;
    /**
     * 解冻余额（带锁和版本控制）
     */
    unfreezeBalance(userId: string, amount: number): Transaction;
    /**
     * 转账（带双重锁和版本控制）
     */
    transfer(fromUserId: string, toUserId: string, amount: number, description: string): Transaction;
    /**
     * 创建交易记录
     */
    private createTransaction;
    /**
     * 获取交易记录
     */
    getTransaction(transactionId: string): Transaction | undefined;
    /**
     * 获取用户交易历史
     */
    getUserTransactions(userId: string): Transaction[];
}
export declare const accountModel: AccountModel;
