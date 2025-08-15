import { NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';

export async function GET() {
  try {
    const statistics = dbManager.getStatistics();
    return NextResponse.json(statistics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get statistics', details: error },
      { status: 500 }
    );
  }
} 