import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.CURSOR_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        hasApiKey: false,
        message: 'No Cursor API key found in environment variables'
      });
    }

    // 只返回是否有API key，不返回实际的key值
    return NextResponse.json({
      hasApiKey: true,
      message: 'Cursor API key found in environment variables'
    });
  } catch (error) {
    return NextResponse.json({
      hasApiKey: false,
      message: 'Error checking Cursor API configuration'
    }, { status: 500 });
  }
} 