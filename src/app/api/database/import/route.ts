import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !data.projects || !data.items) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    const result = dbManager.importData(data);
    
    return NextResponse.json({
      message: 'Import completed successfully',
      importedProjects: result.projects.length,
      importedItems: result.items.length,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Import failed', details: error },
      { status: 500 }
    );
  }
} 