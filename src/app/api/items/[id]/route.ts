import { NextRequest, NextResponse } from 'next/server';
import { apolloClient } from '@/lib/apollo-client';
import { GET_ITEM_BY_ID } from '@/lib/graphql/queries';
import { UPDATE_ITEM, DELETE_ITEM } from '@/lib/graphql/mutations';

// GET /api/items/[id] - 获取单个任务
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data } = await apolloClient.query<{
      items_by_pk: {
        id: string;
        title: string;
        description: string | null;
        type: string;
        status: string;
        project_id: string;
        module: string | null;
        created_at: string;
        updated_at: string;
        completed_at: string | null;
      } | null;
    }>({
      query: GET_ITEM_BY_ID,
      variables: { id },
      fetchPolicy: 'network-only',
    });

    if (!data?.items_by_pk) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = data.items_by_pk;
    const result = {
      id: item.id,
      title: item.title,
      description: item.description || '',
      type: item.type,
      status: item.status,
      projectId: item.project_id,
      module: item.module || 'Other',
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
    };

    return NextResponse.json({ item: result }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item', message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/items/[id] - 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      type,
      status,
      projectId,
      module,
      completedAt,
    } = body;

    const { data } = await apolloClient.mutate<{
      update_items_by_pk: {
        id: string;
        title: string;
        description: string | null;
        type: string;
        status: string;
        project_id: string;
        module: string | null;
        created_at: string;
        updated_at: string;
        completed_at: string | null;
      } | null;
    }>({
      mutation: UPDATE_ITEM,
      variables: {
        id,
        title,
        description: description !== undefined ? description : null,
        type,
        status,
        project_id: projectId,
        module: module !== undefined ? module : null,
        completed_at: completedAt ? new Date(completedAt).toISOString() : null,
      },
    });

    if (!data?.update_items_by_pk) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = data.update_items_by_pk;
    const result = {
      id: item.id,
      title: item.title,
      description: item.description || '',
      type: item.type,
      status: item.status,
      projectId: item.project_id,
      module: item.module || 'Other',
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
    };

    return NextResponse.json({ item: result }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id] - 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data } = await apolloClient.mutate<{
      delete_items_by_pk: {
        id: string;
      } | null;
    }>({
      mutation: DELETE_ITEM,
      variables: { id },
    });

    if (!data?.delete_items_by_pk) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Item deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item', message: error.message },
      { status: 500 }
    );
  }
}

