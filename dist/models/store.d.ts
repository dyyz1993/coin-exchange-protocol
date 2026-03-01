/**
 * 数据存储层 - 使用 Map 模拟数据库
 */
import { UserAccount, Transaction, Airdrop, AirdropClaim, Task, TaskCompletion } from '../types';
declare class DataStore {
    private accounts;
    private transactions;
    private userTransactions;
    private airdrops;
    private airdropClaims;
    private userAirdropClaims;
    private tasks;
    private taskCompletions;
    private userTaskCompletions;
    private generateId;
    getAccount(userId: string): UserAccount | undefined;
    createAccount(userId: string): UserAccount;
    updateAccount(userId: string, updates: Partial<UserAccount>): UserAccount | undefined;
    createTransaction(userId: string, type: Transaction['type'], amount: number, description: string, relatedId?: string): Transaction;
    getUserTransactions(userId: string): Transaction[];
    getTransactionCount(userId: string): number;
    createAirdrop(airdrop: Omit<Airdrop, 'id' | 'createdAt'>): Airdrop;
    getAirdrop(airdropId: string): Airdrop | undefined;
    getAllAirdrops(): Airdrop[];
    updateAirdrop(airdropId: string, updates: Partial<Airdrop>): Airdrop | undefined;
    createAirdropClaim(airdropId: string, userId: string, amount: number): AirdropClaim;
    hasClaimedAirdrop(airdropId: string, userId: string): boolean;
    getUserAirdropClaims(userId: string): AirdropClaim[];
    createTask(task: Omit<Task, 'id' | 'createdAt'>): Task;
    getTask(taskId: string): Task | undefined;
    getAllTasks(): Task[];
    updateTask(taskId: string, updates: Partial<Task>): Task | undefined;
    createTaskCompletion(taskId: string, userId: string, reward: number): TaskCompletion;
    hasCompletedTask(taskId: string, userId: string): boolean;
    getUserTaskCompletions(userId: string): TaskCompletion[];
}
export declare const dataStore: DataStore;
export {};
