/**
 * Project Items API Routes
 * Endpoints for managing items within a project
 * 
 * GET /api/projects/:id/items - Get all items for a project
 */

import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api';
import { getProjectItems } from '@/lib/api/controllers';

/**
 * GET /api/projects/:id/items
 * Get all items for a specific project
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    return getProjectItems(request, resolvedParams);
  }
);
