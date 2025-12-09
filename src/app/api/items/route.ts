/**
 * Items API Routes
 * RESTful endpoints for item management
 * 
 * GET    /api/items          - Get all items (with optional filters)
 * POST   /api/items          - Create new item(s)
 */

import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api';
import { getAllItems, createItem } from '@/lib/api/controllers';

/**
 * GET /api/items
 * Get all items with optional filtering
 * Query params: projectId, status, type, module
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  return getAllItems(request);
});

/**
 * POST /api/items
 * Create new item or batch create items
 * Body: CreateItemDto | { items: CreateItemDto[] }
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  return createItem(request);
});
