/**
 * 手续费系统类型定义
 */
export var FeeType;
(function (FeeType) {
    FeeType["TRANSACTION"] = "transaction";
    FeeType["TRANSFER"] = "transfer";
    FeeType["WITHDRAWAL"] = "withdrawal";
    FeeType["TASK_CREATE"] = "task_create";
    FeeType["OTHER"] = "other";
})(FeeType || (FeeType = {}));
export var FeeStatus;
(function (FeeStatus) {
    FeeStatus["PENDING"] = "pending";
    FeeStatus["COLLECTED"] = "collected";
    FeeStatus["REFUNDED"] = "refunded";
})(FeeStatus || (FeeStatus = {}));
