import { NextRequest, NextResponse } from 'next/server';
import { apolloClient } from '@/lib/apollo-client';
import { GET_PROJECT_BY_ID } from '@/lib/graphql/queries';
import { UPDATE_PROJECT, DELETE_PROJECT } from '@/lib/graphql/mutations';

// GET /api/projects/[id] - 获取单个项目
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const projectId = parseInt(id, 10);
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const { data } = await apolloClient.query<{
      projects_by_pk: {
        id: number;
        name: string;
        description: string | null;
        created_at: string;
        updated_at: string;
      } | null;
    }>({
      query: GET_PROJECT_BY_ID,
      variables: { id: projectId },
      fetchPolicy: 'network-only',
    });

    if (!data?.projects_by_pk) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = data.projects_by_pk;
    const result = {
      id: project.id,
      name: project.name,
      description: project.description || '',
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    };

    return NextResponse.json({ project: result }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project', message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const projectId = parseInt(id, 10);
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    const { data } = await apolloClient.mutate<{
      update_projects_by_pk: {
        id: number;
        name: string;
        description: string | null;
        created_at: string;
        updated_at: string;
      } | null;
    }>({
      mutation: UPDATE_PROJECT,
      variables: {
        id: projectId,
        name,
        description: description !== undefined ? description : null,
      },
    });

    if (!data?.update_projects_by_pk) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = data.update_projects_by_pk;
    const result = {
      id: project.id,
      name: project.name,
      description: project.description || '',
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    };

    return NextResponse.json({ project: result }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const projectId = parseInt(id, 10);
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const { data } = await apolloClient.mutate<{
      delete_projects_by_pk: {
        id: number;
      } | null;
    }>({
      mutation: DELETE_PROJECT,
      variables: { id: projectId },
    });

    if (!data?.delete_projects_by_pk) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project', message: error.message },
      { status: 500 }
    );
  }
}

