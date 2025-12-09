/**
 * Project DTOs (Data Transfer Objects)
 * Request and response data structures for project endpoints
 */

import { Project } from '@/types';
import { ValidationSchema } from '../validation';

/**
 * Create Project DTO
 */
export interface CreateProjectDto {
  name: string;
  description?: string;
}

/**
 * Update Project DTO
 */
export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

/**
 * Project Response DTO
 */
export interface ProjectResponseDto {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project with Stats Response DTO
 */
export interface ProjectWithStatsDto extends ProjectResponseDto {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
  };
}

/**
 * Validation Schema for Create Project
 */
export const createProjectSchema: ValidationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 500,
  },
};

/**
 * Validation Schema for Update Project
 */
export const updateProjectSchema: ValidationSchema = {
  name: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 500,
  },
};

/**
 * Transform Project to ProjectResponseDto
 */
export function toProjectResponseDto(project: Project): ProjectResponseDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

/**
 * Transform CreateProjectDto to Project (for service layer)
 */
export function fromCreateProjectDto(
  dto: CreateProjectDto
): Omit<Project, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: dto.name,
    description: dto.description ?? '',
  };
}

