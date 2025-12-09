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
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    return getItemById(request, params);
  }
);

/**
 * PUT /api/items/:id
 * Update an item
 * Body: UpdateItemDto
 */
export const PUT = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    return updateItem(request, params);
  }
);

/**
 * DELETE /api/items/:id
 * Delete an item
 */
export const DELETE = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    return deleteItem(request, params);
  }
);
