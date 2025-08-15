import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { localStorageData } = body;

    if (!localStorageData || !localStorageData.projects || !localStorageData.items) {
      return NextResponse.json(
        { error: 'Invalid localStorage data format' },
        { status: 400 }
      );
    }

    const result = await dbManager.migrateFromLocalStorage(localStorageData);
    
    return NextResponse.json({
      message: 'Migration completed successfully',
      migratedProjects: result.projects.length,
      migratedItems: result.items.length,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    );
  }
} 