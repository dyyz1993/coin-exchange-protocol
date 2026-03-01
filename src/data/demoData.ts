/**
 * 金币交易协议 - 演示数据
 * 用于前端页面展示和截图
 */

// 示例账户数据
export const demoAccounts = [
  {
    id: 'acc-001',
    address: '0x1a2b3c4d5e6f7890',
    shortAddress: '0x1a2b...7890',
    balance: 12580.50,
    frozenAmount: 500.00,
    status: 'active' as const,
    createdAt: '2024-01-15 09:30:22',
    lastActive: '2026-03-01 15:42:10',
    totalTransactions: 156,
    level: 'VIP'
  },
  {
    id: 'acc-002',
    address: '0xabcd1234efgh5678',
    shortAddress: '0xabcd...5678',
    balance: 8750.25,
    frozenAmount: 1200.00,
    status: 'frozen' as const,
    createdAt: '2024-02-20 14:15:33',
    lastActive: '2026-02-28 11:20:45',
    totalTransactions: 89,
    level: '普通'
  },
  {
    id: 'acc-003',
    address: '0x9876zyxw5432vuts',
    shortAddress: '0x9876...vuts',
    balance: 3520.80,
    frozenAmount: 0,
    status: 'active' as const,
    createdAt: '2024-03-10 08:45:12',
    lastActive: '2026-03-01 16:10:55',
    totalTransactions: 234,
    level: 'VIP'
  },
  {
    id: 'acc-004',
    address: '0xdef09876abc12345',
    shortAddress: '0xdef0...2345',
    balance: 1200.00,
    frozenAmount: 300.00,
    status: 'active' as const,
    createdAt: '2024-04-05 16:20:44',
    lastActive: '2026-03-01 14:30:20',
    totalTransactions: 67,
    level: '普通'
  },
  {
    id: 'acc-005',
    address: '0xfedcba9876543210',
    shortAddress: '0xfedc...3210',
    balance: 25000.00,
    frozenAmount: 0,
    status: 'inactive' as const,
    createdAt: '2023-12-01 10:00:00',
    lastActive: '2025-11-15 09:15:30',
    totalTransactions: 412,
    level: 'VIP'
  }
];

// 冻结申请数据
export const demoFreezeRequests = [
  {
    id: 'fr-req-001',
    accountId: 'acc-002',
    accountAddress: '0xabcd...5678',
    amount: 1200.00,
    reason: '异常大额转账，涉嫌违规操作',
    requester: 'admin-001',
    requesterName: '张三',
    status: 'pending' as const,
    createdAt: '2026-03-01 10:30:15',
    priority: 'high' as const
  },
  {
    id: 'fr-req-002',
    accountId: 'acc-004',
    accountAddress: '0xdef0...2345',
    amount: 300.00,
    reason: '账户异常登录，安全风险',
    requester: 'admin-002',
    requesterName: '李四',
    status: 'approved' as const,
    createdAt: '2026-03-01 09:15:22',
    reviewedAt: '2026-03-01 10:00:45',
    reviewer: 'admin-003',
    reviewerName: '王五',
    priority: 'medium' as const
  },
  {
    id: 'fr-req-003',
    accountId: 'acc-001',
    accountAddress: '0x1a2b...7890',
    amount: 500.00,
    reason: '交易争议，需要客服介入',
    requester: 'admin-001',
    requesterName: '张三',
    status: 'approved' as const,
    createdAt: '2026-02-28 16:45:10',
    reviewedAt: '2026-02-28 17:20:30',
    reviewer: 'admin-003',
    reviewerName: '王五',
    priority: 'high' as const
  },
  {
    id: 'fr-req-004',
    accountAddress: '0x9876...vuts',
    accountId: 'acc-003',
    amount: 200.00,
    reason: '测试冻结申请',
    requester: 'admin-004',
    requesterName: '赵六',
    status: 'rejected' as const,
    createdAt: '2026-02-27 14:20:33',
    reviewedAt: '2026-02-27 15:10:12',
    reviewer: 'admin-003',
    reviewerName: '王五',
    rejectReason: '申请理由不充分',
    priority: 'low' as const
  },
  {
    id: 'fr-req-005',
    accountId: 'acc-005',
    accountAddress: '0xfedc...3210',
    amount: 800.00,
    reason: '长期未活跃账户安全检查',
    requester: 'admin-002',
    requesterName: '李四',
    status: 'pending' as const,
    createdAt: '2026-03-01 11:05:40',
    priority: 'medium' as const
  }
];

// 冻结记录数据
export const demoFreezeRecords = [
  {
    id: 'fz-rec-001',
    accountId: 'acc-002',
    accountAddress: '0xabcd...5678',
    frozenAmount: 1200.00,
    frozenBy: 'admin-003',
    frozenByName: '王五',
    reason: '异常大额转账，涉嫌违规操作',
    status: 'active' as const,
    frozenAt: '2026-03-01 10:00:45',
    expiresAt: '2026-03-31 10:00:45',
    type: 'DISPUTE' as const
  },
  {
    id: 'fz-rec-002',
    accountId: 'acc-001',
    accountAddress: '0x1a2b...7890',
    frozenAmount: 500.00,
    frozenBy: 'admin-003',
    frozenByName: '王五',
    reason: '交易争议，需要客服介入',
    status: 'active' as const,
    frozenAt: '2026-02-28 17:20:30',
    expiresAt: '2026-03-30 17:20:30',
    type: 'DISPUTE' as const
  },
  {
    id: 'fz-rec-003',
    accountId: 'acc-004',
    accountAddress: '0xdef0...2345',
    frozenAmount: 300.00,
    frozenBy: 'admin-003',
    frozenByName: '王五',
    reason: '账户异常登录，安全风险',
    status: 'unfrozen' as const,
    frozenAt: '2026-02-25 11:00:00',
    unfrozenAt: '2026-02-26 16:00:00',
    unfrozenBy: 'admin-002',
    unfrozenByName: '李四',
    unfreezeReason: '安全检查通过，已验证身份',
    type: 'INITIAL' as const
  },
  {
    id: 'fz-rec-004',
    accountId: 'acc-003',
    accountAddress: '0x9876...vuts',
    frozenAmount: 150.00,
    frozenBy: 'admin-001',
    frozenByName: '张三',
    reason: '疑似异常交易',
    status: 'unfrozen' as const,
    frozenAt: '2026-02-20 09:30:15',
    unfrozenAt: '2026-02-20 09:35:20',
    unfrozenBy: 'system',
    unfrozenByName: '系统自动',
    unfreezeReason: '初始冻结超时自动解冻',
    type: 'INITIAL' as const
  }
];

// 交易记录数据
export const demoTransactions = [
  {
    id: 'tx-001',
    type: 'transfer' as const,
    from: '0x1a2b...7890',
    to: '0x9876...vuts',
    fromAccountId: 'acc-001',
    toAccountId: 'acc-003',
    amount: 1500.00,
    fee: 1.50,
    status: 'completed' as const,
    timestamp: '2026-03-01 15:42:10',
    note: '项目合作款',
    blockNumber: 12345678
  },
  {
    id: 'tx-002',
    type: 'deposit' as const,
    to: '0xabcd...5678',
    toAccountId: 'acc-002',
    amount: 5000.00,
    fee: 0,
    status: 'completed' as const,
    timestamp: '2026-03-01 14:30:25',
    note: '充值',
    blockNumber: 12345679
  },
  {
    id: 'tx-003',
    type: 'withdraw' as const,
    from: '0xdef0...2345',
    fromAccountId: 'acc-004',
    amount: 800.00,
    fee: 2.00,
    status: 'pending' as const,
    timestamp: '2026-03-01 16:10:55',
    note: '提现申请',
    blockNumber: null
  },
  {
    id: 'tx-004',
    type: 'transfer' as const,
    from: '0x9876...vuts',
    to: '0x1a2b...7890',
    fromAccountId: 'acc-003',
    toAccountId: 'acc-001',
    amount: 2300.00,
    fee: 2.30,
    status: 'completed' as const,
    timestamp: '2026-03-01 13:15:40',
    note: '货款支付',
    blockNumber: 12345680
  },
  {
    id: 'tx-005',
    type: 'transfer' as const,
    from: '0xfedc...3210',
    to: '0xabcd...5678',
    fromAccountId: 'acc-005',
    toAccountId: 'acc-002',
    amount: 350.00,
    fee: 0.35,
    status: 'failed' as const,
    timestamp: '2026-02-28 11:20:45',
    note: '转账失败 - 余额不足',
    blockNumber: null,
    errorMessage: '账户余额不足'
  },
  {
    id: 'tx-006',
    type: 'deposit' as const,
    to: '0x1a2b...7890',
    toAccountId: 'acc-001',
    amount: 10000.00,
    fee: 0,
    status: 'completed' as const,
    timestamp: '2026-02-28 09:00:12',
    note: '大额充值',
    blockNumber: 12345675
  },
  {
    id: 'tx-007',
    type: 'withdraw' as const,
    from: '0x9876...vuts',
    fromAccountId: 'acc-003',
    amount: 2000.00,
    fee: 5.00,
    status: 'completed' as const,
    timestamp: '2026-02-27 16:45:33',
    note: '提现成功',
    blockNumber: 12345670
  }
];

// 统计数据
export const demoStatistics = {
  accounts: {
    total: 5,
    active: 3,
    frozen: 1,
    inactive: 1,
    totalBalance: 51051.55,
    totalFrozen: 2000.00
  },
  freezes: {
    pendingRequests: 2,
    approvedRequests: 2,
    rejectedRequests: 1,
    activeFreezes: 2,
    totalFrozenAmount: 1700.00
  },
  transactions: {
    total: 7,
    completed: 5,
    pending: 1,
    failed: 1,
    totalVolume: 21950.00,
    totalFees: 11.15
  }
};

// 导出所有演示数据
export const demoData = {
  accounts: demoAccounts,
  freezeRequests: demoFreezeRequests,
  freezeRecords: demoFreezeRecords,
  transactions: demoTransactions,
  statistics: demoStatistics
};
