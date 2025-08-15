'use client';

import { useState, useEffect } from 'react';
import { TodoItem, Project, ItemStatus, ItemType } from '@/types';
import { StorageManager } from '@/lib/storage';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Search,
  Filter,
  Edit3,
  Trash2,
  Save,
  X,
  Plus,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function ItemsPage() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredItems, setFilteredItems] = useState<TodoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TodoItem>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, searchTerm, statusFilter, typeFilter, projectFilter]);

  const loadData = () => {
    const itemsData = StorageManager.getItems();
    const projectsData = StorageManager.getProjects();
    setItems(itemsData);
    setProjects(projectsData);
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(item => item.projectId === projectFilter);
    }

    setFilteredItems(filtered);
  };

  const handleEdit = (item: TodoItem) => {
    setEditingItem(item.id);
    setEditForm({
      title: item.title,
      description: item.description,
      status: item.status,
      type: item.type
    });
  };

  const handleSave = (itemId: string) => {
    const updatedItem = StorageManager.updateItem(itemId, editForm);
    if (updatedItem) {
      setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      setEditingItem(null);
      setEditForm({});
    }
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const success = StorageManager.deleteItem(itemId);
      if (success) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        setSelectedItems(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(itemId);
          return newSelected;
        });
      }
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBatchDelete = () => {
    if (selectedItems.size === 0) {
      alert('Please select items to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      const remainingItems = items.filter(item => !selectedItems.has(item.id));

      selectedItems.forEach(itemId => {
        StorageManager.deleteItem(itemId);
      });

      setItems(remainingItems);
      setSelectedItems(new Set());
      setIsBatchMode(false);
      alert(`Successfully deleted ${selectedItems.size} items`);
    }
  };

  const selectedCount = selectedItems.size;
  const allSelected = filteredItems.length > 0 && selectedCount === filteredItems.length;
  const someSelected = selectedCount > 0 && selectedCount < filteredItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="mt-2 text-gray-600">View and manage all tasks</p>
        </div>

        {/* Batch Mode Controls */}
        {isBatchMode && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 text-sm text-blue-700 hover:text-blue-900"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : someSelected ? (
                    <div className="w-4 h-4 border-2 border-blue-600 bg-blue-600 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    </div>
                  ) : (
                    <Square className="w-4 h-4 border border-gray-300" />
                  )}
                  <span>Select All ({selectedCount}/{filteredItems.length})</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedCount})</span>
                </button>
                <button
                  onClick={() => {
                    setIsBatchMode(false);
                    setSelectedItems(new Set());
                  }}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Not start">Not Started</option>
              <option value="On progress">In Progress</option>
              <option value="Waiting for API">Waiting for API</option>
              <option value="Build UI">Build UI</option>
              <option value="Integration">Integration</option>
              <option value="Completed">Completed</option>
              <option value="Fix">Fix</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ItemType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Feature">Feature</option>
              <option value="Issue">Issue</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
                setProjectFilter('all');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>

            <button
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`px-4 py-2 rounded-md ${isBatchMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
            >
              {isBatchMode ? 'Exit Batch Mode' : 'Batch Mode'}
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Task List ({filteredItems.length} items)
              {selectedCount > 0 && (
                <span className="ml-2 text-sm text-blue-600">({selectedCount} selected)</span>
              )}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredItems.map(item => (
              <div key={item.id} className="p-6">
                {editingItem === item.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={editForm.status || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as ItemStatus }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Not start">Not Started</option>
                          <option value="On progress">In Progress</option>
                          <option value="Waiting for API">Waiting for API</option>
                          <option value="Build UI">Build UI</option>
                          <option value="Integration">Integration</option>
                          <option value="Completed">Completed</option>
                          <option value="Fix">Fix</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={editForm.type || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as ItemType }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Feature">Feature</option>
                          <option value="Issue">Issue</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSave(item.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setEditForm({});
                        }}
                        className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {isBatchMode && (
                        <button
                          onClick={() => handleSelectItem(item.id)}
                          className="flex-shrink-0"
                        >
                          {selectedItems.has(item.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 border border-gray-300" />
                          )}
                        </button>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <span className="text-sm text-gray-500">{getProjectName(item.projectId)}</span>
                        </div>
                        <p className="text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>Updated {formatRelativeTime(item.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <StatusBadge status={item.status} type={item.type} />
                      {!isBatchMode && (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks found</h3>
              <p className="mt-2 text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 