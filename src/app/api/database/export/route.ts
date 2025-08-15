import { NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';

export async function GET() {
  try {
    const data = dbManager.exportData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Export failed', details: error },
      { status: 500 }
    );
  }
} 