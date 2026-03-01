import React, { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { validateAmount, validateAddress, isAmountInRange } from '../utils/validation';

// 类型定义
interface Account {
  id: string;
  address: string;
  balance: number;
  frozenAmount: number;
  status: 'active' | 'frozen' | 'inactive';
  createdAt: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  from?: string;
  to?: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export const AccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // 表单状态
  const [transferData, setTransferData] = useState({
    to: '',
    amount: '',
    note: '',
  });

  const [depositData, setDepositData] = useState({
    amount: '',
  });

  const [withdrawData, setWithdrawData] = useState({
    amount: '',
  });

  // 加载账户列表
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // 模拟 API 调用
      const mockAccounts: Account[] = [
        {
          id: '1',
          address: '0x1234...5678',
          balance: 1000.5,
          frozenAmount: 100,
          status: 'active',
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          address: '0xabcd...efgh',
          balance: 500.0,
          frozenAmount: 0,
          status: 'frozen',
          createdAt: '2024-02-20',
        },
      ];
      setAccounts(mockAccounts);
      toast.success('账户列表加载成功');
    } catch (error) {
      console.error('加载账户失败:', error);
      toast.error('加载账户失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 处理转账
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证收款地址
    if (!validateAddress(transferData.to)) {
      toast.error('请输入有效的收款地址');
      return;
    }

    // 验证金额
    const amount = validateAmount(transferData.amount);
    if (amount <= 0) {
      toast.error('请输入有效的转账金额');
      return;
    }

    setLoading(true);
    try {
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`转账成功！金额：${amount.toFixed(2)} 金币`);
      setShowTransferForm(false);
      setTransferData({ to: '', amount: '', note: '' });
    } catch (error) {
      toast.error('转账失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 处理充值
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证金额
    const amount = validateAmount(depositData.amount);
    if (amount <= 0) {
      toast.error('请输入有效的充值金额');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`充值成功！金额：${amount.toFixed(2)} 金币`);
      setShowDepositForm(false);
      setDepositData({ amount: '' });
    } catch (error) {
      toast.error('充值失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 处理提现
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证金额
    const amount = validateAmount(withdrawData.amount);
    if (amount <= 0) {
      toast.error('请输入有效的提现金额');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`提现成功！金额：${amount.toFixed(2)} 金币`);
      setShowWithdrawForm(false);
      setWithdrawData({ amount: '' });
    } catch (error) {
      toast.error('提现失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 冻结账户
  const handleFreeze = async (accountId: string) => {
    // 使用自定义确认对话框（这里简化处理，实际项目中应该创建一个确认对话框组件）
    const confirmed = window.confirm('确定要冻结此账户吗？');
    if (!confirmed) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('账户已冻结');
      loadAccounts();
    } catch (error) {
      toast.error('冻结失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 解冻账户
  const handleUnfreeze = async (accountId: string) => {
    const confirmed = window.confirm('确定要解冻此账户吗？');
    if (!confirmed) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('账户已解冻');
      loadAccounts();
    } catch (error) {
      toast.error('解冻失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 获取状态徽章颜色
  const getStatusBadge = (status: Account['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'frozen':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: Account['status']) => {
    switch (status) {
      case 'active':
        return '正常';
      case 'frozen':
        return '已冻结';
      case 'inactive':
        return '未激活';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">账户管理</h2>
        <p className="text-gray-600">管理所有用户账户、余额和交易</p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">总账户数</p>
          <p className="text-2xl font-bold text-blue-900">{accounts.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">正常账户</p>
          <p className="text-2xl font-bold text-green-900">
            {accounts.filter((a) => a.status === 'active').length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600">冻结账户</p>
          <p className="text-2xl font-bold text-red-900">
            {accounts.filter((a) => a.status === 'frozen').length}
          </p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowDepositForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          💰 充值
        </button>
        <button
          onClick={() => setShowWithdrawForm(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          💸 提现
        </button>
        <button
          onClick={() => setShowTransferForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 转账
        </button>
      </div>

      {/* 账户列表表格 */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                账户地址
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                可用余额
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                冻结金额
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
          <tbody className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-sm">{account.address}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-green-600 font-semibold">
                    {account.balance.toFixed(2)} 金币
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-red-600 font-semibold">
                    {account.frozenAmount.toFixed(2)} 金币
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(account.status)}`}
                  >
                    {getStatusText(account.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {account.status === 'active' ? (
                      <button
                        onClick={() => handleFreeze(account.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                      >
                        冻结
                      </button>
                    ) : account.status === 'frozen' ? (
                      <button
                        onClick={() => handleUnfreeze(account.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                      >
                        解冻
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 转账表单弹窗 */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">转账</h3>
            <form onSubmit={handleTransfer}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">收款地址</label>
                <input
                  type="text"
                  value={transferData.to}
                  onChange={(e) => setTransferData({ ...transferData, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">金额</label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">备注</label>
                <textarea
                  value={transferData.note}
                  onChange={(e) => setTransferData({ ...transferData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="可选"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? '处理中...' : '确认转账'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 充值表单弹窗 */}
      {showDepositForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">充值</h3>
            <form onSubmit={handleDeposit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">充值金额</label>
                <input
                  type="number"
                  value={depositData.amount}
                  onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? '处理中...' : '确认充值'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepositForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 提现表单弹窗 */}
      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">提现</h3>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">提现金额</label>
                <input
                  type="number"
                  value={withdrawData.amount}
                  onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? '处理中...' : '确认提现'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawForm(false)}
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

export default AccountManager;
