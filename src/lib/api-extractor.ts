import { SplitResult } from './smart-split';

export interface APIExtractionRequest {
  text: string;
  projectName: string;
  language?: 'en' | 'zh';
}

export interface APIExtractionResponse {
  tasks: SplitResult[];
  summary: string;
  confidence: number;
}

export class APIExtractor {
  // 这里可以配置不同的API端点
  private static readonly API_ENDPOINTS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    local: '/api/extract-tasks', // 本地API端点
  };

  // 默认使用本地API端点
  private static readonly DEFAULT_ENDPOINT = 'local';

  static async extractTasks(request: APIExtractionRequest): Promise<APIExtractionResponse> {
    try {
      const endpoint = this.API_ENDPOINTS[this.DEFAULT_ENDPOINT as keyof typeof this.API_ENDPOINTS];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          projectName: request.projectName,
          language: request.language || 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API extraction failed:', error);

      // 如果API调用失败，返回错误信息
      throw new Error('Failed to extract tasks from API. Please try again or use local extraction.');
    }
  }

  // 模拟API响应（用于开发测试）
  static async mockExtractTasks(request: APIExtractionRequest): Promise<APIExtractionResponse> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 基于输入文本生成模拟任务
    const tasks: SplitResult[] = [];
    const sentences = request.text.split(/[.!?]+/).filter(s => s.trim().length > 10);

    sentences.slice(0, 5).forEach((sentence, index) => {
      const isFeature = sentence.toLowerCase().includes('implement') ||
        sentence.toLowerCase().includes('create') ||
        sentence.toLowerCase().includes('add');

      tasks.push({
        title: `${request.projectName} - Task ${index + 1}`,
        description: sentence.trim(),
        type: isFeature ? 'Feature' : 'Issue',
        summary: sentence.substring(0, 20) + '...',
      });
    });

    return {
      tasks,
      summary: `Extracted ${tasks.length} tasks from project description`,
      confidence: 0.85,
    };
  }

  // 检查API可用性
  static async checkAPIHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
} 