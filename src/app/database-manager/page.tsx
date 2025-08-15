'use client';

import { useState, useEffect } from 'react';
import { TodoItem, Project } from '@/types';
import { StorageManager } from '@/lib/storage';
import { DatabaseStorageManager } from '@/lib/database-storage';
import { 
  Database, 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  FileText,
  HardDrive,
  ArrowRight,
  Trash2
} from 'lucide-react';

export default function DatabaseManagerPage() {
  const [localStorageProjects, setLocalStorageProjects] = useState<Project[]>([]);
  const [localStorageItems, setLocalStorageItems] = useState<TodoItem[]>([]);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [dbItems, setDbItems] = useState<TodoItem[]>([]);
  const [dbStatistics, setDbStatistics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [storageMode, setStorageMode] = useState<'localStorage' | 'database'>('localStorage');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 加载 localStorage 数据
      const lsProjects = StorageManager.getProjects();
      const lsItems = StorageManager.getItems();
      setLocalStorageProjects(lsProjects);
      setLocalStorageItems(lsItems);

      // 加载数据库数据
      const dbProjs = await DatabaseStorageManager.getProjects();
      const dbIts = await DatabaseStorageManager.getItems();
      const stats = await DatabaseStorageManager.getStatistics();
      
      setDbProjects(dbProjs);
      setDbItems(dbIts);
      setDbStatistics(stats);

      setStatus('数据加载完成');
    } catch (error) {
      setStatus(`加载失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const migrateToDatabase = async () => {
    if (localStorageProjects.length === 0 && localStorageItems.length === 0) {
      setStatus('没有 localStorage 数据需要迁移');
      return;
    }

    setIsLoading(true);
    try {
      const result = await DatabaseStorageManager.migrateFromLocalStorage({
        projects: localStorageProjects,
        items: localStorageItems
      });

      setStatus(`迁移成功！项目: ${result.migratedProjects}, 任务: ${result.migratedItems}`);
      await loadData(); // 重新加载数据
    } catch (error) {
      setStatus(`迁移失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportFromDatabase = async () => {
    setIsLoading(true);
    try {
      const data = await DatabaseStorageManager.exportData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todo-database-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('数据库数据导出成功');
    } catch (error) {
      setStatus(`导出失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const importToDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.projects && data.items) {
          const result = await DatabaseStorageManager.importData(data);
          setStatus(`导入成功！项目: ${result.importedProjects}, 任务: ${result.importedItems}`);
          await loadData(); // 重新加载数据
        } else {
          setStatus('导入失败：文件格式不正确');
        }
      } catch (error) {
        setStatus(`导入失败: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const clearDatabase = async () => {
    if (!confirm('确定要清空数据库吗？此操作不可恢复！')) {
      return;
    }

    setIsLoading(true);
    try {
      // 清空数据库（通过导入空数据）
      await DatabaseStorageManager.importData({ projects: [], items: [] });
      setStatus('数据库已清空');
      await loadData(); // 重新加载数据
    } catch (error) {
      setStatus(`清空失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createSampleData = async () => {
    setIsLoading(true);
    try {
      // 创建示例项目
      const sampleProject = await DatabaseStorageManager.addProject({
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

      await DatabaseStorageManager.addItems(sampleItems);
      setStatus('示例数据创建成功');
      await loadData(); // 重新加载数据
    } catch (error) {
      setStatus(`创建示例数据失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center space-x-3 mb-8">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">数据库管理器</h1>
        </div>

        {/* 状态显示 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">当前状态</h2>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* localStorage 状态 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="font-medium">localStorage</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>项目数量: <span className="font-medium">{localStorageProjects.length}</span></div>
                <div>任务数量: <span className="font-medium">{localStorageItems.length}</span></div>
              </div>
            </div>

            {/* 数据库状态 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <HardDrive className="w-5 h-5 text-green-600" />
                <h3 className="font-medium">数据库</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>项目数量: <span className="font-medium">{dbProjects.length}</span></div>
                <div>任务数量: <span className="font-medium">{dbItems.length}</span></div>
                <div>已完成: <span className="font-medium">{dbStatistics.completedItems || 0}</span></div>
                <div>进行中: <span className="font-medium">{dbStatistics.inProgressItems || 0}</span></div>
              </div>
            </div>
          </div>

          {status && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800">{status}</p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">数据操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={migrateToDatabase}
              disabled={isLoading || (localStorageProjects.length === 0 && localStorageItems.length === 0)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>迁移到数据库</span>
            </button>

            <button
              onClick={exportFromDatabase}
              disabled={isLoading || (dbProjects.length === 0 && dbItems.length === 0)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>导出数据库</span>
            </button>

            <label className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 cursor-pointer disabled:opacity-50">
              <Upload className="w-4 h-4" />
              <span>导入数据库</span>
              <input
                type="file"
                accept=".json"
                onChange={importToDatabase}
                className="hidden"
                disabled={isLoading}
              />
            </label>

            <button
              onClick={createSampleData}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>创建示例数据</span>
            </button>
          </div>

          <div className="mt-4">
            <button
              onClick={clearDatabase}
              disabled={isLoading || (dbProjects.length === 0 && dbItems.length === 0)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>清空数据库</span>
            </button>
          </div>
        </div>

        {/* 数据详情 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* localStorage 数据 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span>localStorage 数据</span>
            </h2>
            
            {localStorageProjects.length === 0 && localStorageItems.length === 0 ? (
              <p className="text-gray-500">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {localStorageProjects.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">项目列表</h3>
                    <div className="space-y-2">
                      {localStorageProjects.slice(0, 3).map(project => (
                        <div key={project.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium">{project.name}</div>
                          <div className="text-gray-600">{project.description}</div>
                        </div>
                      ))}
                      {localStorageProjects.length > 3 && (
                        <div className="text-sm text-gray-500">
                          还有 {localStorageProjects.length - 3} 个项目...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {localStorageItems.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">任务列表</h3>
                    <div className="space-y-2">
                      {localStorageItems.slice(0, 3).map(item => (
                        <div key={item.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-gray-600">{item.description}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {item.type}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {localStorageItems.length > 3 && (
                        <div className="text-sm text-gray-500">
                          还有 {localStorageItems.length - 3} 个任务...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 数据库数据 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-green-600" />
              <span>数据库数据</span>
            </h2>
            
            {dbProjects.length === 0 && dbItems.length === 0 ? (
              <p className="text-gray-500">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {dbProjects.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">项目列表</h3>
                    <div className="space-y-2">
                      {dbProjects.slice(0, 3).map(project => (
                        <div key={project.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium">{project.name}</div>
                          <div className="text-gray-600">{project.description}</div>
                        </div>
                      ))}
                      {dbProjects.length > 3 && (
                        <div className="text-sm text-gray-500">
                          还有 {dbProjects.length - 3} 个项目...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {dbItems.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">任务列表</h3>
                    <div className="space-y-2">
                      {dbItems.slice(0, 3).map(item => (
                        <div key={item.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-gray-600">{item.description}</div>
                          <div className="flex gap-2 mt-1">
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
                      {dbItems.length > 3 && (
                        <div className="text-sm text-gray-500">
                          还有 {dbItems.length - 3} 个任务...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">使用说明</h2>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• <strong>迁移到数据库</strong>: 将 localStorage 中的数据迁移到 SQLite 数据库</p>
            <p>• <strong>导出数据库</strong>: 将数据库中的数据导出为 JSON 文件</p>
            <p>• <strong>导入数据库</strong>: 从 JSON 文件导入数据到数据库</p>
            <p>• <strong>创建示例数据</strong>: 在数据库中创建示例项目和任务</p>
            <p>• <strong>清空数据库</strong>: 删除数据库中的所有数据</p>
            <p>• 数据库文件位置: <code className="bg-blue-100 px-1 rounded">data/todo.db</code></p>
          </div>
        </div>
      </div>
    </div>
  );
} 