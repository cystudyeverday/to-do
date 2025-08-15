import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 注意：这个 API 路由在服务器端运行，无法直接访问 localStorage
    // 但我们可以返回一些有用的信息
    return NextResponse.json({
      message: 'Storage check API',
      note: 'This API runs on the server side and cannot access localStorage directly.',
      suggestion: 'Check browser console for localStorage data or use browser dev tools.',
      localStorageKeys: ['todo_projects', 'todo_items'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check storage', details: error },
      { status: 500 }
    );
  }
} 