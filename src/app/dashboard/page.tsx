'use client';

import { useState, useEffect } from 'react';
import { TodoItem, Project, ItemStatus } from '@/types';
import { StorageManager } from '@/lib/storage';
import { StatisticsCalculator } from '@/lib/statistics';
import { ProjectModal } from '@/components/project-modal';
import { QuickAddModal } from '@/components/quick-add-modal';
import { EditableModule } from '@/components/editable-module';
import { formatRelativeTime } from '@/lib/utils';
import { ExcelExporter } from '@/lib/excel-export';
import {
  Plus,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  GripVertical,
  AlertCircle,
  BarChart3,
  Archive
} from 'lucide-react';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectItemOrder, setProjectItemOrder] = useState<Record<string, string[]>>({});
  const [projectFilters, setProjectFilters] = useState<Record<string, { filterType: 'all' | 'Feature' | 'Issue', sortBy: 'status' | 'type' | 'updatedAt' | 'createdAt' | 'module' }>>({});
  const [archivingProject, setArchivingProject] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownOpen && !(event.target as Element).closest('.status-dropdown')) {
        setStatusDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusDropdownOpen]);

  const loadData = async () => {
    try {
      const projectsData = StorageManager.getProjects();
      const itemsData = StorageManager.getItems();

      // 为现有任务添加默认module字段（如果没有的话）
      const updatedItems = itemsData.map(item => ({
        ...item,
        module: (item as any).module || 'Other'
      }));

      // 如果有任务被更新，保存到存储
      if (updatedItems.length !== itemsData.length ||
        updatedItems.some((item, i) => item.module !== (itemsData[i] as any).module)) {
        for (const item of updatedItems) {
          StorageManager.updateItem(item.id, { module: item.module });
        }
      }

      setProjects(projectsData);
      setItems(updatedItems);

      // 初始化项目排序状态
      const orderState: Record<string, string[]> = {};
      projectsData.forEach(project => {
        const projectItems = updatedItems.filter(item => item.projectId === project.id);
        orderState[project.id] = projectItems.map(item => item.id);
      });
      setProjectItemOrder(orderState);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getProjectItems = (projectId: string) => {
    let projectItems = items.filter(item => item.projectId === projectId && item.status !== 'Archive' as ItemStatus);

    // 获取项目的过滤设置，如果没有则使用默认值
    const projectFilter = projectFilters[projectId] || { filterType: 'all', sortBy: 'status' };

    console.log('Getting project items for:', projectId, 'with filter:', projectFilter);

    // 应用类型过滤
    if (projectFilter.filterType !== 'all') {
      projectItems = projectItems.filter(item => item.type === projectFilter.filterType);
      console.log('After filtering by type:', projectFilter.filterType, 'items count:', projectItems.length);
    }

    // 按选择的排序方式排序
    console.log('Sorting by:', projectFilter.sortBy, 'items before sort:', projectItems.map(item => ({
      title: item.title,
      type: item.type,
      status: item.status,
      module: (item as any).module || 'Other',
      updatedAt: item.updatedAt,
      createdAt: item.createdAt
    })));

    const sortedItems = projectItems.sort((a, b) => {
      switch (projectFilter.sortBy) {
        case 'status':
          // Status：按状态优先级排序，Not start 排第一，Completed 排最后
          const statusPriority = {
            'Not start': 0,
            'On progress': 1,
            'Pending': 2,
            'Completed': 3
          };
          const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 0;
          const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 0;
          return aPriority - bPriority;

        case 'type':
          // Type：按类型排序，相同类型内按状态排序
          // Feature 应该排在 Issue 前面
          if (a.type !== b.type) {
            return a.type === 'Feature' ? -1 : 1;
          }
          // 相同类型内按状态排序，Not start 排第一，Completed 排最后
          const statusPriorityForType = {
            'Not start': 0,
            'On progress': 1,
            'Pending': 2,
            'Completed': 3
          };
          const aStatusPriority = statusPriorityForType[a.status as keyof typeof statusPriorityForType] || 0;
          const bStatusPriority = statusPriorityForType[b.status as keyof typeof statusPriorityForType] || 0;
          return aStatusPriority - bStatusPriority;

        case 'module':
          // Module：按 module 排序，相同 module 内按类型排序，再按状态排序
          const moduleA = (a as any).module || 'Other';
          const moduleB = (b as any).module || 'Other';
          if (moduleA !== moduleB) {
            return moduleA.localeCompare(moduleB);
          }
          // 相同 module 内按类型排序
          if (a.type !== b.type) {
            return a.type === 'Feature' ? -1 : 1;
          }
          // 相同类型内按状态排序，Not start 排第一，Completed 排最后
          const statusPriorityForModule = {
            'Not start': 0,
            'On progress': 1,
            'Pending': 2,
            'Completed': 3
          };
          const aStatusPriorityForModule = statusPriorityForModule[a.status as keyof typeof statusPriorityForModule] || 0;
          const bStatusPriorityForModule = statusPriorityForModule[b.status as keyof typeof statusPriorityForModule] || 0;
          return aStatusPriorityForModule - bStatusPriorityForModule;

        case 'updatedAt':
          // Updated：按最后更新时间排序（最新的在前）
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

        case 'createdAt':
          // Created：按创建时间排序（最新的在前）
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        default:
          return 0;
      }
    });

    console.log('Sorted items by:', projectFilter.sortBy, 'items:', sortedItems.map(item => ({ title: item.title, type: item.type, status: item.status })));
    return sortedItems;
  };

  const getProjectsByModule = () => {
    const moduleGroups: Record<string, Project[]> = {};

    projects.forEach(project => {
      const projectItems = items.filter(item => item.projectId === project.id);

      // 按任务的module分组
      projectItems.forEach(item => {
        const moduleName = (item as any).module || 'Other';
        if (!moduleGroups[moduleName]) {
          moduleGroups[moduleName] = [];
        }
        // 如果项目还没有在这个模块中，添加它
        if (!moduleGroups[moduleName].find(p => p.id === project.id)) {
          moduleGroups[moduleName].push(project);
        }
      });

      // 如果项目没有任何任务，归类到 "Other" 模块
      if (projectItems.length === 0) {
        if (!moduleGroups['Other']) {
          moduleGroups['Other'] = [];
        }
        if (!moduleGroups['Other'].find(p => p.id === project.id)) {
          moduleGroups['Other'].push(project);
        }
      }
    });

    return moduleGroups;
  };

  const handleExportAll = () => {
    ExcelExporter.exportToExcel({ projects, items }, 'all-todo-data');
  };

  const handleExportProject = (project: Project) => {
    const projectItems = items.filter(item => item.projectId === project.id);
    ExcelExporter.exportProjectTasks(project, projectItems);
  };

  const handleProjectAdded = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
  };

  const handleItemUpdate = (updatedItem: TodoItem) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleTaskAdded = (newTask: TodoItem) => {
    setItems(prev => [...prev, newTask]);

    // 更新排序状态，将新任务添加到项目排序的末尾
    setProjectItemOrder(prev => ({
      ...prev,
      [newTask.projectId]: [...(prev[newTask.projectId] || []), newTask.id]
    }));
  };

  const handleModuleUpdate = async (itemId: string, newModule: string) => {
    try {
      const updatedItem = StorageManager.updateItem(itemId, { module: newModule });
      if (updatedItem) {
        const updatedItems = items.map(item =>
          item.id === itemId ? updatedItem : item
        );
        setItems(updatedItems);
      }
    } catch (error) {
      console.error('Error updating module:', error);
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      setArchivingProject(projectId);
      // 归档功能暂时使用本地存储
      const projectItems = items.filter(item => item.projectId === projectId && item.status === 'Completed');
      let archivedCount = 0;

      for (const item of projectItems) {
        const updated = StorageManager.updateItem(item.id, { status: 'Archive' as ItemStatus });
        if (updated) archivedCount++;
      }

      if (archivedCount > 0) {
        // 重新加载数据以反映归档状态
        loadData();
        alert(`Successfully archived ${archivedCount} completed items`);
      } else {
        alert('No completed items to archive');
      }
    } catch (error) {
      console.error('Archive error:', error);
      alert('Failed to archive items');
    } finally {
      setArchivingProject(null);
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const success = StorageManager.deleteProject(projectToDelete.id);
      if (success) {
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        setItems(prev => prev.filter(item => item.projectId !== projectToDelete.id));
        setProjectToDelete(null);
      } else {
        alert('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const cancelDeleteProject = () => {
    setProjectToDelete(null);
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== itemId) {
      setDragOverItem(itemId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetItemId) return;

    const draggedItemData = items.find(item => item.id === draggedItem);
    const targetItemData = items.find(item => item.id === targetItemId);

    if (!draggedItemData || !targetItemData) return;

    // 确保两个项目在同一个项目中
    if (draggedItemData.projectId !== targetItemData.projectId) return;

    const projectId = draggedItemData.projectId;
    const currentOrder = projectItemOrder[projectId] || [];

    // 找到拖拽项目和目标项目在排序中的索引
    const draggedIndex = currentOrder.indexOf(draggedItem);
    const targetIndex = currentOrder.indexOf(targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // 创建新的排序数组
    const newOrder = [...currentOrder];

    // 移除拖拽的项目
    newOrder.splice(draggedIndex, 1);

    // 在目标位置插入拖拽的项目
    newOrder.splice(targetIndex, 0, draggedItem);

    // 更新排序状态
    setProjectItemOrder(prev => ({
      ...prev,
      [projectId]: newOrder
    }));

    // 更新项目的更新时间
    try {
      const updatedItem = StorageManager.updateItem(draggedItem, { updatedAt: new Date() });
      if (updatedItem) {
        const updatedItems = items.map(item =>
          item.id === draggedItem ? updatedItem : item
        );
        setItems(updatedItems);
      }
    } catch (error) {
      console.error('Error updating item order:', error);
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'border-green-200 bg-green-50';
      case 'On progress':
        return 'border-blue-200 bg-blue-50';
      case 'Pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'Not start':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return { bg: '#dcfce7', text: '#166534' };
      case 'On progress':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'Pending':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'Not start':
        return { bg: '#f3f4f6', text: '#374151' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const handleStatusClick = (itemId: string) => {
    setStatusDropdownOpen(statusDropdownOpen === itemId ? null : itemId);
  };

  const handleStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    try {
      const updatedItem = StorageManager.updateItem(itemId, { status: newStatus });
      if (updatedItem) {
        setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
        setStatusDropdownOpen(null);
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const updateProjectFilter = (projectId: string, filterType: 'all' | 'Feature' | 'Issue', sortBy: 'status' | 'type' | 'updatedAt' | 'createdAt' | 'module') => {
    console.log('Updating project filter:', { projectId, filterType, sortBy });
    setProjectFilters(prev => {
      const newFilters = {
        ...prev,
        [projectId]: { filterType, sortBy }
      };
      console.log('New project filters:', newFilters);
      return newFilters;
    });

    // 强制重新渲染
    setTimeout(() => {
      setItems(prev => [...prev]);
    }, 0);
  };

  const stats = StatisticsCalculator.calculateStatistics(items, projects);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Overview of all projects and tasks</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsQuickAddModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add Task</span>
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
            <button
              onClick={handleExportAll}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-8">
          {projects.map(project => {
            const projectItems = getProjectItems(project.id);
            const isExpanded = expandedProjects.has(project.id);
            const completedCount = projectItems.filter(item => item.status === 'Completed').length;
            const progressCount = projectItems.filter(item => item.status === 'On progress').length;

            return (
              <div key={project.id} className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleProject(project.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500">{project.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{completedCount}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{progressCount}</span>
                        </span>
                        <span>{projectItems.length} total</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setIsQuickAddModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Add task to this project"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchiveProject(project.id)}
                          disabled={archivingProject === project.id}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-md disabled:opacity-50"
                          title="Archive completed tasks"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportProject(project)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                          title="Export project tasks"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6">
                    {/* Project Filter and Sort Controls */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Filter</label>
                            <select
                              value={projectFilters[project.id]?.filterType || 'all'}
                              onChange={(e) => {
                                const currentFilter = projectFilters[project.id] || { filterType: 'all', sortBy: 'status' };
                                updateProjectFilter(project.id, e.target.value as 'all' | 'Feature' | 'Issue', currentFilter.sortBy);
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="all">All Types</option>
                              <option value="Feature">✨ Features</option>
                              <option value="Issue">🐛 Issues</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sort</label>
                            <select
                              value={projectFilters[project.id]?.sortBy || 'status'}
                              onChange={(e) => {
                                const currentFilter = projectFilters[project.id] || { filterType: 'all', sortBy: 'status' };
                                updateProjectFilter(project.id, currentFilter.filterType, e.target.value as 'status' | 'type' | 'updatedAt' | 'createdAt' | 'module');
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="status">Status</option>
                              <option value="type">Type</option>
                              <option value="module">Module</option>
                              <option value="updatedAt">Updated</option>
                              <option value="createdAt">Created</option>
                            </select>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {projectItems.length} tasks
                        </div>
                      </div>
                    </div>

                    {projectItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No tasks in this project
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projectItems.map((item, index) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, item.id)}
                            className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${draggedItem === item.id
                              ? 'opacity-50'
                              : dragOverItem === item.id
                                ? 'border-blue-300 bg-blue-50'
                                : getStatusStyle(item.status)
                              }`}
                          >
                            <div className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">
                                    {item.type === 'Feature' ? '✨' : '🐛'}
                                  </span>
                                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="relative status-dropdown">
                                  <button
                                    onClick={() => handleStatusClick(item.id)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors"
                                    style={{
                                      backgroundColor: getStatusColor(item.status).bg,
                                      color: getStatusColor(item.status).text
                                    }}
                                  >
                                    {item.status}
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                  </button>

                                  {statusDropdownOpen === item.id && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                      <div className="py-1">
                                        {(['Not start', 'On progress', 'Pending', 'Completed'] as ItemStatus[]).map((status) => (
                                          <button
                                            key={status}
                                            onClick={() => handleStatusChange(item.id, status)}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          >
                                            {status}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  Updated {formatRelativeTime(item.updatedAt)}
                                </span>
                                <EditableModule
                                  module={(item as any).module || 'Other'}
                                  onSave={(newModule) => handleModuleUpdate(item.id, newModule)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No projects yet</h3>
            <p className="mt-2 text-gray-500">Get started by creating your first project</p>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        )}

        {/* Modals */}
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onProjectAdded={handleProjectAdded}
        />

        <QuickAddModal
          isOpen={isQuickAddModalOpen}
          onClose={() => setIsQuickAddModalOpen(false)}
          onTaskAdded={handleTaskAdded}
          projects={projects}
          defaultProjectId={selectedProjectId}
        />

        {/* Delete Project Confirmation Modal */}
        {projectToDelete && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-200">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Delete Project</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to delete the project <strong>"{projectToDelete.name}"</strong>?
                  </p>
                  <p className="text-sm text-red-600">
                    This will also delete all {getProjectItems(projectToDelete.id).length} tasks in this project.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={cancelDeleteProject}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteProject}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 