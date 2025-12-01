import { NextRequest, NextResponse } from 'next/server';
import { apolloClient } from '@/lib/apollo-client';
import { GET_PROJECTS } from '@/lib/graphql/queries';
import { CREATE_PROJECT } from '@/lib/graphql/mutations';

// GET /api/projects - 获取所有项目
export async function GET() {
  try {
    const { data } = await apolloClient.query<{
      projects: Array<{
        id: number;
        name: string;
        description: string | null;
        created_at: string;
        updated_at: string;
      }>;
    }>({
      query: GET_PROJECTS,
      fetchPolicy: 'network-only',
    });

    if (!data) {
      throw new Error('No data returned from query');
    }

    // 转换数据格式以匹配应用类型
    const projects = data.projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description || '',
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    }));

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects - 创建新项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const { data } = await apolloClient.mutate<{
      insert_projects_one: {
        id: number;
        name: string;
        description: string | null;
        created_at: string;
        updated_at: string;
      };
    }>({
      mutation: CREATE_PROJECT,
      variables: {
        name,
        description: description || null,
      },
    });

    if (!data?.insert_projects_one) {
      throw new Error('Failed to create project');
    }

    const project = data.insert_projects_one;
    const result = {
      id: project.id,
      name: project.name,
      description: project.description || '',
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    };

    return NextResponse.json({ project: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', message: error.message },
      { status: 500 }
    );
  }
}

