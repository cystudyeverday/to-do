'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TodoItem, Project, ItemStatus } from '@/types';
import { StorageManager } from '@/lib/storage';
import { StatisticsCalculator } from '@/lib/statistics';
import { ProjectModal } from '@/components/project-modal';
import { QuickAddModal } from '@/components/quick-add-modal';
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
  AlertCircle,
  BarChart3,
  Archive,
  Edit2,
  X,
  Check
} from 'lucide-react';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<number | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectFilters, setProjectFilters] = useState<Record<number, { sortBy: 'status' | 'updatedAt' | 'createdAt' | 'module' }>>({});
  const [archivingProject, setArchivingProject] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingProjectName, setEditingProjectName] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState<string>('');
  const [showCompletedItems, setShowCompletedItems] = useState<Record<number, boolean>>({});

  // Get selected project from URL params
  const selectedProjectFilter = searchParams.get('project') ? parseInt(searchParams.get('project')!, 10) : null;

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
      const projectsData = await StorageManager.getProjects();
      const itemsData = await StorageManager.getItems();

      // 为现有任务添加默认module字段（如果没有的话）
      interface ItemWithModule extends TodoItem { module?: string }
      const updatedItems = itemsData.map(item => ({
        ...item,
        module: (item as ItemWithModule).module || 'Other'
      }));

      // 如果有任务被更新，保存到存储
      if (updatedItems.length !== itemsData.length ||
        updatedItems.some((item, i) => item.module !== ((itemsData[i] as ItemWithModule).module || 'Other'))) {
        for (const item of updatedItems) {
          await StorageManager.updateItem(item.id, { module: item.module });
        }
      }

      setProjects(projectsData);
      setItems(updatedItems);

      // 默认展开所有项目
      const allProjectIds = new Set(projectsData.map(project => project.id));
      setExpandedProjects(allProjectIds);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getProjectItems = (projectId: number, includeCompleted: boolean = true) => {
    let projectItems = items.filter(item => item.projectId === projectId && item.status !== 'Archive' as ItemStatus);

    // Separate completed and unfinished items
    const unfinishedItems = projectItems.filter(item => item.status !== 'Completed');
    const completedItems = projectItems.filter(item => item.status === 'Completed');

    // If not showing completed, only return unfinished items
    if (!includeCompleted) {
      projectItems = unfinishedItems;
    }

    // 获取项目的过滤设置，如果没有则使用默认值
    const projectFilter = projectFilters[projectId] || { sortBy: 'status' };

    console.log('Getting project items for:', projectId, 'with filter:', projectFilter);

    // 按选择的排序方式排序
    console.log('Sorting by:', projectFilter.sortBy, 'items before sort:', projectItems.map(item => ({
      title: item.title,
      status: item.status,
      module: ((item as ItemWithModule).module) || 'Other',
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

        case 'module':
          // Module：按 module 排序，相同 module 内按状态排序
          interface ItemWithModule extends TodoItem { module?: string }
          const moduleA = (a as ItemWithModule).module || 'Other';
          const moduleB = (b as ItemWithModule).module || 'Other';
          if (moduleA !== moduleB) {
            return moduleA.localeCompare(moduleB);
          }
          // 相同 module 内按状态排序，Not start 排第一，Completed 排最后
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

    console.log('Sorted items by:', projectFilter.sortBy, 'items:', sortedItems.map(item => ({ title: item.title, status: item.status })));
    return { unfinished: unfinishedItems, completed: completedItems, all: sortedItems };
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
    // 自动展开新添加的项目
    setExpandedProjects(prev => new Set([...prev, newProject.id]));
  };


  const handleTaskAdded = (newTask: TodoItem) => {
    // 确保项目已展开，以便新任务可见
    setExpandedProjects(prev => {
      const newExpanded = new Set(prev);
      newExpanded.add(newTask.projectId);
      return newExpanded;
    });

    // 添加新任务到状态
    setItems(prev => [...prev, newTask]);
  };


  const handleArchiveProject = async (projectId: number) => {
    try {
      setArchivingProject(projectId);
      // Archive all items in the project (should all be completed when button is enabled)
      const projectItems = items.filter(item => item.projectId === projectId && item.status !== 'Archive' as ItemStatus);
      let archivedCount = 0;

      for (const item of projectItems) {
        const updated = await StorageManager.updateItem(item.id, { status: 'Archive' as ItemStatus });
        if (updated) archivedCount++;
      }

      if (archivedCount > 0) {
        // 重新加载数据以反映归档状态
        loadData();
        alert(`Successfully archived ${archivedCount} items. Project archived.`);
      } else {
        alert('No items to archive');
      }
    } catch (error) {
      console.error('Archive error:', error);
      alert('Failed to archive project');
    } finally {
      setArchivingProject(null);
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleProjectNameEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const handleProjectNameSave = async (projectId: number) => {
    try {
      const trimmedName = editingProjectName.trim();
      if (!trimmedName) {
        alert('Project name cannot be empty');
        return;
      }

      const updatedProject = await StorageManager.updateProject(projectId, { name: trimmedName });
      if (updatedProject) {
        setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
        setEditingProjectId(null);
        setEditingProjectName('');
      } else {
        alert('Failed to update project name');
      }
    } catch (error) {
      console.error('Error updating project name:', error);
      alert('Failed to update project name');
    }
  };

  const handleProjectNameCancel = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleItemTitleEdit = (item: TodoItem) => {
    setEditingItemId(item.id);
    setEditingItemTitle(item.title);
  };

  const handleItemTitleSave = async (itemId: number) => {
    try {
      const trimmedTitle = editingItemTitle.trim();
      if (!trimmedTitle) {
        alert('Title cannot be empty');
        return;
      }

      const updatedItem = await StorageManager.updateItem(itemId, { title: trimmedTitle });
      if (updatedItem) {
        setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
        setEditingItemId(null);
        setEditingItemTitle('');
      } else {
        alert('Failed to update task title');
      }
    } catch (error) {
      console.error('Error updating task title:', error);
      alert('Failed to update task title');
    }
  };

  const handleItemTitleCancel = () => {
    setEditingItemId(null);
    setEditingItemTitle('');
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const success = await StorageManager.deleteProject(projectToDelete.id);
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

  const handleStatusClick = (itemId: number) => {
    setStatusDropdownOpen(statusDropdownOpen === itemId ? null : itemId);
  };

  const handleStatusChange = async (itemId: number, newStatus: ItemStatus) => {
    try {
      const updatedItem = await StorageManager.updateItem(itemId, { status: newStatus });
      if (updatedItem) {
        // GraphQL 现在只更新提供的字段，返回完整对象，所以直接使用返回的数据
        setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
        setStatusDropdownOpen(null);
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const updateProjectFilter = (projectId: number, sortBy: 'status' | 'updatedAt' | 'createdAt' | 'module') => {
    console.log('Updating project filter:', { projectId, sortBy });
    setProjectFilters(prev => {
      const newFilters = {
        ...prev,
        [projectId]: { sortBy }
      };
      console.log('New project filters:', newFilters);
      return newFilters;
    });

    // 强制重新渲染
    setTimeout(() => {
      setItems(prev => [...prev]);
    }, 0);
  };

  // Filter projects and items based on selected project filter
  const filteredProjects = selectedProjectFilter
    ? projects.filter(p => p.id === selectedProjectFilter)
    : projects;

  const filteredItems = selectedProjectFilter
    ? items.filter(item => item.projectId === selectedProjectFilter)
    : items;

  const stats = StatisticsCalculator.calculateStatistics(filteredItems, filteredProjects);

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1.5 text-sm sm:text-base text-gray-600">
              {selectedProjectFilter
                ? `Overview of ${projects.find(p => p.id === selectedProjectFilter)?.name || 'selected project'}`
                : 'Overview of all projects and tasks'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsQuickAddModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add Task</span>
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2.5 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inProgressItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2.5 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Not Started</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.notStartedItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-5">
          {filteredProjects.map(project => {
            const showCompleted = showCompletedItems[project.id] ?? false; // Default to hiding completed items
            const projectItemsData = getProjectItems(project.id, showCompleted);
            const isExpanded = expandedProjects.has(project.id);
            const completedCount = projectItemsData.completed.length;
            const unfinishedCount = projectItemsData.unfinished.length;

            return (
              <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleProject(project.id)}
                        className="mt-0.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        {editingProjectId === project.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingProjectName}
                              onChange={(e) => setEditingProjectName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleProjectNameSave(project.id);
                                } else if (e.key === 'Escape') {
                                  handleProjectNameCancel();
                                }
                              }}
                              onBlur={() => handleProjectNameSave(project.id)}
                              className="text-base font-semibold text-gray-900 px-2 py-1 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <h3
                            className="text-base font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleProjectNameEdit(project)}
                            title="Click to edit project name"
                          >
                            {project.name}
                          </h3>
                        )}
                        {project.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-md">
                        {unfinishedCount > 0 && (
                          <>
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span className="font-semibold text-gray-700">{unfinishedCount}</span>
                            </div>
                            {completedCount > 0 && <div className="w-px h-3 bg-gray-300"></div>}
                          </>
                        )}
                        {completedCount > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="font-medium text-gray-600">{completedCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setIsQuickAddModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Add task"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchiveProject(project.id)}
                          disabled={archivingProject === project.id || unfinishedCount > 0 || completedCount === 0}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={unfinishedCount > 0 ? "Complete all tasks to archive project" : completedCount === 0 ? "No items to archive" : "Archive entire project"}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportProject(project)}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                          title="Export"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 pt-2">
                    {/* Project Sort Controls */}
                    <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-600">Sort:</label>
                        <select
                          value={projectFilters[project.id]?.sortBy || 'status'}
                          onChange={(e) => {
                            updateProjectFilter(project.id, e.target.value as 'status' | 'updatedAt' | 'createdAt' | 'module');
                          }}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="status">Status</option>
                          <option value="module">Module</option>
                          <option value="updatedAt">Updated</option>
                          <option value="createdAt">Created</option>
                        </select>
                      </div>
                      {completedCount > 0 && (
                        <button
                          onClick={() => setShowCompletedItems(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                          className="text-xs text-gray-600 hover:text-blue-600 font-medium px-2 py-0.5 hover:bg-blue-50 rounded transition-colors"
                        >
                          {showCompleted ? `Hide ${completedCount} completed` : `Show ${completedCount} completed`}
                        </button>
                      )}
                    </div>

                    {unfinishedCount === 0 && (!showCompleted || projectItemsData.completed.length === 0) ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                          <Plus className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">No tasks in this project</h3>
                        <p className="text-sm text-gray-500 mb-4">Get started by adding your first task to this project</p>
                        <button
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setIsQuickAddModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Your First Task
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {/* Unfinished Items */}
                        {projectItemsData.unfinished.map((item, index) => {
                          const orderKey = `${item.id}-${index}`;
                          return (
                            <div
                              key={orderKey}
                              className={`task-item group relative p-3 rounded-md border transition-all duration-300 ease-in-out hover:shadow-sm ${getStatusStyle(item.status)} hover:border-gray-300`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={item.status === 'Completed'}
                                    onChange={() => {
                                      const newStatus = item.status === 'Completed' ? 'Not start' as ItemStatus : 'Completed' as ItemStatus;
                                      handleStatusChange(item.id, newStatus);
                                    }}
                                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0"
                                    title={item.status === 'Completed' ? 'Mark as not completed' : 'Mark as completed'}
                                  />
                                  <div className="flex-1 min-w-0">
                                    {editingItemId === item.id ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={editingItemTitle}
                                          onChange={(e) => setEditingItemTitle(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleItemTitleSave(item.id);
                                            } else if (e.key === 'Escape') {
                                              handleItemTitleCancel();
                                            }
                                          }}
                                          onBlur={() => handleItemTitleSave(item.id)}
                                          className="flex-1 text-sm font-medium text-gray-900 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleItemTitleSave(item.id)}
                                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                          title="Save"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={handleItemTitleCancel}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Cancel"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-start gap-2">
                                        <h4 className={`text-sm font-medium text-gray-900 flex-1 leading-tight ${item.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>{item.title}</h4>
                                        <button
                                          onClick={() => handleItemTitleEdit(item)}
                                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                          title="Edit"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <div className="relative status-dropdown">
                                      <button
                                        onClick={() => handleStatusClick(item.id)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer transition-all"
                                        style={{
                                          backgroundColor: getStatusColor(item.status).bg,
                                          color: getStatusColor(item.status).text
                                        }}
                                      >
                                        {item.status}
                                        <ChevronDown className="w-2.5 h-2.5" />
                                      </button>
                                      {statusDropdownOpen === item.id && (
                                        <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                          <div className="py-1">
                                            {(['Not start', 'On progress', 'Pending', 'Completed'] as ItemStatus[]).map((status) => (
                                              <button
                                                key={status}
                                                onClick={() => handleStatusChange(item.id, status)}
                                                className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                                              >
                                                {status}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatRelativeTime(item.updatedAt)}
                                    </span>
                                  </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Completed Items */}
                        {showCompleted && projectItemsData.completed.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="mb-1.5 px-2">
                              <span className="text-xs font-medium text-gray-500">Completed ({projectItemsData.completed.length})</span>
                            </div>
                            <div className="space-y-1">
                              {projectItemsData.completed.map((item, index) => {
                                const orderKey = `completed-${item.id}-${index}`;
                                return (
                                  <div
                                    key={orderKey}
                                    className="task-item group relative p-2.5 rounded-md border border-gray-200 bg-gray-50 opacity-75 hover:opacity-100 transition-all duration-300 ease-in-out"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        {editingItemId === item.id ? (
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              type="text"
                                              value={editingItemTitle}
                                              onChange={(e) => setEditingItemTitle(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  handleItemTitleSave(item.id);
                                                } else if (e.key === 'Escape') {
                                                  handleItemTitleCancel();
                                                }
                                              }}
                                              onBlur={() => handleItemTitleSave(item.id)}
                                              className="flex-1 text-sm font-medium text-gray-900 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                              autoFocus
                                            />
                                            <button
                                              onClick={() => handleItemTitleSave(item.id)}
                                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                              title="Save"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={handleItemTitleCancel}
                                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                              title="Cancel"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-start gap-2">
                                            <h4 className="text-sm font-medium text-gray-600 flex-1 leading-tight line-through">{item.title}</h4>
                                            <button
                                              onClick={() => handleItemTitleEdit(item)}
                                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                              title="Edit"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <div className="relative status-dropdown">
                                            <button
                                              onClick={() => handleStatusClick(item.id)}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer transition-all"
                                              style={{
                                                backgroundColor: getStatusColor(item.status).bg,
                                                color: getStatusColor(item.status).text
                                              }}
                                            >
                                              {item.status}
                                              <ChevronDown className="w-2.5 h-2.5" />
                                            </button>

                                            {statusDropdownOpen === item.id && (
                                              <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                                <div className="py-1">
                                                  {(['Not start', 'On progress', 'Pending', 'Completed'] as ItemStatus[]).map((status) => (
                                                    <button
                                                      key={status}
                                                      onClick={() => handleStatusChange(item.id, status)}
                                                      className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                                                    >
                                                      {status}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatRelativeTime(item.updatedAt)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
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
                    This will also delete all {getProjectItems(projectToDelete.id, true).all.length} tasks in this project.
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