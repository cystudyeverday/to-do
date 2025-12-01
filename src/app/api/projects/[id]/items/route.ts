import { NextRequest, NextResponse } from 'next/server';
import { apolloClient } from '@/lib/apollo-client';
import { GET_ITEMS_BY_PROJECT } from '@/lib/graphql/queries';

// GET /api/projects/[id]/items - 获取项目的所有任务
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data } = await apolloClient.query<{
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
      variables: { projectId: id },
      fetchPolicy: 'network-only',
    });

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
    console.error('Error fetching project items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project items', message: error.message },
      { status: 500 }
    );
  }
}

