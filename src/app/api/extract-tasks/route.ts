import { NextRequest, NextResponse } from 'next/server';
import { SmartSplitter } from '@/lib/smart-split';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, projectName, language = 'en' } = body;

    if (!text || !projectName) {
      return NextResponse.json(
        { error: 'Missing required fields: text and projectName' },
        { status: 400 }
      );
    }

    // 使用本地智能拆分器
    const tasks = SmartSplitter.splitDescription(projectName, text);
    const summary = SmartSplitter.generateProjectSummary(text);

    // 计算置信度（基于任务数量和文本长度）
    const confidence = Math.min(0.9, 0.5 + (tasks.length * 0.1) + (text.length / 1000 * 0.1));

    return NextResponse.json({
      tasks,
      summary,
      confidence,
      source: 'local-extractor'
    });

  } catch (error) {
    console.error('Task extraction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 