/**
 * 数据存储层 - 使用 Map 模拟数据库
 */
class DataStore {
    // 用户账户
    accounts = new Map();
    // 交易记录
    transactions = new Map();
    userTransactions = new Map(); // userId -> transactionIds
    // 空投
    airdrops = new Map();
    airdropClaims = new Map();
    userAirdropClaims = new Map(); // userId -> claimIds
    // 任务
    tasks = new Map();
    taskCompletions = new Map();
    userTaskCompletions = new Map(); // userId -> completionIds
    // ID 生成器
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // ============ 账户相关 ============
    getAccount(userId) {
        return this.accounts.get(userId);
    }
    createAccount(userId) {
        const account = {
            userId,
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.accounts.set(userId, account);
        return account;
    }
    updateAccount(userId, updates) {
        const account = this.accounts.get(userId);
        if (!account)
            return undefined;
        const updated = {
            ...account,
            ...updates,
            updatedAt: new Date()
        };
        this.accounts.set(userId, updated);
        return updated;
    }
    // ============ 交易相关 ============
    createTransaction(userId, type, amount, description, relatedId) {
        const id = this.generateId();
        const transaction = {
            id,
            userId,
            type,
            amount,
            description,
            relatedId,
            createdAt: new Date()
        };
        this.transactions.set(id, transaction);
        // 建立用户交易索引
        if (!this.userTransactions.has(userId)) {
            this.userTransactions.set(userId, new Set());
        }
        this.userTransactions.get(userId).add(id);
        return transaction;
    }
    getUserTransactions(userId) {
        const transactionIds = this.userTransactions.get(userId);
        if (!transactionIds)
            return [];
        return Array.from(transactionIds)
            .map(id => this.transactions.get(id))
            .filter(t => t !== undefined)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    getTransactionCount(userId) {
        const transactionIds = this.userTransactions.get(userId);
        return transactionIds ? transactionIds.size : 0;
    }
    // ============ 空投相关 ============
    createAirdrop(airdrop) {
        const id = this.generateId();
        const newAirdrop = {
            ...airdrop,
            id,
            createdAt: new Date()
        };
        this.airdrops.set(id, newAirdrop);
        return newAirdrop;
    }
    getAirdrop(airdropId) {
        return this.airdrops.get(airdropId);
    }
    getAllAirdrops() {
        return Array.from(this.airdrops.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    updateAirdrop(airdropId, updates) {
        const airdrop = this.airdrops.get(airdropId);
        if (!airdrop)
            return undefined;
        const updated = { ...airdrop, ...updates };
        this.airdrops.set(airdropId, updated);
        return updated;
    }
    createAirdropClaim(airdropId, userId, amount) {
        const id = this.generateId();
        const claim = {
            id,
            airdropId,
            userId,
            amount,
            claimedAt: new Date()
        };
        this.airdropClaims.set(id, claim);
        // 建立用户领取索引
        if (!this.userAirdropClaims.has(userId)) {
            this.userAirdropClaims.set(userId, new Set());
        }
        this.userAirdropClaims.get(userId).add(id);
        return claim;
    }
    hasClaimedAirdrop(airdropId, userId) {
        const claims = Array.from(this.airdropClaims.values());
        return claims.some(c => c.airdropId === airdropId && c.userId === userId);
    }
    getUserAirdropClaims(userId) {
        const claimIds = this.userAirdropClaims.get(userId);
        if (!claimIds)
            return [];
        return Array.from(claimIds)
            .map(id => this.airdropClaims.get(id))
            .filter(c => c !== undefined)
            .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
    }
    // ============ 任务相关 ============
    createTask(task) {
        const id = this.generateId();
        const newTask = {
            ...task,
            id,
            createdAt: new Date()
        };
        this.tasks.set(id, newTask);
        return newTask;
    }
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    getAllTasks() {
        return Array.from(this.tasks.values())
            .filter(t => t.isActive)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    updateTask(taskId, updates) {
        const task = this.tasks.get(taskId);
        if (!task)
            return undefined;
        const updated = { ...task, ...updates };
        this.tasks.set(taskId, updated);
        return updated;
    }
    createTaskCompletion(taskId, userId, reward) {
        const id = this.generateId();
        const completion = {
            id,
            taskId,
            userId,
            reward,
            completedAt: new Date()
        };
        this.taskCompletions.set(id, completion);
        // 建立用户完成索引
        if (!this.userTaskCompletions.has(userId)) {
            this.userTaskCompletions.set(userId, new Set());
        }
        this.userTaskCompletions.get(userId).add(id);
        return completion;
    }
    hasCompletedTask(taskId, userId) {
        const completions = Array.from(this.taskCompletions.values());
        return completions.some(c => c.taskId === taskId && c.userId === userId);
    }
    getUserTaskCompletions(userId) {
        const completionIds = this.userTaskCompletions.get(userId);
        if (!completionIds)
            return [];
        return Array.from(completionIds)
            .map(id => this.taskCompletions.get(id))
            .filter(c => c !== undefined)
            .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    }
}
// 单例模式
export const dataStore = new DataStore();
