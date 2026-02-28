/**
 * 账户管理组件
 * 提供账户列表展示、余额显示、转账表单功能
 */

import React, { useState, useEffect } from 'react';

// 类型定义
interface Account {
  id: string;
  address: string;
  balance: number;
  frozenAmount: number;
  status: 'active' | 'frozen' | 'inactive';
  createdAt: string;
}

interface TransferFormData {
  fromAddress: string;
  toAddress: string;
  amount: number;
  memo?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const AccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferData, setTransferData] = useState<TransferFormData>({
    fromAddress: '',
    toAddress: '',
    amount: 0,
    memo: ''
  });

  // API 基础 URL
  const API_BASE = 'http://localhost:3000/api';

  // 获取账户列表
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/accounts`);
      const result: ApiResponse<Account[]> = await response.json();
      
      if (result.success && result.data) {
        setAccounts(result.data);
        setError(null);
      } else {
        setError(result.error || '获取账户列表失败');
      }
    } catch (err) {
      setError('网络错误，请检查后端服务是否启动');
      console.error('Fetch accounts error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 转账操作
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success) {
        alert('转账成功！');
        setShowTransferForm(false);
        setTransferData({ fromAddress: '', toAddress: '', amount: 0, memo: '' });
        fetchAccounts(); // 刷新账户列表
      } else {
        alert(`转账失败: ${result.error}`);
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
      console.error('Transfer error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 格式化余额显示
  const formatBalance = (balance: number) => {
    return balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
  };

  // 获取状态徽章样式
  const getStatusBadge = (status: Account['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      frozen: 'bg-blue-100 text-blue-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      active: '正常',
      frozen: '已冻结',
      inactive: '未激活'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading && accounts.length === 0) {
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
        <h2 className="text-2xl font-bold text-gray-800">账户管理</h2>
        <div className="space-x-2">
          <button
            onClick={fetchAccounts}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
          >
            刷新
          </button>
          <button
            onClick={() => setShowTransferForm(!showTransferForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            {showTransferForm ? '取消' : '转账'}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* 转账表单 */}
      {showTransferForm && (
        <form onSubmit={handleTransfer} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">转账表单</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                转出地址
              </label>
              <input
                type="text"
                value={transferData.fromAddress}
                onChange={(e) => setTransferData({...transferData, fromAddress: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                转入地址
              </label>
              <input
                type="text"
                value={transferData.toAddress}
                onChange={(e) => setTransferData({...transferData, toAddress: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                转账金额
              </label>
              <input
                type="number"
                value={transferData.amount}
                onChange={(e) => setTransferData({...transferData, amount: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注（可选）
              </label>
              <input
                type="text"
                value={transferData.memo}
                onChange={(e) => setTransferData({...transferData, memo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50"
          >
            {loading ? '处理中...' : '确认转账'}
          </button>
        </form>
      )}

      {/* 账户列表 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                账户地址
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                可用余额
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="font-mono text-sm text-gray-900">
                    {account.address.substring(0, 10)}...{account.address.substring(account.address.length - 8)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatBalance(account.balance)} 🪙
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {formatBalance(account.frozenAmount)} 🪙
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(account.status)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(account.createdAt).toLocaleString('zh-CN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {accounts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            暂无账户数据
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {accounts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">总账户数</p>
              <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">总余额</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBalance(accounts.reduce((sum, acc) => sum + acc.balance, 0))} 🪙
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">冻结总额</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBalance(accounts.reduce((sum, acc) => sum + acc.frozenAmount, 0))} 🪙
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
