/**
 * Projects API Routes
 * RESTful endpoints for project management
 * 
 * GET    /api/projects       - Get all projects
 * POST   /api/projects       - Create new project
 */

import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api';
import { getAllProjects, createProject } from '@/lib/api/controllers';

/**
 * GET /api/projects
 * Get all projects
 * Query params: includeStats (boolean)
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  return getAllProjects(request);
});

/**
 * POST /api/projects
 * Create new project
 * Body: CreateProjectDto
 * Query params: createDefaultTasks (boolean, default: true)
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  return createProject(request);
});
