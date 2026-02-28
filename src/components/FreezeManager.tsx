import React, { useState, useEffect } from 'react';

/**
 * 冻结管理组件
 * 提供冻结申请、冻结记录查询和审核操作功能
 */

interface FreezeRecord {
  id: string;
  accountId: string;
  accountAddress: string;
  type: 'initial' | 'dispute' | 'full';
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_unfrozen';
  createdAt: string;
  updatedAt: string;
  autoUnfreezeAt?: string;
  approver?: string;
  rejectReason?: string;
}

interface FreezeApplicationForm {
  accountAddress: string;
  type: 'initial' | 'dispute' | 'full';
  amount: number;
  reason: string;
  autoUnfreezeDays?: number;
}

const FreezeManager: React.FC = () => {
  const [freezeRecords, setFreezeRecords] = useState<FreezeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [applicationForm, setApplicationForm] = useState<FreezeApplicationForm>({
    accountAddress: '',
    type: 'initial',
    amount: 0,
    reason: '',
    autoUnfreezeDays: 30,
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 加载冻结记录
  useEffect(() => {
    fetchFreezeRecords();
  }, [filterStatus, filterType]);

  const fetchFreezeRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      
      const response = await fetch(`/api/freeze/records?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setFreezeRecords(data.data);
      }
    } catch (error) {
      showNotification('error', '加载冻结记录失败');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 提交冻结申请
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/freeze/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationForm),
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', '冻结申请已提交！');
        setShowApplicationModal(false);
        setApplicationForm({
          accountAddress: '',
          type: 'initial',
          amount: 0,
          reason: '',
          autoUnfreezeDays: 30,
        });
        fetchFreezeRecords();
      } else {
        showNotification('error', data.error || '申请失败');
      }
    } catch (error) {
      showNotification('error', '申请请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 审核通过
  const handleApprove = async (record: FreezeRecord) => {
    if (!confirm(`确定要通过冻结申请 ${record.id} 吗？`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/freeze/${record.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', '审核通过！');
        fetchFreezeRecords();
      } else {
        showNotification('error', data.error || '审核失败');
      }
    } catch (error) {
      showNotification('error', '审核请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 审核拒绝
  const handleReject = async (record: FreezeRecord) => {
    const reason = prompt('请输入拒绝原因：');
    if (!reason) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/freeze/${record.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', '已拒绝申请！');
        fetchFreezeRecords();
      } else {
        showNotification('error', data.error || '操作失败');
      }
    } catch (error) {
      showNotification('error', '请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 手动解冻
  const handleUnfreeze = async (record: FreezeRecord) => {
    if (!confirm(`确定要解冻账户 ${record.accountAddress} 吗？`)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/freeze/unfreeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freezeId: record.id }),
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', '解冻成功！');
        fetchFreezeRecords();
      } else {
        showNotification('error', data.error || '解冻失败');
      }
    } catch (error) {
      showNotification('error', '请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取状态徽章样式
  const getStatusBadge = (status: FreezeRecord['status']) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      auto_unfrozen: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    const labels = {
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      auto_unfrozen: '自动解冻',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // 获取类型徽章样式
  const getTypeBadge = (type: FreezeRecord['type']) => {
    const badges = {
      initial: 'bg-purple-100 text-purple-800 border-purple-200',
      dispute: 'bg-orange-100 text-orange-800 border-orange-200',
      full: 'bg-red-100 text-red-800 border-red-200',
    };
    const labels = {
      initial: '初始冻结',
      dispute: '争议冻结',
      full: '完全冻结',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badges[type]}`}>
        {labels[type]}
      </span>
    );
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  // 统计信息
  const pendingCount = freezeRecords.filter(r => r.status === 'pending').length;
  const approvedCount = freezeRecords.filter(r => r.status === 'approved').length;
  const totalFrozenAmount = freezeRecords
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 通知提示 */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">冻结管理</h1>
        <p className="text-gray-600 mt-2">管理账户冻结申请和审核</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">冻结记录总数</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{freezeRecords.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">待审核</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">{pendingCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">已批准</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{approvedCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">冻结总金额</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{formatAmount(totalFrozenAmount)}</div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowApplicationModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + 新建冻结申请
            </button>
            <button
              onClick={fetchFreezeRecords}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? '刷新中...' : '刷新'}
            </button>
          </div>
          <div className="flex gap-4 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒绝</option>
              <option value="auto_unfrozen">自动解冻</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部类型</option>
              <option value="initial">初始冻结</option>
              <option value="dispute">争议冻结</option>
              <option value="full">完全冻结</option>
            </select>
          </div>
        </div>
      </div>

      {/* 冻结记录列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">冻结记录</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  账户地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原因
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {freezeRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.id.substring(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.accountAddress.substring(0, 10)}...{record.accountAddress.substring(record.accountAddress.length - 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(record.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatAmount(record.amount)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={record.reason}>
                      {record.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {record.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(record)}
                          className="text-green-600 hover:text-green-900"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => handleReject(record)}
                          className="text-red-600 hover:text-red-900"
                        >
                          拒绝
                        </button>
                      </>
                    )}
                    {record.status === 'approved' && (
                      <button
                        onClick={() => handleUnfreeze(record)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        解冻
                      </button>
                    )}
                    {record.status === 'rejected' && record.rejectReason && (
                      <span className="text-gray-500 text-xs" title={record.rejectReason}>
                        已拒绝
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {freezeRecords.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500">
            暂无冻结记录
          </div>
        )}
      </div>

      {/* 冻结申请模态框 */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新建冻结申请</h3>
            <form onSubmit={handleSubmitApplication}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    账户地址
                  </label>
                  <input
                    type="text"
                    value={applicationForm.accountAddress}
                    onChange={(e) => setApplicationForm({ ...applicationForm, accountAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    冻结类型
                  </label>
                  <select
                    value={applicationForm.type}
                    onChange={(e) => setApplicationForm({ ...applicationForm, type: e.target.value as 'initial' | 'dispute' | 'full' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="initial">初始冻结</option>
                    <option value="dispute">争议冻结</option>
                    <option value="full">完全冻结</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    冻结金额
                  </label>
                  <input
                    type="number"
                    value={applicationForm.amount}
                    onChange={(e) => setApplicationForm({ ...applicationForm, amount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    冻结原因
                  </label>
                  <textarea
                    value={applicationForm.reason}
                    onChange={(e) => setApplicationForm({ ...applicationForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    自动解冻天数（可选）
                  </label>
                  <input
                    type="number"
                    value={applicationForm.autoUnfreezeDays}
                    onChange={(e) => setApplicationForm({ ...applicationForm, autoUnfreezeDays: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowApplicationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreezeManager;
