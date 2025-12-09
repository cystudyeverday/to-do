/**
 * Item Controller
 * Handles HTTP requests for item endpoints
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  createdResponse,
  errorResponse,
  noContentResponse,
} from '../response';
import {
  validateRequestBody,
  parseIntParam,
} from '../validation';
import { NotFoundError, BadRequestError } from '../errors';
import {
  CreateItemDto,
  UpdateItemDto,
  createItemSchema,
  updateItemSchema,
  toItemResponseDto,
  fromCreateItemDto,
  ItemQueryDto,
} from '../dto';
import { ItemRepository } from '@/lib/repositories';
import { createItem as createItemService } from '@/lib/services';
import { TodoItem } from '@/types';

/**
 * Get all items or items by query parameters
 */
export async function getAllItems(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectIdParam = searchParams.get('projectId');
  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type');
  const moduleParam = searchParams.get('module');

  // Build query
  const query: ItemQueryDto = {
    projectId: projectIdParam ? parseInt(projectIdParam, 10) : undefined,
    status: statusParam as any,
    type: typeParam as any,
    module: moduleParam || undefined,
  };

  // Fetch items based on query
  let items;
  if (query.projectId) {
    items = await ItemRepository.getByProject(query.projectId);
  } else {
    items = await ItemRepository.getAll();
  }

  // Apply filters
  if (query.status) {
    items = items.filter((item) => item.status === query.status);
  }
  if (query.type) {
    items = items.filter((item) => item.type === query.type);
  }
  if (query.module) {
    items = items.filter((item) => item.module === query.module);
  }

  // Transform to DTOs
  const itemDtos = items.map(toItemResponseDto);

  return successResponse(itemDtos);
}

/**
 * Get item by ID
 */
export async function getItemById(
  request: NextRequest,
  params: { id: string }
) {
  const itemId = parseIntParam(params.id, 'Item ID');

  const item = await ItemRepository.getById(itemId);

  if (!item) {
    throw new NotFoundError(`Item with ID ${itemId} not found`);
  }

  return successResponse(toItemResponseDto(item));
}

/**
 * Create new item(s)
 */
export async function createItem(request: NextRequest) {
  const body = await request.json();

  // Check if it's batch creation
  if (body.items && Array.isArray(body.items)) {
    return createBatchItems(body.items);
  }

  // Single item creation
  validateRequestBody(body, createItemSchema);

  const dto = body as CreateItemDto;

  // Use service layer for business logic
  const itemData = fromCreateItemDto(dto);
  const item = await createItemService(itemData);

  return createdResponse(toItemResponseDto(item));
}

/**
 * Create multiple items in batch
 */
async function createBatchItems(itemsData: CreateItemDto[]) {
  if (itemsData.length === 0) {
    throw new BadRequestError('Items array cannot be empty');
  }

  // Validate each item
  itemsData.forEach((itemData, index) => {
    try {
      validateRequestBody(itemData, createItemSchema);
    } catch (error) {
      throw new BadRequestError(
        `Validation failed for item at index ${index}`,
        error
      );
    }
  });

  // Transform and create batch
  const itemsToCreate = itemsData.map(fromCreateItemDto);
  const createdItems = await ItemRepository.createBatch(itemsToCreate);

  return createdResponse(createdItems.map(toItemResponseDto));
}

/**
 * Update item
 */
export async function updateItem(
  request: NextRequest,
  params: { id: string }
) {
  const itemId = parseIntParam(params.id, 'Item ID');

  // Check if item exists
  const existingItem = await ItemRepository.getById(itemId);
  if (!existingItem) {
    throw new NotFoundError(`Item with ID ${itemId} not found`);
  }

  const body = await request.json();
  validateRequestBody(body, updateItemSchema);

  const dto = body as UpdateItemDto;

  // Transform DTO to match repository expectations
  const updateData: Partial<TodoItem> = {
    ...dto,
    // Convert null to undefined for completedAt
    completedAt: dto.completedAt === null ? undefined : dto.completedAt,
  };

  // Update item
  const updatedItem = await ItemRepository.update(itemId, updateData);

  if (!updatedItem) {
    throw new NotFoundError(`Failed to update item with ID ${itemId}`);
  }

  return successResponse(toItemResponseDto(updatedItem));
}

/**
 * Delete item
 */
export async function deleteItem(
  request: NextRequest,
  params: { id: string }
) {
  const itemId = parseIntParam(params.id, 'Item ID');

  // Check if item exists
  const existingItem = await ItemRepository.getById(itemId);
  if (!existingItem) {
    throw new NotFoundError(`Item with ID ${itemId} not found`);
  }

  // Delete item
  const deleted = await ItemRepository.delete(itemId);

  if (!deleted) {
    throw new NotFoundError(`Failed to delete item with ID ${itemId}`);
  }

  return noContentResponse();
}

