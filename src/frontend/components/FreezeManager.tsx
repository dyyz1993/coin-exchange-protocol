/**
 * 冻结管理组件
 * 提供冻结申请表单、冻结记录列表、审核操作界面
 */

import React, { useState, useEffect } from 'react';

// 类型定义
interface FreezeRecord {
  id: string;
  accountId: string;
  accountAddress: string;
  freezeType: 'initial' | 'dispute' | 'full_account';
  amount: number;
  reason: string;
  status: 'pending' | 'active' | 'released' | 'expired';
  createdAt: string;
  expiresAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface FreezeFormData {
  accountAddress: string;
  freezeType: 'initial' | 'dispute' | 'full_account';
  amount: number;
  reason: string;
  duration?: number; // 天数
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const FreezeManager: React.FC = () => {
  const [freezeRecords, setFreezeRecords] = useState<FreezeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFreezeForm, setShowFreezeForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'pending'>('list');
  const [freezeData, setFreezeData] = useState<FreezeFormData>({
    accountAddress: '',
    freezeType: 'initial',
    amount: 0,
    reason: '',
    duration: 30
  });

  // API 基础 URL
  const API_BASE = 'http://localhost:3000/api';

  // 获取冻结记录
  useEffect(() => {
    fetchFreezeRecords();
  }, []);

  const fetchFreezeRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/freeze/records`);
      const result: ApiResponse<FreezeRecord[]> = await response.json();
      
      if (result.success && result.data) {
        setFreezeRecords(result.data);
        setError(null);
      } else {
        setError(result.error || '获取冻结记录失败');
      }
    } catch (err) {
      setError('网络错误，请检查后端服务是否启动');
      console.error('Fetch freeze records error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 申请冻结
  const handleFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const endpoint = freezeData.freezeType === 'initial' 
        ? '/freeze/initial'
        : freezeData.freezeType === 'dispute'
        ? '/freeze/dispute'
        : '/freeze/full-account';
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(freezeData)
      });
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success) {
        alert('冻结申请成功！');
        setShowFreezeForm(false);
        setFreezeData({
          accountAddress: '',
          freezeType: 'initial',
          amount: 0,
          reason: '',
          duration: 30
        });
        fetchFreezeRecords(); // 刷新记录列表
      } else {
        alert(`冻结申请失败: ${result.error}`);
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
      console.error('Freeze error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 解冻操作
  const handleUnfreeze = async (recordId: string) => {
    if (!confirm('确认要解冻该账户吗？')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/freeze/unfreeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId })
      });
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success) {
        alert('解冻成功！');
        fetchFreezeRecords();
      } else {
        alert(`解冻失败: ${result.error}`);
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
      console.error('Unfreeze error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
  };

  // 获取冻结类型标签
  const getFreezeTypeBadge = (type: FreezeRecord['freezeType']) => {
    const styles = {
      initial: 'bg-yellow-100 text-yellow-800',
      dispute: 'bg-orange-100 text-orange-800',
      full_account: 'bg-red-100 text-red-800'
    };
    const labels = {
      initial: '初始冻结',
      dispute: '争议冻结',
      full_account: '完全冻结'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  // 获取状态标签
  const getStatusBadge = (status: FreezeRecord['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      released: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-500'
    };
    const labels = {
      pending: '待审核',
      active: '生效中',
      released: '已解冻',
      expired: '已过期'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // 筛选记录
  const pendingRecords = freezeRecords.filter(r => r.status === 'pending');
  const activeRecords = freezeRecords.filter(r => r.status === 'active');
  const displayRecords = activeTab === 'pending' ? pendingRecords : freezeRecords;

  if (loading && freezeRecords.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 标题栏 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">冻结管理</h2>
        <div className="space-x-2">
          <button
            onClick={fetchFreezeRecords}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
          >
            刷新
          </button>
          <button
            onClick={() => setShowFreezeForm(!showFreezeForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            {showFreezeForm ? '取消' : '申请冻结'}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* 标签切换 */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-2 px-1 ${
            activeTab === 'list'
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          全部记录 ({freezeRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-1 ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          待审核 ({pendingRecords.length})
        </button>
      </div>

      {/* 冻结申请表单 */}
      {showFreezeForm && (
        <form onSubmit={handleFreeze} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">冻结申请表单</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                账户地址
              </label>
              <input
                type="text"
                value={freezeData.accountAddress}
                onChange={(e) => setFreezeData({...freezeData, accountAddress: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入要冻结的账户地址"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                冻结类型
              </label>
              <select
                value={freezeData.freezeType}
                onChange={(e) => setFreezeData({...freezeData, freezeType: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="initial">初始冻结</option>
                <option value="dispute">争议冻结</option>
                <option value="full_account">完全冻结</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                冻结金额
              </label>
              <input
                type="number"
                value={freezeData.amount}
                onChange={(e) => setFreezeData({...freezeData, amount: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                冻结期限（天）
              </label>
              <input
                type="number"
                value={freezeData.duration}
                onChange={(e) => setFreezeData({...freezeData, duration: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                冻结原因
              </label>
              <textarea
                value={freezeData.reason}
                onChange={(e) => setFreezeData({...freezeData, reason: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="请详细说明冻结原因..."
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? '处理中...' : '提交申请'}
          </button>
        </form>
      )}

      {/* 冻结记录列表 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                账户地址
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                冻结类型
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                冻结金额
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="font-mono text-sm text-gray-900">
                    {record.accountAddress.substring(0, 10)}...{record.accountAddress.substring(record.accountAddress.length - 8)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getFreezeTypeBadge(record.freezeType)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatAmount(record.amount)} 🪙
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(record.status)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(record.createdAt).toLocaleString('zh-CN')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {record.status === 'active' && (
                    <button
                      onClick={() => handleUnfreeze(record.id)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                    >
                      解冻
                    </button>
                  )}
                  {record.status === 'pending' && (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleUnfreeze(record.id)}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                      >
                        批准
                      </button>
                      <button
                        onClick={() => handleUnfreeze(record.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                      >
                        拒绝
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {displayRecords.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            暂无冻结记录
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {freezeRecords.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">总记录数</p>
              <p className="text-2xl font-bold text-gray-900">{freezeRecords.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">待审核</p>
              <p className="text-2xl font-bold text-orange-600">{pendingRecords.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">生效中</p>
              <p className="text-2xl font-bold text-blue-600">{activeRecords.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">冻结总额</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(activeRecords.reduce((sum, r) => sum + r.amount, 0))} 🪙
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreezeManager;
