/**
 * 金币交易协议 - 前端应用主入口
 * 集成账户管理和冻结管理功能
 */

import React, { useState } from 'react';
import AccountManager from './components/AccountManager';
import FreezeManager from './components/FreezeManager';

type TabType = 'accounts' | 'freeze';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('accounts');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-3xl">🪙</span>
                <h1 className="ml-3 text-xl font-bold text-gray-900">
                  金币交易协议
                </h1>
              </div>
            </div>
            
            {/* 主导航 */}
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'accounts'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 账户管理
              </button>
              <button
                onClick={() => setActiveTab('freeze')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'freeze'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                ❄️ 冻结管理
              </button>
            </div>

            {/* 用户信息 */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">管</span>
                </div>
                <span className="text-sm text-gray-700">管理员</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 欢迎横幅 */}
        <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            欢迎使用金币交易协议管理系统
          </h2>
          <p className="text-blue-100">
            安全、高效的数字资产冻结与账户管理平台
          </p>
        </div>

        {/* 状态指示器 */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">系统状态</p>
                <p className="text-lg font-semibold text-green-600">运行中 ✓</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">API 连接</p>
                <p className="text-lg font-semibold text-green-600">已连接 ✓</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔗</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">最后更新</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleTimeString('zh-CN')}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🕐</span>
              </div>
            </div>
          </div>
        </div>

        {/* 动态内容区域 */}
        <div className="space-y-6">
          {activeTab === 'accounts' && <AccountManager />}
          {activeTab === 'freeze' && <FreezeManager />}
        </div>
      </main>

      {/* 底部信息栏 */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 金币交易协议开发团队. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700">文档</a>
              <a href="#" className="hover:text-gray-700">API</a>
              <a href="#" className="hover:text-gray-700">支持</a>
              <a href="https://github.com/dyyz1993/coin-exchange-protocol" className="hover:text-gray-700">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
