/**
 * 通用类型定义
 */
// 先定义枚举，避免前向引用问题
export var TransactionType;
(function (TransactionType) {
    TransactionType["AIRDROP"] = "airdrop";
    TransactionType["TASK_REWARD"] = "task_reward";
    TransactionType["TRANSFER"] = "transfer";
    TransactionType["TRANSFER_IN"] = "transfer_in";
    TransactionType["TRANSFER_OUT"] = "transfer_out";
    TransactionType["REWARD"] = "reward";
    TransactionType["PENALTY"] = "penalty";
    TransactionType["FROZEN"] = "frozen";
    TransactionType["UNFROZEN"] = "unfrozen";
    TransactionType["PURCHASE"] = "purchase";
})(TransactionType || (TransactionType = {}));
export var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["SUCCESS"] = "success";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["PENDING"] = "pending";
})(TransactionStatus || (TransactionStatus = {}));
