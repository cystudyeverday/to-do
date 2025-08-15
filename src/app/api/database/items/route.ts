import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let items;
    if (projectId) {
      items = dbManager.getItemsByProject(projectId);
    } else {
      items = dbManager.getItems();
    }

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get items', details: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, type, status, projectId, module, completedAt } = body;

    if (!title || !type || !status || !projectId) {
      return NextResponse.json(
        { error: 'Title, type, status, and projectId are required' },
        { status: 400 }
      );
    }

    const item = dbManager.addItem({
      title,
      description,
      type,
      status,
      projectId,
      module,
      completedAt: completedAt ? new Date(completedAt) : undefined,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create item', details: error },
      { status: 500 }
    );
  }
} 