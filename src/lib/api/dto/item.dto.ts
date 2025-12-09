/**
 * Item DTOs (Data Transfer Objects)
 * Request and response data structures for item endpoints
 */

import { TodoItem } from '@/types';
import { ValidationSchema } from '../validation';

/**
 * Create Item DTO
 */
export interface CreateItemDto {
  title: string;
  description?: string;
  type: 'Feature' | 'Issue';
  status: TodoItem['status'];
  projectId: number;
  module?: string;
}

/**
 * Update Item DTO
 */
export interface UpdateItemDto {
  title?: string;
  description?: string;
  type?: 'Feature' | 'Issue';
  status?: TodoItem['status'];
  projectId?: number;
  module?: string;
  completedAt?: Date | null;
}

/**
 * Batch Create Items DTO
 */
export interface BatchCreateItemsDto {
  items: CreateItemDto[];
}

/**
 * Item Response DTO
 */
export interface ItemResponseDto {
  id: number;
  title: string;
  description: string;
  type: 'Feature' | 'Issue';
  status: TodoItem['status'];
  projectId: number;
  module?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Item Query Parameters DTO
 */
export interface ItemQueryDto {
  projectId?: number;
  status?: TodoItem['status'];
  type?: 'Feature' | 'Issue';
  module?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Validation Schema for Create Item
 */
export const createItemSchema: ValidationSchema = {
  title: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200,
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 2000,
  },
  type: {
    required: true,
    type: 'string',
    enum: ['Feature', 'Issue'],
  },
  status: {
    required: true,
    type: 'string',
    enum: ['Not start', 'On progress', 'Pending', 'Completed', 'Archive'],
  },
  projectId: {
    required: true,
    type: 'number',
    min: 1,
  },
  module: {
    required: false,
    type: 'string',
    maxLength: 100,
  },
};

/**
 * Validation Schema for Update Item
 */
export const updateItemSchema: ValidationSchema = {
  title: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 200,
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 2000,
  },
  type: {
    required: false,
    type: 'string',
    enum: ['Feature', 'Issue'],
  },
  status: {
    required: false,
    type: 'string',
    enum: ['Not start', 'On progress', 'Pending', 'Completed', 'Archive'],
  },
  projectId: {
    required: false,
    type: 'number',
    min: 1,
  },
  module: {
    required: false,
    type: 'string',
    maxLength: 100,
  },
};

/**
 * Transform TodoItem to ItemResponseDto
 */
export function toItemResponseDto(item: TodoItem): ItemResponseDto {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    status: item.status,
    projectId: item.projectId,
    module: item.module,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    completedAt: item.completedAt?.toISOString(),
  };
}

/**
 * Transform CreateItemDto to TodoItem (for service layer)
 */
export function fromCreateItemDto(
  dto: CreateItemDto
): Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: dto.title,
    description: dto.description || '',
    type: dto.type,
    status: dto.status,
    projectId: dto.projectId,
    module: dto.module || 'Other',
  };
}

