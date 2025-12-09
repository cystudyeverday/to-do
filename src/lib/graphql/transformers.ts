/**
 * GraphQL Data Transformers
 * Functions to transform GraphQL responses to domain models and vice versa
 */

import { Project, TodoItem } from '@/types';
import { GraphQLProject, GraphQLItem } from './types';
import { parseTimestamp, parseOptionalTimestamp, formatOptionalTimestamp } from './utils';

// ==================== From GraphQL to Domain ====================

/**
 * Transform GraphQL project response to Project domain model
 */
export function transformProject(project: GraphQLProject): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description || '',
    createdAt: parseTimestamp(project.created_at),
    updatedAt: parseTimestamp(project.updated_at),
  };
}

/**
 * Transform GraphQL item response to TodoItem domain model
 */
export function transformItem(item: GraphQLItem): TodoItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    type: item.type as 'Feature' | 'Issue',
    status: item.status as TodoItem['status'],
    projectId: item.project_id,
    module: item.module || 'Other',
    createdAt: parseTimestamp(item.created_at),
    updatedAt: parseTimestamp(item.updated_at),
    completedAt: parseOptionalTimestamp(item.completed_at),
  };
}

/**
 * Transform array of GraphQL projects to domain models
 */
export function transformProjects(projects: GraphQLProject[]): Project[] {
  return projects.map(transformProject);
}

/**
 * Transform array of GraphQL items to domain models
 */
export function transformItems(items: GraphQLItem[]): TodoItem[] {
  return items.map(transformItem);
}

// ==================== From Domain to GraphQL ====================

/**
 * Build GraphQL variables for project creation
 */
export function buildProjectCreateInput(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    name: project.name,
    description: project.description || null,
  };
}

/**
 * Build GraphQL variables for project update
 */
export function buildProjectUpdateInput(updates: Partial<Project>) {
  return {
    name: updates.name,
    description: updates.description !== undefined ? updates.description : null,
  };
}

/**
 * Build GraphQL variables for item creation
 */
export function buildItemCreateInput(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    title: item.title,
    description: item.description || null,
    type: item.type,
    status: item.status,
    project_id: item.projectId,
    module: item.module || null,
  };
}

/**
 * Build GraphQL _set object for item update
 * Only includes fields that are actually being updated
 */
export function buildItemUpdateSet(updates: Partial<TodoItem>): Record<string, any> {
  const setObject: Record<string, any> = {};

  if (updates.title !== undefined && updates.title !== null && updates.title.trim() !== '') {
    setObject.title = updates.title;
  }
  if (updates.description !== undefined) {
    setObject.description = updates.description || null;
  }
  if (updates.type !== undefined && updates.type !== null) {
    setObject.type = updates.type;
  }
  if (updates.status !== undefined && updates.status !== null) {
    setObject.status = updates.status;
  }
  if (updates.projectId !== undefined && updates.projectId !== null) {
    setObject.project_id = updates.projectId;
  }
  if (updates.module !== undefined) {
    setObject.module = updates.module || null;
  }
  if (updates.completedAt !== undefined) {
    setObject.completed_at = formatOptionalTimestamp(updates.completedAt);
  }

  // Always update updated_at timestamp
  setObject.updated_at = new Date().toISOString();

  return setObject;
}

/**
 * Build GraphQL variables for batch item creation
 */
export function buildItemBatchInsertInput(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Record<string, any>[] {
  return items.map((item) => ({
    title: item.title,
    description: item.description || null,
    type: item.type,
    status: item.status,
    project_id: item.projectId,
    module: item.module || null,
    completed_at: formatOptionalTimestamp(item.completedAt),
  }));
}

