/**
 * 冻结类型枚举
 */
export declare enum FreezeType {
    /** 初始冻结 - 交易确认阶段，5分钟 */
    INITIAL = "INITIAL",
    /** 争议冻结 - 客服介入阶段，30分钟 */
    DISPUTE = "DISPUTE"
}
/**
 * 冻结状态枚举
 */
export declare enum FreezeStatus {
    /** 冻结中 */
    FROZEN = "FROZEN",
    /** 已解冻 */
    UNFROZEN = "UNFROZEN",
    /** 已过期自动解冻 */
    EXPIRED = "EXPIRED"
}
/**
 * 冻结记录接口
 */
export interface FreezeRecord {
    /** 冻结记录ID */
    id: string;
    /** 用户ID */
    userId: string;
    /** 冻结金额 */
    amount: number;
    /** 冻结类型 */
    type: FreezeType;
    /** 冻结状态 */
    status: FreezeStatus;
    /** 关联的交易ID */
    transactionId?: string;
    /** 冻结时间 */
    frozenAt: Date;
    /** 过期时间 */
    expiresAt: Date;
    /** 解冻时间 */
    unfrozenAt?: Date;
    /** 解冻原因 */
    unfreezeReason?: string;
    /** 备注 */
    remark?: string;
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date;
}
/**
 * 冻结配置
 */
export declare const FREEZE_CONFIG: {
    /** 初始冻结时长（毫秒）：5分钟 */
    readonly INITIAL_DURATION: number;
    /** 争议冻结时长（毫秒）：30分钟 */
    readonly DISPUTE_DURATION: number;
    /** 自动解冻检查间隔（毫秒）：1分钟 */
    readonly AUTO_UNFREEZE_INTERVAL: number;
};
/**
 * 创建冻结记录请求
 */
export interface CreateFreezeRequest {
    userId: string;
    amount: number;
    type: FreezeType;
    transactionId?: string;
    remark?: string;
}
/**
 * 解冻请求
 */
export interface UnfreezeRequest {
    freezeId: string;
    reason?: string;
}
/**
 * 冻结状态查询响应
 */
export interface FreezeStatusResponse {
    freezeId: string;
    userId: string;
    amount: number;
    type: FreezeType;
    status: FreezeStatus;
    frozenAt: Date;
    expiresAt: Date;
    remainingTime?: number;
}
/**
 * 冻结列表查询参数
 */
export interface FreezeListQuery {
    userId?: string;
    status?: FreezeStatus;
    type?: FreezeType;
    startTime?: Date;
    endTime?: Date;
    page?: number;
    pageSize?: number;
}
