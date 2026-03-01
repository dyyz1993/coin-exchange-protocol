/**
 * 冻结类型枚举
 */
export var FreezeType;
(function (FreezeType) {
    /** 初始冻结 - 交易确认阶段，5分钟 */
    FreezeType["INITIAL"] = "INITIAL";
    /** 争议冻结 - 客服介入阶段，30分钟 */
    FreezeType["DISPUTE"] = "DISPUTE";
})(FreezeType || (FreezeType = {}));
/**
 * 冻结状态枚举
 */
export var FreezeStatus;
(function (FreezeStatus) {
    /** 冻结中 */
    FreezeStatus["FROZEN"] = "FROZEN";
    /** 已解冻 */
    FreezeStatus["UNFROZEN"] = "UNFROZEN";
    /** 已过期自动解冻 */
    FreezeStatus["EXPIRED"] = "EXPIRED";
})(FreezeStatus || (FreezeStatus = {}));
/**
 * 冻结配置
 */
export const FREEZE_CONFIG = {
    /** 初始冻结时长（毫秒）：5分钟 */
    INITIAL_DURATION: 5 * 60 * 1000,
    /** 争议冻结时长（毫秒）：30分钟 */
    DISPUTE_DURATION: 30 * 60 * 1000,
    /** 自动解冻检查间隔（毫秒）：1分钟 */
    AUTO_UNFREEZE_INTERVAL: 60 * 1000,
};
