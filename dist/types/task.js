/**
 * 任务系统类型定义
 */
export var TaskType;
(function (TaskType) {
    TaskType["DAILY"] = "daily";
    TaskType["WEEKLY"] = "weekly";
    TaskType["SPECIAL"] = "special";
})(TaskType || (TaskType = {}));
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["DRAFT"] = "draft";
    TaskStatus["PENDING"] = "pending";
    TaskStatus["ACTIVE"] = "active";
    TaskStatus["PAUSED"] = "paused";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (TaskStatus = {}));
export var TaskCompletionStatus;
(function (TaskCompletionStatus) {
    TaskCompletionStatus["PENDING"] = "pending";
    TaskCompletionStatus["APPROVED"] = "approved";
    TaskCompletionStatus["REJECTED"] = "rejected";
})(TaskCompletionStatus || (TaskCompletionStatus = {}));
