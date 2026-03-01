/**
 * 空投系统类型定义
 */
export var AirdropStatus;
(function (AirdropStatus) {
    AirdropStatus["DRAFT"] = "draft";
    AirdropStatus["PENDING"] = "pending";
    AirdropStatus["ACTIVE"] = "active";
    AirdropStatus["PAUSED"] = "paused";
    AirdropStatus["COMPLETED"] = "completed";
    AirdropStatus["CANCELLED"] = "cancelled";
})(AirdropStatus || (AirdropStatus = {}));
