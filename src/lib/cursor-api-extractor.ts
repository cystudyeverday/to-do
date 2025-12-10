import { SplitResult } from './smart-split';
import { ItemType, ItemStatus } from '@/types';

export interface CursorAPIRequest {
  text: string;
  projectName: string;
  language?: 'en' | 'zh';
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'claude-3.5-sonnet';
  maxTasks?: number;
  context?: string;
}

export interface CursorAPIResponse {
  tasks: SplitResult[];
  summary: string;
  confidence: number;
  model: string;
  tokens_used?: number;
  processing_time?: number;
}

export class CursorAPIExtractor {
  // Cursor API配置
  private static readonly CURSOR_API_ENDPOINT = 'https://api.cursor.sh/v1/chat/completions';
  private static readonly DEFAULT_MODEL = 'gpt-4';
  private static readonly MAX_TOKENS = 4000;

  // 系统提示词模板
  private static readonly SYSTEM_PROMPT = `You are an expert project manager and software developer specializing in enterprise applications and compliance systems. Your task is to analyze project descriptions and break them down into specific, actionable tasks.

Key requirements:
1. Extract clear, specific tasks from the project description
2. Classify each task as either "Feature" (new functionality) or "Issue" (bug fix/problem)
3. Generate concise, descriptive titles for each task
4. Provide detailed descriptions that explain what needs to be done
5. Focus on actionable items that can be completed independently
6. Consider technical dependencies and logical task ordering

Specialized patterns to recognize and handle:
- Re-generation of topics or content (re-gen topic)
- Compliance matrix queries and editing functionality
- Valid option configurations with showSendBtn boolean properties
- Data source view-only implementations
- User management view-only access for non-CMP users
- Enterprise application patterns and security considerations

Output format: Return a JSON array of tasks with the following structure:
[
  {
    "title": "Task title (max 50 chars)",
    "description": "Detailed task description",
    "type": "Feature" or "Issue",
    "summary": "Brief summary (max 20 chars)"
  }
]

Guidelines:
- Feature: New functionality, enhancements, additions, view implementations
- Issue: Bugs, problems, fixes, improvements, access control issues
- Keep titles concise but descriptive
- Descriptions should be detailed enough for implementation
- Consider user stories and acceptance criteria
- Break down complex requirements into smaller tasks
- Pay special attention to compliance, security, and access control requirements
- Include proper validation and error handling considerations`;

  // 用户提示词模板
  private static createUserPrompt(request: CursorAPIRequest): string {
    return `Project Name: ${request.projectName}

Project Description:
${request.text}

Please analyze this project description and break it down into specific, actionable tasks. Consider the following:

1. Technical requirements and implementation details
2. User interface and user experience considerations
3. Data management and storage requirements
4. Integration points and dependencies
5. Testing and quality assurance needs
6. Performance and scalability considerations
7. Compliance and security requirements
8. Access control and user role management
9. Data source management and view restrictions
10. Boolean property configurations (e.g., showSendBtn)

Special attention to enterprise patterns:
- Re-generation functionality for topics/content
- Compliance matrix query and edit operations
- Valid option configurations with boolean properties
- Data source view-only implementations
- User management with role-based access control
- Non-CMP user restrictions and permissions

Generate ${request.maxTasks || 5} to ${Math.min(request.maxTasks || 5 + 3, 10)} well-defined tasks that can be implemented independently.

Additional Context: ${request.context || 'Enterprise application development with compliance and security requirements'}

Return only the JSON array of tasks, no additional text.`;
  }

  // 调用Cursor API
  static async extractTasks(request: CursorAPIRequest): Promise<CursorAPIResponse> {
    try {
      // 首先尝试从localStorage获取API key
      let apiKey = this.getStoredAPIKey();

      // 如果没有localStorage中的key，尝试从API获取环境变量
      if (!apiKey) {
        try {
          const response = await fetch('/api/cursor-config');
          if (response.ok) {
            const config = await response.json();
            if (config.hasApiKey) {
              // 如果环境变量中有API key，我们需要通过另一个API来使用它
              const extractResponse = await fetch('/api/extract-tasks-cursor', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
              });

              if (extractResponse.ok) {
                return await extractResponse.json();
              }
            }
          }
        } catch (error) {
          console.error('Failed to get API key from environment:', error);
        }
      }

      if (!apiKey) {
        throw new Error('Cursor API key not found. Please configure your API key.');
      }

      const startTime = Date.now();

      const response = await fetch(this.CURSOR_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: this.SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: this.createUserPrompt(request)
            }
          ],
          max_tokens: this.MAX_TOKENS,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      // 提取JSON数据
      const tasks = this.parseTasksFromResponse(data.choices[0]?.message?.content || '');

      // 生成项目总结
      const summary = this.generateProjectSummary(request.text, tasks);

      // 计算置信度
      const confidence = this.calculateConfidence(tasks, data.usage);

      return {
        tasks,
        summary,
        confidence,
        model: request.model || 'gpt-4',
        tokens_used: data.usage?.total_tokens || 0,
        processing_time: processingTime,
      };
    } catch (error) {
      console.error('Cursor API extraction failed:', error);
      throw error;
    }
  }

  // 从API响应中解析任务
  private static parseTasksFromResponse(content: string): SplitResult[] {
    try {
      // 尝试直接解析JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return tasks.map((task: Record<string, unknown>) => ({
          title: (task.title as string) || 'Untitled Task',
          description: (task.description as string) || '',
          type: (task.type as ItemType) || 'Feature',
          module: (task.module as string) || 'Other',
          summary: (task.summary as string) || (task.title as string)?.substring(0, 20) || 'Task',
          status: 'Not start' as ItemStatus,
        }));
      }

      // 如果无法解析JSON，尝试从文本中提取
      return this.extractTasksFromText(content);
    } catch (error) {
      console.error('Failed to parse tasks from response:', error);
      return this.extractTasksFromText(content);
    }
  }

  // 从文本中提取任务（备用方法）
  private static extractTasksFromText(text: string): SplitResult[] {
    const tasks: SplitResult[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentTask: Partial<SplitResult> = {};

    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        // 新任务开始
        if (currentTask.title) {
          tasks.push(currentTask as SplitResult);
        }
        currentTask = {
          title: line.replace(/^\d+\.\s*/, '').trim(),
          description: '',
          type: 'Feature',
          module: 'Other',
          summary: '',
          status: 'Not start',
        };
      } else if (currentTask.title && line.trim()) {
        // 任务描述
        currentTask.description += (currentTask.description ? '\n' : '') + line.trim();
      }
    }

    // 添加最后一个任务
    if (currentTask.title) {
      tasks.push(currentTask as SplitResult);
    }

    return tasks;
  }

  // 生成项目总结
  private static generateProjectSummary(description: string, tasks: SplitResult[]): string {
    const featureCount = tasks.filter(t => t.type === 'Feature').length;
    const issueCount = tasks.filter(t => t.type === 'Issue').length;

    return `${tasks.length} tasks identified (${featureCount} features, ${issueCount} issues)`;
  }

  // 计算置信度
  private static calculateConfidence(tasks: SplitResult[], usage?: Record<string, unknown>): number {
    let confidence = 0.5; // 基础置信度

    // 基于任务数量调整
    if (tasks.length >= 3 && tasks.length <= 8) {
      confidence += 0.2;
    }

    // 基于任务质量调整
    const validTasks = tasks.filter(t =>
      t.title && t.title.length > 5 &&
      t.description && t.description.length > 10
    );
    confidence += (validTasks.length / tasks.length) * 0.2;

    // 基于token使用情况调整
    if (usage?.total_tokens) {
      const totalTokens = usage.total_tokens as number;
      const tokenRatio = totalTokens / this.MAX_TOKENS;
      if (tokenRatio > 0.3 && tokenRatio < 0.8) {
        confidence += 0.1;
      }
    }

    return Math.min(confidence, 0.95);
  }

  // 获取存储的API密钥
  private static getStoredAPIKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cursor_api_key') || process.env.CURSOR_API_KEY || null;
    }
    return process.env.CURSOR_API_KEY || null;
  }

  // 存储API密钥
  static setAPIKey(apiKey: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cursor_api_key', apiKey);
    }
  }

  // 测试API连接
  static async testConnection(apiKey?: string): Promise<boolean> {
    try {
      const key = apiKey || this.getStoredAPIKey();
      if (!key) return false;

      const response = await fetch(this.CURSOR_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message.'
            }
          ],
          max_tokens: 10,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  // 获取支持的模型列表
  static getSupportedModels(): Array<{ id: string, name: string, description: string }> {
    return [
      { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model, best for complex tasks' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
      { id: 'claude-3', name: 'Claude-3', description: 'Excellent for analysis and reasoning' },
      { id: 'claude-3.5-sonnet', name: 'Claude-3.5 Sonnet', description: 'Balanced performance and speed' },
    ];
  }
} 