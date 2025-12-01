import { NextRequest, NextResponse } from 'next/server';
import { apolloClient } from '@/lib/apollo-client';
import { GET_ITEMS, GET_ITEMS_BY_PROJECT } from '@/lib/graphql/queries';
import { CREATE_ITEM, CREATE_ITEMS } from '@/lib/graphql/mutations';

// GET /api/items - 获取所有任务
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let data: { items: Array<{
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
    }> };

    if (projectId) {
      // 如果提供了 projectId，使用按项目查询
      const result = await apolloClient.query<{
        items: Array<{
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
        }>;
      }>({
        query: GET_ITEMS_BY_PROJECT,
        variables: { projectId },
        fetchPolicy: 'network-only',
      });
      data = result.data;
    } else {
      const result = await apolloClient.query<{
        items: Array<{
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
        }>;
      }>({
        query: GET_ITEMS,
        fetchPolicy: 'network-only',
      });
      data = result.data;
    }

    if (!data) {
      throw new Error('No data returned from query');
    }

    // 转换数据格式以匹配应用类型
    const items = data.items.map((item) => ({
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
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/items - 创建新任务或批量创建任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, ...singleItem } = body;

    // 批量创建
    if (Array.isArray(items) && items.length > 0) {
      const objects = items.map((item: any) => ({
        title: item.title,
        description: item.description || null,
        type: item.type,
        status: item.status,
        project_id: item.projectId,
        module: item.module || null,
        completed_at: item.completedAt || null,
      }));

      const { data } = await apolloClient.mutate<{
        insert_items: {
          returning: Array<{
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
          }>;
        };
      }>({
        mutation: CREATE_ITEMS,
        variables: { objects },
      });

      if (!data?.insert_items) {
        throw new Error('Failed to create items');
      }

      const createdItems = data.insert_items.returning.map((item) => ({
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
      }));

      return NextResponse.json({ items: createdItems }, { status: 201 });
    }

    // 单个创建
    const { title, type, status, projectId, description, module } = singleItem;

    if (!title || !type || !status || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, status, projectId' },
        { status: 400 }
      );
    }

    const { data } = await apolloClient.mutate<{
      insert_items_one: {
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
      };
    }>({
      mutation: CREATE_ITEM,
      variables: {
        title,
        description: description || null,
        type,
        status,
        project_id: projectId,
        module: module || null,
      },
    });

    if (!data?.insert_items_one) {
      throw new Error('Failed to create item');
    }

    const item = data.insert_items_one;
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

    return NextResponse.json({ item: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item(s):', error);
    return NextResponse.json(
      { error: 'Failed to create item(s)', message: error.message },
      { status: 500 }
    );
  }
}

