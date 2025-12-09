'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export default function DatabasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  useEffect(() => {
    // 页面加载时的初始化
  }, []);

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // 这里可以添加数据导出逻辑
      setMessage({ type: 'success', text: '数据导出功能正在开发中' });
    } catch {
      setMessage({ type: 'error', text: '数据导出失败' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">数据库管理</h1>
          <p className="text-gray-600">管理本地数据库和存储设置</p>
        </div>
        <Database className="w-8 h-8 text-blue-600" />
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
              message.type === 'error' ? <XCircle className="w-4 h-4" /> :
                <AlertTriangle className="w-4 h-4" />}
            {message.text}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">数据库状态</h2>
        <p className="text-gray-600 mb-4">
          本地数据库功能正在开发中。目前项目使用本地存储来保存数据。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">存储类型</h3>
            <p className="text-sm text-gray-600">本地存储 (localStorage)</p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">数据位置</h3>
            <p className="text-sm text-gray-600">浏览器本地存储</p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleExportData}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 inline mr-2" />
            导出数据
          </button>
        </div>
      </div>
    </div>
  );
} 