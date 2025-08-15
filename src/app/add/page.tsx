'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project, ItemType, ItemStatus, TodoItem } from '@/types';
import { StorageManager } from '@/lib/storage';
import { SmartSplitter, SplitResult } from '@/lib/smart-split';
import { APIExtractor } from '@/lib/api-extractor';
import { CursorAPIExtractor } from '@/lib/cursor-api-extractor';
import { ProjectModal } from '@/components/project-modal';
import { BatchManager } from '@/components/batch-manager';
import { APIKeyModal } from '@/components/api-key-modal';
import { Plus, Sparkles, Check, X, Edit3, ArrowLeft, Zap, Cpu, Key, Settings } from 'lucide-react';

export default function AddPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [splitResults, setSplitResults] = useState<SplitResult[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [projectSummary, setProjectSummary] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState<'local' | 'api' | 'cursor' | 'agent'>('local');
  const [apiAvailable, setApiAvailable] = useState(false);
  const [cursorApiAvailable, setCursorApiAvailable] = useState(false);
  const [extractionConfidence, setExtractionConfidence] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [maxTasks, setMaxTasks] = useState(5);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [extractionStats, setExtractionStats] = useState<{
    model?: string;
    tokens_used?: number;
    processing_time?: number;
  } | null>(null);
  const [agentInput, setAgentInput] = useState('');
  const [agentOutput, setAgentOutput] = useState('');
  const [showAgentMode, setShowAgentMode] = useState(false);

  useEffect(() => {
    const projectsData = StorageManager.getProjects();
    setProjects(projectsData);
    if (projectsData.length > 0) {
      setSelectedProject(projectsData[0].id);
    }

    // 检查API可用性
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    try {
      const isHealthy = await APIExtractor.checkAPIHealth();
      setApiAvailable(isHealthy);
    } catch (error) {
      console.log('Local API not available');
      setApiAvailable(false);
    }

    try {
      // 检查localStorage中的API key
      const cursorKey = localStorage.getItem('cursor_api_key');
      if (cursorKey) {
        const isCursorHealthy = await CursorAPIExtractor.testConnection(cursorKey);
        setCursorApiAvailable(isCursorHealthy);
      } else {
        // 如果没有localStorage中的key，检查环境变量
        try {
          const response = await fetch('/api/cursor-config');
          if (response.ok) {
            const config = await response.json();
            if (config.hasApiKey) {
              // 如果环境变量中有API key，测试连接
              const testResponse = await fetch('/api/test-cursor-connection');
              if (testResponse.ok) {
                const testResult = await testResponse.json();
                setCursorApiAvailable(testResult.success);
              } else {
                setCursorApiAvailable(false);
              }
            } else {
              setCursorApiAvailable(false);
            }
          } else {
            setCursorApiAvailable(false);
          }
        } catch (error) {
          setCursorApiAvailable(false);
        }
      }
    } catch (error) {
      console.log('Cursor API not available');
      setCursorApiAvailable(false);
    }
  };

  const generateAgentPrompt = (projectName: string, description: string): string => {
    return `Project: ${projectName}

Please analyze the following project description and break it down into 3-8 specific, actionable tasks.

Project Description:
${description}

Requirements:
- Extract 3-8 specific, actionable tasks
- Each task should be clear, measurable, and implementable
- Classify tasks as either "Feature" (new functionality) or "Issue" (bug fix/improvement)
- Provide concise but descriptive titles and detailed descriptions
- Set status to "Not start" for all tasks
- Assign appropriate module names based on task content (e.g., "Frontend", "Backend", "Database", "Testing", "UI/UX", "API", "Security", "Compliance", "User Management", etc.)

Specialized patterns to recognize and handle:
- Re-generation of topics or content (re-gen topic)
- Compliance matrix queries and editing functionality
- Valid option configurations with showSendBtn boolean properties
- Data source view-only implementations
- User management view-only access for non-CMP users
- Enterprise application patterns and security considerations

Additional considerations:
- Pay special attention to compliance, security, and access control requirements
- Include proper validation and error handling considerations
- Consider user role-based access control (RBAC) implementations
- Handle boolean properties like showSendBtn appropriately
- Ensure proper data source management and view-only restrictions

Please return the tasks in the following JSON format:
[
  {
    "title": "Task title",
    "description": "Detailed task description",
    "type": "Feature" or "Issue",
    "status": "Not start",
    "module": "Module name"
  }
]

Return only the JSON array, no additional text.`;
  };

  const handleAgentOutput = () => {
    try {
      // 尝试解析Agent返回的JSON
      const tasks = JSON.parse(agentOutput);

      if (!Array.isArray(tasks)) {
        alert('Invalid format. Please ensure the output is a JSON array.');
        return;
      }

      // 验证任务格式
      const validTasks = tasks.filter((task: any) =>
        task.title && task.description && task.type && task.status
      );

      if (validTasks.length === 0) {
        alert('No valid tasks found in the output.');
        return;
      }

      // 转换为SplitResult格式
      const results: SplitResult[] = validTasks.map((task: any) => ({
        title: task.title,
        description: task.description,
        type: task.type as ItemType,
        status: task.status as ItemStatus,
        module: task.module || 'Other',
        summary: task.description.substring(0, 100) + (task.description.length > 100 ? '...' : ''),
      }));

      // 生成总结
      const featureCount = results.filter(t => t.type === 'Feature').length;
      const issueCount = results.filter(t => t.type === 'Issue').length;
      const summary = `${results.length} tasks identified (${featureCount} features, ${issueCount} issues)`;

      setSplitResults(results);
      setProjectSummary(summary);
      setExtractionConfidence(0.9); // Agent 模式置信度较高
      setExtractionStats({ model: 'Cursor Agent', processing_time: 0 });
      setShowAgentMode(false);
      setShowPreview(true);
    } catch (error) {
      alert('Failed to parse the output. Please check the JSON format.');
    }
  };

  const handleSmartSplit = async () => {
    if (!selectedProject || !description.trim()) {
      alert('Please select a project and enter description');
      return;
    }

    setIsSplitting(true);
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    try {
      let results: SplitResult[];
      let summary: string;
      let confidence = 0;
      let stats = null;

      if (extractionMethod === 'agent') {
        // Cursor Agent 模式
        setAgentInput(generateAgentPrompt(project.name, description));
        setShowAgentMode(true);
        setIsSplitting(false);
        return;
      } else if (extractionMethod === 'cursor' && cursorApiAvailable) {
        // 使用Cursor API提取
        const cursorResponse = await CursorAPIExtractor.extractTasks({
          text: description,
          projectName: project.name,
          language: 'en',
          model: selectedModel as any,
          maxTasks,
          context: 'Web application development with React/Next.js'
        });
        results = cursorResponse.tasks;
        summary = cursorResponse.summary;
        confidence = cursorResponse.confidence;
        stats = {
          model: cursorResponse.model,
          tokens_used: cursorResponse.tokens_used,
          processing_time: cursorResponse.processing_time,
        };
      } else if (extractionMethod === 'api' && apiAvailable) {
        // 使用本地API提取
        const apiResponse = await APIExtractor.extractTasks({
          text: description,
          projectName: project.name,
          language: 'en'
        });
        results = apiResponse.tasks;
        summary = apiResponse.summary;
        confidence = apiResponse.confidence;
      } else {
        // 使用本地提取
        results = SmartSplitter.splitDescription(project.name, description);
        summary = SmartSplitter.generateProjectSummary(description);
        confidence = 0.8; // 本地提取的默认置信度
      }

      setSplitResults(results);
      setProjectSummary(summary);
      setExtractionConfidence(confidence);
      setExtractionStats(stats);
      setIsSplitting(false);
      setShowPreview(true);
    } catch (error) {
      console.error('Smart split failed:', error);
      alert('Failed to split tasks. Please try again.');
      setIsSplitting(false);
    }
  };

  const handleProjectAdded = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject.id);
  };

  const handleSaveAll = () => {
    if (splitResults.length === 0) {
      alert('Please generate tasks first');
      return;
    }

    try {
      const project = projects.find(p => p.id === selectedProject);
      if (!project) {
        alert('Project not found');
        return;
      }

      const savedItems: TodoItem[] = [];
      splitResults.forEach(result => {
        const newItem = StorageManager.addItem({
          title: result.title,
          description: result.description,
          type: result.type,
          status: result.status as ItemStatus,
          projectId: selectedProject,
          module: result.module || 'Other'
        });
        savedItems.push(newItem);
      });

      alert(`Successfully added ${savedItems.length} tasks to project "${project.name}"`);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving tasks:', error);
      alert('Failed to save tasks. Please try again.');
    }
  };

  const handleEditResult = (index: number, field: keyof SplitResult, value: string | ItemType) => {
    const newResults = [...splitResults];
    newResults[index] = { ...newResults[index], [field]: value };
    setSplitResults(newResults);
  };

  const handleRemoveResult = (index: number) => {
    setSplitResults(splitResults.filter((_, i) => i !== index));
  };

  const handleBatchUpdate = (updatedResults: SplitResult[]) => {
    setSplitResults(updatedResults);
  };

  const handleBackToInput = () => {
    setShowPreview(false);
    setSplitResults([]);
    setProjectSummary('');
    setExtractionConfidence(0);
    setExtractionStats(null);
  };

  const handleRegenerate = () => {
    setShowPreview(false);
    setSplitResults([]);
    setProjectSummary('');
    setExtractionConfidence(0);
    setExtractionStats(null);
    handleSmartSplit();
  };

  const handleApiKeySave = (apiKey: string) => {
    setCursorApiAvailable(true);
    checkAPIHealth();
  };

  const getExtractionMethodInfo = () => {
    switch (extractionMethod) {
      case 'agent':
        return {
          name: 'Cursor Agent',
          description: 'Use Cursor Agent for intelligent task extraction',
          icon: <Zap className="w-4 h-4" />,
          available: true,
          color: 'text-purple-600'
        };
      case 'cursor':
        return {
          name: 'Cursor AI',
          description: 'Advanced AI-powered task extraction using Cursor API',
          icon: <Zap className="w-4 h-4" />,
          available: cursorApiAvailable,
          color: 'text-purple-600'
        };
      case 'api':
        return {
          name: 'Local API',
          description: 'Server-side task extraction with local processing',
          icon: <Settings className="w-4 h-4" />,
          available: apiAvailable,
          color: 'text-blue-600'
        };
      default:
        return {
          name: 'Local Extraction',
          description: 'Fast client-side extraction using predefined rules',
          icon: <Cpu className="w-4 h-4" />,
          available: true,
          color: 'text-green-600'
        };
    }
  };

  if (showAgentMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAgentMode(false)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Input</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Cursor Agent Mode</h1>
                <p className="mt-2 text-gray-600">Copy the prompt to Cursor Agent and paste the result back</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Prompt for Cursor Agent</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Copy this prompt to Cursor Agent:</label>
                  <textarea
                    value={agentInput}
                    readOnly
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  />
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(agentInput)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Paste Agent Response</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paste the JSON response from Cursor Agent:</label>
                  <textarea
                    value={agentOutput}
                    onChange={(e) => setAgentOutput(e.target.value)}
                    placeholder="Paste the JSON array from Cursor Agent here..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAgentOutput}
                    disabled={!agentOutput.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Process Response
                  </button>
                  <button
                    onClick={() => setAgentOutput('')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">How to use Cursor Agent:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Copy the prompt from the left panel</li>
              <li>Open Cursor editor and activate the Agent (Cmd/Ctrl + K)</li>
              <li>Paste the prompt and ask the Agent to analyze it</li>
              <li>Copy the JSON response from the Agent</li>
              <li>Paste it in the right panel and click "Process Response"</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (showPreview) {
    const methodInfo = getExtractionMethodInfo();

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToInput}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Input</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Preview Generated Tasks</h1>
                <p className="mt-2 text-gray-600">Review and edit tasks before adding them</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRegenerate}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Sparkles className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
              <button
                onClick={handleSaveAll}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                <span>Add All Tasks</span>
              </button>
            </div>
          </div>

          {/* Extraction Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Extraction Summary</h3>
                <p className="text-sm text-blue-700">{projectSummary}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {methodInfo.icon}
                  <span className={`text-sm font-medium ${methodInfo.color}`}>
                    {methodInfo.name}
                  </span>
                </div>
                <div className="text-xs text-blue-600">
                  Confidence: {Math.round(extractionConfidence * 100)}%
                </div>
                {extractionStats && (
                  <div className="text-xs text-blue-600">
                    Model: {extractionStats.model} |
                    Tokens: {extractionStats.tokens_used} |
                    Time: {extractionStats.processing_time}ms
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Generated Tasks ({splitResults.length})
                </h2>
                <div className="text-sm text-gray-500">
                  Review and edit tasks before adding them to your project
                </div>
              </div>

              <div className="space-y-3">
                {splitResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={result.title}
                          onChange={(e) => handleEditResult(index, 'title', e.target.value)}
                          className="w-full font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                        />
                        <textarea
                          value={result.description}
                          onChange={(e) => handleEditResult(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full text-sm text-gray-600 bg-transparent border-none resize-none focus:outline-none focus:ring-0 mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">{result.summary}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveResult(index)}
                        className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <select
                        value={result.type}
                        onChange={(e) => handleEditResult(index, 'type', e.target.value as ItemType)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Feature">Feature</option>
                        <option value="Issue">Issue</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch Manager */}
            <BatchManager
              items={splitResults.map((result, index) => ({
                id: `temp-${index}`,
                title: result.title,
                description: result.description,
                type: result.type,
                status: 'Not start' as ItemStatus,
                projectId: selectedProject,
                createdAt: new Date(),
                updatedAt: new Date()
              }))}
              onItemsUpdate={(updatedItems) => {
                const newResults = updatedItems.map((item, idx) => ({
                  title: item.title,
                  description: item.description,
                  type: item.type,
                  summary: splitResults[idx]?.summary || ''
                }));
                setSplitResults(newResults);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Smart Add Tasks</h1>
          <p className="mt-2 text-gray-600">Enter project description and AI will automatically split into multiple tasks</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Project Information</h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Select Project</label>
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(true)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add New Project</span>
                </button>
              </div>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed project description, e.g.: 1. Implement user authentication system with login/logout functionality. 2. Create dashboard with real-time data visualization. 3. Fix performance issues in data loading. 4. Add export functionality for reports..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Extraction Method Selection */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Extraction Method</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={extractionMethod === 'local'}
                    onChange={() => setExtractionMethod('local')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-green-600" />
                    <div>
                      <span className="text-sm text-gray-700">Local Extraction (Fast, Offline)</span>
                      <p className="text-xs text-gray-500">Uses predefined rules for quick task extraction</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={extractionMethod === 'api'}
                    onChange={() => setExtractionMethod('api')}
                    disabled={!apiAvailable}
                    className="text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-sm text-gray-700">
                        Local API (Enhanced, Server-side)
                        {!apiAvailable && <span className="text-red-500 ml-1">(Unavailable)</span>}
                      </span>
                      <p className="text-xs text-gray-500">Server-side processing with improved accuracy</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={extractionMethod === 'cursor'}
                    onChange={() => setExtractionMethod('cursor')}
                    disabled={!cursorApiAvailable}
                    className="text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="text-sm text-gray-700">
                        Cursor AI (Advanced, AI-powered)
                        {!cursorApiAvailable && <span className="text-red-500 ml-1">(Unavailable)</span>}
                      </span>
                      <p className="text-xs text-gray-500">Advanced AI analysis with high accuracy</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={extractionMethod === 'agent'}
                    onChange={() => setExtractionMethod('agent')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="text-sm text-gray-700">Cursor Agent (Manual, Interactive)</span>
                      <p className="text-xs text-gray-500">Copy prompt to Cursor Agent and paste result back</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Cursor API Configuration */}
            {extractionMethod === 'cursor' && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-purple-900">Cursor AI Configuration</h3>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700"
                  >
                    <Key className="w-3 h-3" />
                    <span>Configure API</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">AI Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {CursorAPIExtractor.getSupportedModels().map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">Max Tasks</label>
                    <input
                      type="number"
                      value={maxTasks}
                      onChange={(e) => setMaxTasks(parseInt(e.target.value) || 5)}
                      min="1"
                      max="15"
                      className="w-full px-2 py-1 text-xs border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSmartSplit}
              disabled={isSplitting || !selectedProject || !description.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getExtractionMethodInfo().icon}
              <span>
                {isSplitting
                  ? 'Analyzing...'
                  : `Generate with ${getExtractionMethodInfo().name}`
                }
              </span>
            </button>
          </div>
        </div>

        {/* Modals */}
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onProjectAdded={handleProjectAdded}
        />

        <APIKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          onSave={handleApiKeySave}
        />
      </div>
    </div>
  );
} 