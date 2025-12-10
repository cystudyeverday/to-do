/**
 * Item by ID API Routes
 * RESTful endpoints for single item operations
 * 
 * GET    /api/items/:id      - Get item by ID
 * PUT    /api/items/:id      - Update item
 * DELETE /api/items/:id      - Delete item
 */

import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api';
import { getItemById, updateItem, deleteItem } from '@/lib/api/controllers';

/**
 * GET /api/items/:id
 * Get a single item by ID
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    return getItemById(request, resolvedParams);
  }
);

/**
 * PUT /api/items/:id
 * Update an item
 * Body: UpdateItemDto
 */
export const PUT = asyncHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    return updateItem(request, resolvedParams);
  }
);

/**
 * DELETE /api/items/:id
 * Delete an item
 */
export const DELETE = asyncHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    return deleteItem(request, resolvedParams);
  }
);
