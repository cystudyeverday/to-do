/**
 * Project Controller
 * Handles HTTP requests for project endpoints
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  createdResponse,
  noContentResponse,
} from '../response';
import {
  validateRequestBody,
  parseIntParam,
} from '../validation';
import { NotFoundError } from '../errors';
import {
  CreateProjectDto,
  UpdateProjectDto,
  createProjectSchema,
  updateProjectSchema,
  toProjectResponseDto,
  fromCreateProjectDto,
  ProjectWithStatsDto,
} from '../dto';
import { ProjectRepository, ItemRepository } from '@/lib/repositories';
import {
  createProjectWithDefaults,
  getProjectStats,
  archiveProject as archiveProjectService,
  deleteProjectCascade,
} from '@/lib/services';

/**
 * Get all projects
 */
export async function getAllProjects(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeStats = searchParams.get('includeStats') === 'true';

  const projects = await ProjectRepository.getAll();

  if (!includeStats) {
    const projectDtos = projects.map(toProjectResponseDto);
    return successResponse(projectDtos);
  }

  // Include statistics for each project
  const projectsWithStats: ProjectWithStatsDto[] = await Promise.all(
    projects.map(async (project) => {
      const stats = await getProjectStats(project.id);
      return {
        ...toProjectResponseDto(project),
        stats,
      };
    })
  );

  return successResponse(projectsWithStats);
}

/**
 * Get project by ID
 */
export async function getProjectById(
  request: NextRequest,
  params: { id: string }
) {
  const projectId = parseIntParam(params.id, 'Project ID');
  const { searchParams } = new URL(request.url);
  const includeStats = searchParams.get('includeStats') === 'true';

  const project = await ProjectRepository.getById(projectId);

  if (!project) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }

  if (!includeStats) {
    return successResponse(toProjectResponseDto(project));
  }

  // Include statistics
  const stats = await getProjectStats(projectId);
  const projectWithStats: ProjectWithStatsDto = {
    ...toProjectResponseDto(project),
    stats,
  };

  return successResponse(projectWithStats);
}

/**
 * Create new project
 */
export async function createProject(request: NextRequest) {
  const body = await request.json();
  validateRequestBody(body, createProjectSchema);

  const dto = body as CreateProjectDto;
  const { searchParams } = new URL(request.url);
  const createDefaultTasks = searchParams.get('createDefaultTasks') !== 'false';

  // Use service layer for business logic
  const projectData = fromCreateProjectDto(dto);
  const project = await createProjectWithDefaults(projectData, createDefaultTasks);

  return createdResponse(toProjectResponseDto(project));
}

/**
 * Update project
 */
export async function updateProject(
  request: NextRequest,
  params: { id: string }
) {
  const projectId = parseIntParam(params.id, 'Project ID');

  // Check if project exists
  const existingProject = await ProjectRepository.getById(projectId);
  if (!existingProject) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }

  const body = await request.json();
  validateRequestBody(body, updateProjectSchema);

  const dto = body as UpdateProjectDto;

  // Update project
  const updatedProject = await ProjectRepository.update(projectId, dto);

  if (!updatedProject) {
    throw new NotFoundError(`Failed to update project with ID ${projectId}`);
  }

  return successResponse(toProjectResponseDto(updatedProject));
}

/**
 * Delete project
 */
export async function deleteProject(
  request: NextRequest,
  params: { id: string }
) {
  const projectId = parseIntParam(params.id, 'Project ID');
  const { searchParams } = new URL(request.url);
  const cascade = searchParams.get('cascade') === 'true';

  // Check if project exists
  const existingProject = await ProjectRepository.getById(projectId);
  if (!existingProject) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }

  if (cascade) {
    // Delete project and all its items
    await deleteProjectCascade(projectId);
  } else {
    // Check if project has items
    const items = await ItemRepository.getByProject(projectId);
    if (items.length > 0) {
      throw new NotFoundError(
        `Cannot delete project with existing items. Use cascade=true to delete all items.`
      );
    }

    // Delete project
    const deleted = await ProjectRepository.delete(projectId);
    if (!deleted) {
      throw new NotFoundError(`Failed to delete project with ID ${projectId}`);
    }
  }

  return noContentResponse();
}

/**
 * Archive project
 */
export async function archiveProject(
  request: NextRequest,
  params: { id: string }
) {
  const projectId = parseIntParam(params.id, 'Project ID');

  // Check if project exists
  const existingProject = await ProjectRepository.getById(projectId);
  if (!existingProject) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }

  // Archive project using service
  const result = await archiveProjectService(projectId);

  return successResponse(result);
}

/**
 * Get project items
 */
export async function getProjectItems(
  request: NextRequest,
  params: { id: string }
) {
  const projectId = parseIntParam(params.id, 'Project ID');

  // Check if project exists
  const existingProject = await ProjectRepository.getById(projectId);
  if (!existingProject) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }

  // Get items
  const items = await ItemRepository.getByProject(projectId);

  // Import toItemResponseDto
  const { toItemResponseDto } = await import('../dto');
  const itemDtos = items.map(toItemResponseDto);

  return successResponse(itemDtos);
}

