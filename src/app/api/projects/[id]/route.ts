/**
 * Project by ID API Routes
 * RESTful endpoints for single project operations
 * 
 * GET    /api/projects/:id        - Get project by ID
 * PUT    /api/projects/:id        - Update project
 * DELETE /api/projects/:id        - Delete project
 */

import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api';
import {
  getProjectById,
  updateProject,
  deleteProject,
} from '@/lib/api/controllers';

/**
 * GET /api/projects/:id
 * Get a single project by ID
 * Query params: includeStats (boolean)
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    return getProjectById(request, resolvedParams);
  }
);

/**
 * PUT /api/projects/:id
 * Update a project
 * Body: UpdateProjectDto
 */
export const PUT = asyncHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    return updateProject(request, resolvedParams);
  }
);

/**
 * DELETE /api/projects/:id
 * Delete a project
 * Query params: cascade (boolean) - If true, deletes all project items
 */
export const DELETE = asyncHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    return deleteProject(request, resolvedParams);
  }
);
