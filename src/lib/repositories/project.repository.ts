/**
 * Project Repository
 * Handles all project-related GraphQL operations
 */

import { apolloClient } from '../apollo-client';
import { GET_PROJECTS, GET_PROJECT_BY_ID } from '../graphql/queries';
import { CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT } from '../graphql/mutations';
import { Project } from '@/types';
import {
  GetProjectsResponse,
  GetProjectByIdResponse,
  CreateProjectResponse,
  UpdateProjectResponse,
  DeleteProjectResponse,
} from '../graphql/types';
import {
  transformProject,
  transformProjects,
  buildProjectCreateInput,
  buildProjectUpdateInput,
} from '../graphql/transformers';
import { normalizeId } from '../graphql/utils';

/**
 * Project Repository Class
 * Provides CRUD operations for projects
 */
export class ProjectRepository {
  /**
   * Get all projects
   */
  static async getAll(): Promise<Project[]> {
    try {
      const { data } = await apolloClient.query<GetProjectsResponse>({
        query: GET_PROJECTS,
        fetchPolicy: 'network-only',
      });

      if (!data) return [];

      return transformProjects(data.projects);
    } catch (error) {
      console.error('[ProjectRepository] Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Get project by ID
   */
  static async getById(id: number | string): Promise<Project | null> {
    try {
      const { data } = await apolloClient.query<GetProjectByIdResponse>({
        query: GET_PROJECT_BY_ID,
        variables: { id: normalizeId(id) },
        fetchPolicy: 'network-only',
      });

      if (!data?.projects_by_pk) return null;

      return transformProject(data.projects_by_pk);
    } catch (error) {
      console.error('[ProjectRepository] Error fetching project:', error);
      return null;
    }
  }

  /**
   * Create a new project
   */
  static async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const { data } = await apolloClient.mutate<CreateProjectResponse>({
        mutation: CREATE_PROJECT,
        variables: buildProjectCreateInput(project),
      });

      if (!data?.insert_projects_one) {
        throw new Error('Failed to create project');
      }

      return transformProject(data.insert_projects_one);
    } catch (error) {
      console.error('[ProjectRepository] Error creating project:', error);
      throw error;
    }
  }

  /**
   * Update a project
   */
  static async update(id: number | string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const { data } = await apolloClient.mutate<UpdateProjectResponse>({
        mutation: UPDATE_PROJECT,
        variables: {
          id: normalizeId(id),
          ...buildProjectUpdateInput(updates),
        },
      });

      if (!data?.update_projects_by_pk) return null;

      return transformProject(data.update_projects_by_pk);
    } catch (error) {
      console.error('[ProjectRepository] Error updating project:', error);
      return null;
    }
  }

  /**
   * Delete a project
   */
  static async delete(id: number | string): Promise<boolean> {
    try {
      const { data } = await apolloClient.mutate<DeleteProjectResponse>({
        mutation: DELETE_PROJECT,
        variables: { id: normalizeId(id) },
      });

      return !!data?.delete_projects_by_pk;
    } catch (error) {
      console.error('[ProjectRepository] Error deleting project:', error);
      return false;
    }
  }
}

