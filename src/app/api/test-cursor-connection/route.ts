import { NextResponse } from 'next/server';

const CURSOR_API_ENDPOINT = 'https://api.cursor.sh/v1/chat/completions';

export async function GET() {
  try {
    const apiKey = process.env.CURSOR_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'No Cursor API key found in environment variables'
      });
    }

    const response = await fetch(CURSOR_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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

    const success = response.ok;

    return NextResponse.json({
      success,
      message: success
        ? 'Cursor API connection successful'
        : `Connection failed: ${response.status} ${response.statusText}`
    });

  } catch (error) {
    console.error('Cursor API connection test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
} 