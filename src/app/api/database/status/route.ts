import { NextRequest, NextResponse } from 'next/server';
import { DatabaseDetector } from '@/lib/database-detector';

export async function GET(request: NextRequest) {
  try {
    const databases = await DatabaseDetector.detectAllDatabases();
    const recommended = await DatabaseDetector.getRecommendedDatabase();
    const integrity = await DatabaseDetector.checkDataIntegrity();

    return NextResponse.json({
      databases,
      recommended,
      integrity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check database status' },
      { status: 500 }
    );
  }
} 