import React, { useState, useEffect } from 'react';

/**
 * 账户管理组件
 * 提供账户列表展示、余额显示、充值/提现、转账和冻结/解冻功能
 */

interface Account {
  id: string;
  address: string;
  balance: number;
  frozenAmount: number;
  status: 'active' | 'frozen' | 'inactive';
  createdAt: string;
  lastActivity: string;
}

interface TransferForm {
  toAddress: string;
  amount: number;
  memo: string;
}

interface DepositWithdrawForm {
  amount: number;
  type: 'deposit' | 'withdraw';
}

const AccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] = useState(false);
  const [transferForm, setTransferForm] = useState<TransferForm>({
    toAddress: '',
    amount: 0,
    memo: '',
  });
  const [depositWithdrawForm, setDepositWithdrawForm] = useState<DepositWithdrawForm>({
    amount: 0,
    type: 'deposit',
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 加载账户数据
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      showNotification('error', '加载账户数据失败');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 转账操作
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    setLoading(true);
    try {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress: selectedAccount.address,
          ...transferForm,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', '转账成功！');
        setShowTransferModal(false);
        setTransferForm({ toAddress: '', amount: 0, memo: '' });
        fetchAccounts();
      } else {
        showNotification('error', data.error || '转账失败');
      }
    } catch (error) {
      showNotification('error', '转账请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 充值/提现操作
  const handleDepositWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    setLoading(true);
    try {
      const endpoint = depositWithdrawForm.type === 'deposit' ? '/api/deposit' : '/api/withdraw';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: selectedAccount.address,
          amount: depositWithdrawForm.amount,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', `${depositWithdrawForm.type === 'deposit' ? '充值' : '提现'}成功！`);
        setShowDepositWithdrawModal(false);
        setDepositWithdrawForm({ amount: 0, type: 'deposit' });
        fetchAccounts();
      } else {
        showNotification('error', data.error || '操作失败');
      }
    } catch (error) {
      showNotification('error', '请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 冻结/解冻操作
  const handleFreezeToggle = async (account: Account) => {
    const action = account.status === 'frozen' ? '解冻' : '冻结';
    if (!confirm(`确定要${action}账户 ${account.address} 吗？`)) return;

    setLoading(true);
    try {
      const endpoint = account.status === 'frozen' ? '/api/unfreeze' : '/api/freeze';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address }),
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', `${action}成功！`);
        fetchAccounts();
      } else {
        showNotification('error', data.error || `${action}失败`);
      }
    } catch (error) {
      showNotification('error', '请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取状态徽章样式
  const getStatusBadge = (status: Account['status']) => {
    const badges = {
      active: 'bg-green-100 text-green-800 border-green-200',
      frozen: 'bg-blue-100 text-blue-800 border-blue-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    const labels = {
      active: '正常',
      frozen: '已冻结',
      inactive: '未激活',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // 格式化余额
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(balance);
  };

  // 统计信息
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalFrozen = accounts.reduce((sum, acc) => sum + acc.frozenAmount, 0);
  const activeCount = accounts.filter(acc => acc.status === 'active').length;

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
        <h1 className="text-3xl font-bold text-gray-900">账户管理</h1>
        <p className="text-gray-600 mt-2">管理您的账户、余额和转账操作</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">总账户数</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{accounts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">活跃账户</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{activeCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">总余额</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{formatBalance(totalBalance)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">冻结金额</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{formatBalance(totalFrozen)}</div>
        </div>
      </div>

      {/* 账户列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">账户列表</h2>
            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '刷新中...' : '刷新'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  账户地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  余额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  冻结金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后活动
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {account.address.substring(0, 10)}...{account.address.substring(account.address.length - 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatBalance(account.balance)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-orange-600">{formatBalance(account.frozenAmount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(account.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(account.lastActivity).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowTransferModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      转账
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowDepositWithdrawModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      充值/提现
                    </button>
                    <button
                      onClick={() => handleFreezeToggle(account)}
                      className={account.status === 'frozen' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}
                    >
                      {account.status === 'frozen' ? '解冻' : '冻结'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {accounts.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500">
            暂无账户数据
          </div>
        )}
      </div>

      {/* 转账模态框 */}
      {showTransferModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">转账</h3>
            <form onSubmit={handleTransfer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目标地址
                  </label>
                  <input
                    type="text"
                    value={transferForm.toAddress}
                    onChange={(e) => setTransferForm({ ...transferForm, toAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金额
                  </label>
                  <input
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备注
                  </label>
                  <input
                    type="text"
                    value={transferForm.memo}
                    onChange={(e) => setTransferForm({ ...transferForm, memo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? '处理中...' : '确认转账'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 充值/提现模态框 */}
      {showDepositWithdrawModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">充值/提现</h3>
            <form onSubmit={handleDepositWithdraw}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    操作类型
                  </label>
                  <select
                    value={depositWithdrawForm.type}
                    onChange={(e) => setDepositWithdrawForm({ ...depositWithdrawForm, type: e.target.value as 'deposit' | 'withdraw' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="deposit">充值</option>
                    <option value="withdraw">提现</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金额
                  </label>
                  <input
                    type="number"
                    value={depositWithdrawForm.amount}
                    onChange={(e) => setDepositWithdrawForm({ ...depositWithdrawForm, amount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDepositWithdrawModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? '处理中...' : '确认'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
