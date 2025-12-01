'use client';

import { useState, useEffect } from 'react';
import { TodoItem, ItemStatus, ItemType, Project } from '@/types';
import { StorageManager } from '@/lib/storage';
import { X, Plus, Save, List, FileText } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: (task: TodoItem) => void;
  projects: Project[];
  defaultProjectId?: number | null;
}

export function QuickAddModal({
  isOpen,
  onClose,
  onTaskAdded,
  projects,
  defaultProjectId
}: QuickAddModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ItemType>('Feature');
  const [status, setStatus] = useState<ItemStatus>('Not start');
  const [projectId, setProjectId] = useState<number | ''>(defaultProjectId ?? (projects[0]?.id ?? ''));
  const [module, setModule] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 批量输入相关状态
  const [inputMode, setInputMode] = useState<'single' | 'batch'>('single');
  const [batchInput, setBatchInput] = useState('');
  const [batchPreview, setBatchPreview] = useState<string[]>([]);

  // 确保 projectId 正确设置
  useEffect(() => {
    if (projects.length > 0) {
      const newProjectId = defaultProjectId ?? projects[0].id;
      if (newProjectId !== projectId) {
        setProjectId(newProjectId);
      }
    }
  }, [projects, defaultProjectId, projectId]);

  // 当模态框打开时，确保有默认项目
  useEffect(() => {
    if (isOpen && projects.length > 0 && !projectId) {
      setProjectId(defaultProjectId ?? projects[0].id);
    }
  }, [isOpen, projects, defaultProjectId, projectId]);

  // 解析批量输入
  const parseBatchInput = (input: string): string[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // 移除数字编号和点号 (如 "1.", "2.", "3." 等)
        return line.replace(/^\d+\.\s*/, '');
      });
  };

  // 处理批量输入变化
  const handleBatchInputChange = (value: string) => {
    setBatchInput(value);
    const parsed = parseBatchInput(value);
    setBatchPreview(parsed);
  };

  // 智能分类模块
  const classifyModule = (text: string): string => {
    const lowerText = text.toLowerCase();

    const moduleKeywords = {
      'Compliance': ['compliance', 'matrix', 'query', 'edit', 'regulation', 'policy', 'standard', 'audit', 'validation', 'certification', 'governance', 'risk', 'control'],
      'User Management': ['user', 'management', 'role', 'permission', 'access', 'control', 'rbac', 'user management', 'user admin', 'user profile', 'user settings', 'user account', 'non-cmp', 'cmp'],
      'Data Source': ['data source', 'datasource', 'data management', 'data view', 'view only', 'data access', 'data control', 'data restriction', 'data permission'],
      'Configuration': ['config', 'configuration', 'option', 'valid option', 'showSendBtn', 'boolean', 'property', 'setting', 'parameter', 'flag', 'toggle', 'switch'],
      'Content Management': ['content', 'topic', 're-gen', 'regeneration', 'content management', 'content generation', 'topic generation', 'content update', 'content refresh'],
      'Frontend': ['ui', 'ux', 'interface', 'user', 'client', 'browser', 'react', 'vue', 'angular', 'component', 'page', 'screen', 'view', 'layout', 'design', 'css', 'html', 'javascript', 'typescript', 'frontend', 'client-side'],
      'Backend': ['api', 'server', 'backend', 'service', 'controller', 'route', 'endpoint', 'database', 'model', 'schema', 'query', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql', 'node', 'express', 'python', 'java', 'php'],
      'Database': ['database', 'db', 'table', 'schema', 'migration', 'query', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql', 'redis', 'index', 'constraint', 'foreign key', 'primary key', 'relationship'],
      'Testing': ['test', 'testing', 'unit', 'integration', 'e2e', 'end-to-end', 'spec', 'jest', 'mocha', 'cypress', 'selenium', 'coverage', 'mock', 'stub', 'fixture'],
      'Security': ['security', 'auth', 'authentication', 'authorization', 'login', 'logout', 'password', 'token', 'jwt', 'oauth', 'encryption', 'hash', 'bcrypt', 'ssl', 'https', 'vulnerability', 'xss', 'csrf', 'sql injection'],
      'DevOps': ['deploy', 'deployment', 'ci', 'cd', 'pipeline', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'server', 'infrastructure', 'monitoring', 'logging', 'alert', 'backup', 'restore'],
      'UI/UX': ['ui', 'ux', 'design', 'user experience', 'interface', 'wireframe', 'prototype', 'mockup', 'user flow', 'interaction', 'usability', 'accessibility', 'responsive', 'mobile', 'desktop']
    };

    for (const [moduleName, keywords] of Object.entries(moduleKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return moduleName;
        }
      }
    }

    return 'Other';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === 'single') {
      // 单个任务添加
      if (!title.trim() || !projectId) {
        alert('Please fill in title and select project');
        return;
      }

      setIsSubmitting(true);

      try {
        const newTask = StorageManager.addItem({
          title: title.trim(),
          description: description.trim(),
          type,
          status,
          projectId,
          module: module.trim() || 'Other'
        });

        if (newTask) {
          onTaskAdded(newTask);
          handleClose();
        }
      } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // 批量任务添加
      console.log('Batch input validation:', {
        batchInput: batchInput,
        batchInputTrimmed: batchInput.trim(),
        batchInputLength: batchInput.trim().length,
        projectId: projectId,
        projectsLength: projects.length
      });

      if (!batchInput.trim()) {
        alert('Please enter batch input (task list)');
        return;
      }

      if (!projectId) {
        alert('Please select a project');
        return;
      }

      const tasks = parseBatchInput(batchInput);
      console.log('Parsed tasks:', tasks);

      if (tasks.length === 0) {
        alert('No valid tasks found. Please check your input format.');
        return;
      }

      setIsSubmitting(true);

      try {
        const addedTasks: TodoItem[] = [];

        for (const taskTitle of tasks) {
          if (taskTitle.trim()) {
            const taskModule = classifyModule(taskTitle);
            console.log(`Adding task: "${taskTitle}" to module: ${taskModule}`);

            const newTask = StorageManager.addItem({
              title: taskTitle.trim(),
              description: taskTitle.trim(), // 使用标题作为描述
              type,
              status,
              projectId,
              module: taskModule
            });

            if (newTask) {
              addedTasks.push(newTask);
              onTaskAdded(newTask);
            }
          }
        }

        if (addedTasks.length > 0) {
          alert(`Successfully added ${addedTasks.length} tasks!`);
          handleClose();
        } else {
          alert('No tasks were added. Please check your input.');
        }
      } catch (error) {
        console.error('Error adding batch tasks:', error);
        alert('Failed to add batch tasks: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setType('Feature');
    setStatus('Not start');
    setProjectId(defaultProjectId ?? (projects[0]?.id ?? ''));
    setModule('');
    setIsSubmitting(false);
    setBatchInput('');
    setBatchPreview([]);
    setInputMode('single');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Add Task</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => {
                const value = e.target.value;
                setProjectId(value === '' ? '' : parseInt(value, 10));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                <>
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {projects.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Please create a project first before adding tasks.
              </p>
            )}
          </div>

          {/* 输入模式切换 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Mode
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setInputMode('single')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${inputMode === 'single'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
              >
                <FileText className="w-4 h-4" />
                <span>Single Task</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('batch')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${inputMode === 'batch'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
              >
                <List className="w-4 h-4" />
                <span>Batch Input</span>
              </button>
            </div>
          </div>

          {inputMode === 'single' ? (
            // 单个任务输入
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module
                </label>
                <input
                  type="text"
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  placeholder="Enter module name (optional, defaults to 'Other')"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            // 批量任务输入
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Input *
                </label>
                <textarea
                  value={batchInput}
                  onChange={(e) => handleBatchInputChange(e.target.value)}
                  placeholder="Enter tasks (one per line, numbers will be automatically removed)
Example:
1.re-gen topic
2.compliance matrix query / edit
3.valid option now has a showSendBtn boolean
data source view only
user management view only view for non-CMP user"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {batchPreview.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview ({batchPreview.length} tasks)
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
                    {batchPreview.map((task, index) => (
                      <div key={index} className="text-sm text-gray-600 py-1">
                        • {task}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ItemType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Feature">Feature</option>
                <option value="Issue">Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
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
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (inputMode === 'batch' ? 'Adding Tasks...' : 'Adding...')
                  : (inputMode === 'batch' ? `Add ${batchPreview.length} Tasks` : 'Add Task')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 