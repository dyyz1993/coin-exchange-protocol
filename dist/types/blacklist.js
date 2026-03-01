/**
 * 黑名单系统类型定义
 */
export var BlacklistType;
(function (BlacklistType) {
    BlacklistType["USER"] = "user";
    BlacklistType["MERCHANT"] = "merchant";
})(BlacklistType || (BlacklistType = {}));
export var BlacklistReason;
(function (BlacklistReason) {
    BlacklistReason["FRAUD"] = "fraud";
    BlacklistReason["DISPUTE_ABUSE"] = "dispute_abuse";
    BlacklistReason["PAYMENT_ISSUE"] = "payment_issue";
    BlacklistReason["VIOLATION"] = "violation";
    BlacklistReason["OTHER"] = "other";
})(BlacklistReason || (BlacklistReason = {}));
export var BlacklistStatus;
(function (BlacklistStatus) {
    BlacklistStatus["ACTIVE"] = "active";
    BlacklistStatus["INACTIVE"] = "inactive";
    BlacklistStatus["APPEALED"] = "appealed";
})(BlacklistStatus || (BlacklistStatus = {}));
