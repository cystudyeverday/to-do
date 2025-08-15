'use client';

import { useState, useEffect } from 'react';
import { TodoItem, Project } from '@/types';
import { StorageManager } from '@/lib/storage';

export default function RecoveryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [recoveryStatus, setRecoveryStatus] = useState<string>('');

  useEffect(() => {
    checkData();
  }, []);

  const checkData = () => {
    try {
      // 检查当前存储的数据
      const currentProjects = StorageManager.getProjects();
      const currentItems = StorageManager.getItems();

      setProjects(currentProjects);
      setItems(currentItems);

      // 检查 localStorage 原始数据
      const rawProjects = localStorage.getItem('todo_projects');
      const rawItems = localStorage.getItem('todo_items');

      setLocalStorageData({
        projects: rawProjects ? JSON.parse(rawProjects) : null,
        items: rawItems ? JSON.parse(rawItems) : null,
        projectsKey: rawProjects,
        itemsKey: rawItems
      });

      setRecoveryStatus(`检查完成 - 项目: ${currentProjects.length}, 任务: ${currentItems.length}`);
    } catch (error) {
      setRecoveryStatus(`检查失败: ${error}`);
    }
  };

  const clearAllData = () => {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      localStorage.removeItem('todo_projects');
      localStorage.removeItem('todo_items');
      setProjects([]);
      setItems([]);
      setLocalStorageData({});
      setRecoveryStatus('所有数据已清除');
    }
  };

  const createSampleData = () => {
    if (confirm('确定要创建示例数据吗？这将覆盖现有数据！')) {
      // 创建示例项目
      const sampleProject = StorageManager.addProject({
        name: '示例项目',
        description: '这是一个示例项目'
      });

      // 创建示例任务
      const sampleItems = [
        {
          title: '完成前端开发',
          description: '实现用户界面和交互功能',
          type: 'Feature' as const,
          status: 'On progress' as const,
          projectId: sampleProject.id,
          module: 'Frontend'
        },
        {
          title: '修复登录bug',
          description: '解决用户登录时的问题',
          type: 'Issue' as const,
          status: 'Fix' as const,
          projectId: sampleProject.id,
          module: 'Backend'
        },
        {
          title: '数据库优化',
          description: '优化数据库查询性能',
          type: 'Feature' as const,
          status: 'Not start' as const,
          projectId: sampleProject.id,
          module: 'Database'
        }
      ];

      sampleItems.forEach(item => {
        StorageManager.addItem(item);
      });

      checkData();
      setRecoveryStatus('示例数据已创建');
    }
  };

  const exportData = () => {
    const data = {
      projects: projects,
      items: items,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.projects && data.items) {
          localStorage.setItem('todo_projects', JSON.stringify(data.projects));
          localStorage.setItem('todo_items', JSON.stringify(data.items));
          checkData();
          setRecoveryStatus('数据导入成功');
        } else {
          setRecoveryStatus('导入失败：文件格式不正确');
        }
      } catch (error) {
        setRecoveryStatus(`导入失败: ${error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">数据恢复工具</h1>

        {/* 状态显示 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">当前状态</h2>
          <p className="text-gray-600 mb-2">{recoveryStatus}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">项目数量:</span> {projects.length}
            </div>
            <div>
              <span className="font-medium">任务数量:</span> {items.length}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">数据操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={checkData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              检查数据
            </button>
            <button
              onClick={createSampleData}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              创建示例数据
            </button>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              导出数据
            </button>
            <label className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 cursor-pointer text-center">
              导入数据
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
          <div className="mt-4">
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              清除所有数据
            </button>
          </div>
        </div>

        {/* 数据详情 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 项目列表 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">项目列表</h2>
            {projects.length === 0 ? (
              <p className="text-gray-500">暂无项目</p>
            ) : (
              <div className="space-y-2">
                {projects.map(project => (
                  <div key={project.id} className="p-3 border rounded">
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-gray-600">{project.description}</p>
                    <p className="text-xs text-gray-500">
                      创建时间: {new Date(project.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 任务列表 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">任务列表</h2>
            {items.length === 0 ? (
              <p className="text-gray-500">暂无任务</p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="p-3 border rounded">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {item.type}
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {item.status}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {(item as any).module || 'Other'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* localStorage 原始数据 */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">localStorage 原始数据</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">项目数据</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {localStorageData.projectsKey || 'null'}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">任务数据</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {localStorageData.itemsKey || 'null'}
              </pre>
            </div>
          </div>
        </div>

        {/* 故障排除 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">故障排除</h2>
          <div className="space-y-2 text-sm text-yellow-700">
            <p>• 如果数据丢失，可能是浏览器缓存被清除或 localStorage 被清空</p>
            <p>• 尝试使用"创建示例数据"功能重新开始</p>
            <p>• 如果有备份文件，可以使用"导入数据"功能恢复</p>
            <p>• 检查浏览器开发者工具中的 Console 是否有错误信息</p>
            <p>• 确保浏览器支持 localStorage 功能</p>
          </div>
        </div>
      </div>
    </div>
  );
} 