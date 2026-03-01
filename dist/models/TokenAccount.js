/**
 * 代币账户模型
 * 管理用户的代币余额和交易记录
 */
export class TokenAccountModel {
    accounts = new Map();
    transactions = new Map();
    accountCounter = 1;
    transactionCounter = 1;
    /**
     * 创建账户
     */
    createAccount(userId) {
        const account = {
            id: `acc_${this.accountCounter++}`,
            userId,
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.accounts.set(account.id, account);
        return account;
    }
    /**
     * 根据用户ID获取账户
     */
    getAccountByUserId(userId) {
        for (const account of this.accounts.values()) {
            if (account.userId === userId) {
                return account;
            }
        }
        return undefined;
    }
    /**
     * 根据账户ID获取账户
     */
    getAccountById(accountId) {
        return this.accounts.get(accountId);
    }
    /**
     * 获取或创建账户
     */
    getOrCreateAccount(userId) {
        let account = this.getAccountByUserId(userId);
        if (!account) {
            account = this.createAccount(userId);
        }
        return account;
    }
    /**
     * 增加余额
     */
    addBalance(accountId, amount, type, description, referenceId) {
        const account = this.accounts.get(accountId);
        if (!account)
            return null;
        // 创建交易记录
        const transaction = {
            id: `tx_${this.transactionCounter++}`,
            accountId,
            type,
            amount,
            description,
            referenceId,
            createdAt: new Date(),
        };
        // 更新账户余额
        account.balance += amount;
        account.totalEarned += amount;
        account.updatedAt = new Date();
        this.transactions.set(transaction.id, transaction);
        return { account, transaction };
    }
    /**
     * 扣除余额
     */
    deductBalance(accountId, amount, description) {
        const account = this.accounts.get(accountId);
        if (!account || account.balance < amount)
            return null;
        // 创建交易记录
        const transaction = {
            id: `tx_${this.transactionCounter++}`,
            accountId,
            type: 'spend',
            amount: -amount,
            description,
            createdAt: new Date(),
        };
        // 更新账户余额
        account.balance -= amount;
        account.totalSpent += amount;
        account.updatedAt = new Date();
        this.transactions.set(transaction.id, transaction);
        return { account, transaction };
    }
    /**
     * 查询交易记录
     */
    getTransactions(accountId, limit = 20, offset = 0) {
        const accountTransactions = [];
        for (const transaction of this.transactions.values()) {
            if (transaction.accountId === accountId) {
                accountTransactions.push(transaction);
            }
        }
        // 按时间倒序排列
        accountTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return accountTransactions.slice(offset, offset + limit);
    }
    /**
     * 获取所有账户
     */
    getAllAccounts() {
        return Array.from(this.accounts.values());
    }
}
// 单例实例
export const tokenAccountModel = new TokenAccountModel();
