/**
 * 订单系统类型定义
 */
export var OrderStatus;
(function (OrderStatus) {
    OrderStatus["DRAFT"] = "draft";
    OrderStatus["PENDING_PAYMENT"] = "pending_payment";
    OrderStatus["PAID"] = "paid";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["DISPUTED"] = "disputed";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (OrderStatus = {}));
export var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["PENDING"] = "pending";
    DisputeStatus["INVESTIGATING"] = "investigating";
    DisputeStatus["RESOLVED"] = "resolved";
    DisputeStatus["REJECTED"] = "rejected";
})(DisputeStatus || (DisputeStatus = {}));
