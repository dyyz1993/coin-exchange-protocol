import React, { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { confirm } from '../utils/confirm';
import { validateAmount, validateAccountId, isNotEmpty } from '../utils/validation';

// 类型定义
interface FreezeRequest {
  id: string;
  accountId: string;
  accountAddress: string;
  amount: number;
  reason: string;
  requester: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewer?: string;
}

interface FreezeRecord {
  id: string;
  accountId: string;
  accountAddress: string;
  frozenAmount: number;
  frozenBy: string;
  reason: string;
  status: 'active' | 'unfrozen';
  frozenAt: string;
  unfrozenAt?: string;
}

export const FreezeManager: React.FC = () => {
  const [freezeRequests, setFreezeRequests] = useState<FreezeRequest[]>([]);
  const [freezeRecords, setFreezeRecords] = useState<FreezeRecord[]>([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'records'>('requests');
  const [loading, setLoading] = useState(false);

  // 申请表单状态
  const [applyData, setApplyData] = useState({
    accountId: '',
    amount: '',
    reason: '',
  });

  // 审核筛选
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 加载数据
  useEffect(() => {
    loadFreezeRequests();
    loadFreezeRecords();
  }, []);

  const loadFreezeRequests = async () => {
    setLoading(true);
    try {
      // 模拟 API 调用
      const mockRequests: FreezeRequest[] = [
        {
          id: '1',
          accountId: 'acc-001',
          accountAddress: '0x1234...5678',
          amount: 500,
          reason: '涉嫌违规交易',
          requester: 'admin-001',
          status: 'pending',
          createdAt: '2024-03-01 10:30',
        },
        {
          id: '2',
          accountId: 'acc-002',
          accountAddress: '0xabcd...efgh',
          amount: 1000,
          reason: '异常大额转账',
          requester: 'admin-002',
          status: 'approved',
          createdAt: '2024-03-02 14:20',
          reviewedAt: '2024-03-02 15:00',
          reviewer: 'admin-003',
        },
        {
          id: '3',
          accountId: 'acc-003',
          accountAddress: '0x9876...5432',
          amount: 300,
          reason: '账户异常登录',
          requester: 'admin-001',
          status: 'rejected',
          createdAt: '2024-03-03 09:15',
          reviewedAt: '2024-03-03 10:30',
          reviewer: 'admin-003',
        },
      ];
      setFreezeRequests(mockRequests);
    } catch (error) {
      console.error('加载冻结申请失败:', error);
      toast.error('加载冻结申请失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadFreezeRecords = async () => {
    try {
      // 模拟 API 调用
      const mockRecords: FreezeRecord[] = [
        {
          id: 'fz-001',
          accountId: 'acc-002',
          accountAddress: '0xabcd...efgh',
          frozenAmount: 1000,
          frozenBy: 'admin-003',
          reason: '异常大额转账',
          status: 'active',
          frozenAt: '2024-03-02 15:00',
        },
        {
          id: 'fz-002',
          accountId: 'acc-004',
          accountAddress: '0xdef0...1234',
          frozenAmount: 800,
          frozenBy: 'admin-001',
          reason: '安全风险',
          status: 'unfrozen',
          frozenAt: '2024-02-28 11:00',
          unfrozenAt: '2024-03-01 16:00',
        },
      ];
      setFreezeRecords(mockRecords);
    } catch (error) {
      console.error('加载冻结记录失败:', error);
      toast.error('加载冻结记录失败：' + (error as Error).message);
    }
  };

  // 提交冻结申请
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证账户ID
    if (!validateAccountId(applyData.accountId)) {
      toast.error('请输入有效的账户ID（3-50个字符）');
      return;
    }

    // 验证金额
    const amount = validateAmount(applyData.amount);
    if (amount <= 0) {
      toast.error('请输入有效的冻结金额');
      return;
    }

    // 验证原因
    if (!isNotEmpty(applyData.reason)) {
      toast.error('请输入冻结原因');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('冻结申请已提交！');
      setShowApplyForm(false);
      setApplyData({ accountId: '', amount: '', reason: '' });
      loadFreezeRequests();
    } catch (error) {
      toast.error('提交失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 审核通过
  const handleApprove = async (_requestId: string) => {
    const confirmed = await confirm.show('确定要通过此冻结申请吗？', {
      title: '审核确认',
      type: 'warning',
      confirmText: '通过',
      cancelText: '取消',
    });
    if (!confirmed) {return;}

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('审核通过，账户已冻结');
      loadFreezeRequests();
      loadFreezeRecords();
    } catch (error) {
      toast.error('操作失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 审核拒绝
  const handleReject = async (_requestId: string) => {
    const confirmed = await confirm.show('确定要拒绝此冻结申请吗？', {
      title: '审核确认',
      type: 'danger',
      confirmText: '拒绝',
      cancelText: '取消',
    });
    if (!confirmed) {return;}

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('已拒绝申请');
      loadFreezeRequests();
    } catch (error) {
      toast.error('操作失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 解冻账户
  const handleUnfreeze = async (_recordId: string) => {
    const confirmed = await confirm.show('确定要解冻此账户吗？', {
      title: '解冻确认',
      type: 'info',
      confirmText: '解冻',
      cancelText: '取消',
    });
    if (!confirmed) {return;}

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('账户已解冻');
      loadFreezeRecords();
    } catch (error) {
      toast.error('操作失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status: FreezeRequest['status'] | FreezeRecord['status']) => {
    if (status === 'pending') {return 'bg-yellow-100 text-yellow-800';}
    if (status === 'approved' || status === 'active') {return 'bg-green-100 text-green-800';}
    if (status === 'rejected' || status === 'unfrozen') {return 'bg-red-100 text-red-800';}
    return 'bg-gray-100 text-gray-800';
  };

  // 获取状态文本
  const getStatusText = (status: FreezeRequest['status'] | FreezeRecord['status']) => {
    if (status === 'pending') {return '待审核';}
    if (status === 'approved') {return '已通过';}
    if (status === 'rejected') {return '已拒绝';}
    if (status === 'active') {return '冻结中';}
    if (status === 'unfrozen') {return '已解冻';}
    return status;
  };

  // 筛选申请
  const filteredRequests = freezeRequests.filter((req) => {
    if (statusFilter === 'all') {return true;}
    return req.status === statusFilter;
  });

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">冻结管理</h2>
        <p className="text-gray-600">管理账户冻结申请和冻结记录</p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-600">待审核申请</p>
          <p className="text-2xl font-bold text-yellow-900">
            {freezeRequests.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">已通过申请</p>
          <p className="text-2xl font-bold text-green-900">
            {freezeRequests.filter((r) => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">冻结中账户</p>
          <p className="text-2xl font-bold text-blue-900">
            {freezeRecords.filter((r) => r.status === 'active').length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600">总冻结金额</p>
          <p className="text-2xl font-bold text-purple-900">
            {freezeRecords
              .filter((r) => r.status === 'active')
              .reduce((sum, r) => sum + r.frozenAmount, 0)
              .toFixed(2)}
          </p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowApplyForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          📝 新建冻结申请
        </button>
      </div>

      {/* 标签页切换 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'requests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          冻结申请 ({freezeRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'records'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          冻结记录 ({freezeRecords.length})
        </button>
      </div>

      {/* 冻结申请列表 */}
      {activeTab === 'requests' && (
        <>
          {/* 筛选器 */}
          <div className="mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>

          {/* 申请表格 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申请ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    账户地址
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    冻结金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    冻结原因
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申请时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{request.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{request.accountAddress}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-red-600">
                        {request.amount.toFixed(2)} 金币
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{request.reason}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}
                      >
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <span className="text-sm text-gray-400">已处理</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 冻结记录列表 */}
      {activeTab === 'records' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  记录ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  账户地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  冻结金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  冻结原因
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  冻结时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {freezeRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm">{record.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm">{record.accountAddress}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-red-600">
                      {record.frozenAmount.toFixed(2)} 金币
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{record.reason}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(record.status)}`}
                    >
                      {getStatusText(record.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.frozenAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.status === 'active' ? (
                      <button
                        onClick={() => handleUnfreeze(record.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                      >
                        解冻
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">已解冻</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 冻结申请表单弹窗 */}
      {showApplyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">新建冻结申请</h3>
            <form onSubmit={handleApply}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">账户ID</label>
                <input
                  type="text"
                  value={applyData.accountId}
                  onChange={(e) => setApplyData({ ...applyData, accountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="acc-001"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">冻结金额</label>
                <input
                  type="number"
                  value={applyData.amount}
                  onChange={(e) => setApplyData({ ...applyData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">冻结原因</label>
                <textarea
                  value={applyData.reason}
                  onChange={(e) => setApplyData({ ...applyData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请详细说明冻结原因..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? '提交中...' : '提交申请'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 加载遮罩 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span>处理中...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreezeManager;
