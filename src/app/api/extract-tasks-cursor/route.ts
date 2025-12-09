import { NextRequest, NextResponse } from 'next/server';

const CURSOR_API_ENDPOINT = 'https://api.cursor.sh/v1/chat/completions';
const SYSTEM_PROMPT = `You are an expert project manager and software developer specializing in enterprise applications and compliance systems. Your task is to analyze project descriptions and break them down into specific, actionable tasks.

Guidelines:
1. Extract 3-8 specific, actionable tasks from the project description
2. Each task should be clear, measurable, and implementable
3. Classify tasks as either "Feature" (new functionality) or "Issue" (bug fix/improvement)
4. Set appropriate status based on task nature
5. Provide concise but descriptive titles and detailed descriptions

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
    "title": "Task title",
    "description": "Detailed task description",
    "type": "Feature" or "Issue",
    "status": "Not start"
  }
]

Additional considerations:
- Pay special attention to compliance, security, and access control requirements
- Include proper validation and error handling considerations
- Consider user role-based access control (RBAC) implementations
- Handle boolean properties like showSendBtn appropriately
- Ensure proper data source management and view-only restrictions`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, projectName, language = 'en', model = 'gpt-4', maxTasks = 5, context = '' } = body;

    const apiKey = process.env.CURSOR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Cursor API key not configured' }, { status: 500 });
    }

    const userPrompt = `Project: ${projectName}
Context: ${context || 'Enterprise application development with compliance and security requirements'}
Language: ${language}

Please analyze the following project description and break it down into ${maxTasks} specific, actionable tasks:

${text}

Requirements:
- Extract exactly ${maxTasks} tasks
- Each task should be specific and actionable
- Classify as Feature (new functionality) or Issue (bug fix/improvement)
- Provide clear titles and detailed descriptions
- Set status to "Not start" for all tasks

Special attention to enterprise patterns:
- Re-generation functionality for topics/content
- Compliance matrix query and edit operations
- Valid option configurations with boolean properties (e.g., showSendBtn)
- Data source view-only implementations
- User management with role-based access control
- Non-CMP user restrictions and permissions
- Compliance and security requirements
- Access control and user role management

Return only the JSON array, no additional text.`;

    const startTime = Date.now();

    const response = await fetch(CURSOR_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        error: `API request failed: ${response.status} ${response.statusText}`,
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    // 解析任务
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No content received from API' }, { status: 500 });
    }

    // 尝试解析JSON
    let tasks;
    try {
      // 提取JSON部分
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON array found in response');
      }
    } catch {
      return NextResponse.json({
        error: 'Failed to parse tasks from API response',
        content: content.substring(0, 500) // 返回前500个字符用于调试
      }, { status: 500 });
    }

    // 验证任务格式
    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Invalid task format received' }, { status: 500 });
    }

    // 生成总结
    interface TaskType { type: string }
    const featureCount = tasks.filter((t: TaskType) => t.type === 'Feature').length;
    const issueCount = tasks.filter((t: TaskType) => t.type === 'Issue').length;
    const summary = `${tasks.length} tasks identified (${featureCount} features, ${issueCount} issues)`;

    // 计算置信度
    let confidence = 0.5;
    if (tasks.length >= 3 && tasks.length <= 8) {
      confidence += 0.2;
    }
    interface TaskValidation { title?: string; description?: string }
    const validTasks = tasks.filter((t: TaskValidation) =>
      t.title && t.title.length > 5 &&
      t.description && t.description.length > 10
    );
    confidence += (validTasks.length / tasks.length) * 0.2;
    if (data.usage?.total_tokens) {
      const tokenRatio = data.usage.total_tokens / 2000;
      if (tokenRatio > 0.3 && tokenRatio < 0.8) {
        confidence += 0.1;
      }
    }
    confidence = Math.min(confidence, 0.95);

    return NextResponse.json({
      tasks,
      summary,
      confidence,
      model: model,
      tokens_used: data.usage?.total_tokens || 0,
      processing_time: processingTime,
    });

  } catch (error) {
    console.error('Cursor API extraction failed:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 