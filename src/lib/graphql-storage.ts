import { apolloClient } from './apollo-client';
import { GET_PROJECTS, GET_PROJECT_BY_ID, GET_ITEMS, GET_ITEMS_BY_PROJECT, GET_ITEM_BY_ID } from './graphql/queries';
import { CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT, CREATE_ITEM, UPDATE_ITEM, DELETE_ITEM, CREATE_ITEMS } from './graphql/mutations';
import { Project, TodoItem } from '@/types';

/**
 * 基于 Hasura GraphQL 的存储管理器
 * 所有操作都通过 GraphQL API 进行
 */
export class GraphQLStorageManager {
  // ==================== 项目相关操作 ====================

  static async getProjects(): Promise<Project[]> {
    try {
      const { data } = await apolloClient.query<{
        projects: Array<{
          id: number;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        }>;
      }>({
        query: GET_PROJECTS,
        fetchPolicy: 'network-only',
      });

      if (!data) return [];

      return data.projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async getProjectById(id: number): Promise<Project | null> {
    try {
      const { data } = await apolloClient.query<{
        projects_by_pk: {
          id: number;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        } | null;
      }>({
        query: GET_PROJECT_BY_ID,
        variables: { id: typeof id === 'string' ? parseInt(id, 10) : id },
        fetchPolicy: 'network-only',
      });

      if (!data?.projects_by_pk) return null;

      const project = data.projects_by_pk;
      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      };
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  }

  static async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const { data } = await apolloClient.mutate<{
        insert_projects_one: {
          id: number;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
      }>({
        mutation: CREATE_PROJECT,
        variables: {
          name: project.name,
          description: project.description || null,
        },
      });

      if (!data?.insert_projects_one) {
        throw new Error('Failed to create project');
      }

      const created = data.insert_projects_one;
      return {
        id: created.id,
        name: created.name,
        description: created.description || '',
        createdAt: new Date(created.created_at),
        updatedAt: new Date(created.updated_at),
      };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static async updateProject(id: number, updates: Partial<Project>): Promise<Project | null> {
    try {
      const { data } = await apolloClient.mutate<{
        update_projects_by_pk: {
          id: number;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        } | null;
      }>({
        mutation: UPDATE_PROJECT,
        variables: {
          id: typeof id === 'string' ? parseInt(id, 10) : id,
          name: updates.name,
          description: updates.description !== undefined ? updates.description : null,
        },
      });

      if (!data?.update_projects_by_pk) return null;

      const project = data.update_projects_by_pk;
      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      };
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  static async deleteProject(id: number): Promise<boolean> {
    try {
      const { data } = await apolloClient.mutate<{
        delete_projects_by_pk: {
          id: number;
        } | null;
      }>({
        mutation: DELETE_PROJECT,
        variables: { id: typeof id === 'string' ? parseInt(id, 10) : id },
      });

      return !!data?.delete_projects_by_pk;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // ==================== 任务相关操作 ====================

  static async getItems(): Promise<TodoItem[]> {
    try {
      const { data } = await apolloClient.query<{
        items: Array<{
          id: number;
          title: string;
          description: string | null;
          type: string;
          status: string;
          project_id: number;
          module: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        }>;
      }>({
        query: GET_ITEMS,
        fetchPolicy: 'network-only',
      });

      if (!data) return [];

      return data.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        type: item.type as 'Feature' | 'Issue',
        status: item.status as TodoItem['status'],
        projectId: item.project_id,
        module: item.module || 'Other',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  }

  static async getItemsByProject(projectId: number): Promise<TodoItem[]> {
    try {
      const { data } = await apolloClient.query<{
        items: Array<{
          id: number;
          title: string;
          description: string | null;
          type: string;
          status: string;
          project_id: number;
          module: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        }>;
      }>({
        query: GET_ITEMS_BY_PROJECT,
        variables: { projectId: typeof projectId === 'string' ? parseInt(projectId, 10) : projectId },
        fetchPolicy: 'network-only',
      });

      if (!data) return [];

      return data.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        type: item.type as 'Feature' | 'Issue',
        status: item.status as TodoItem['status'],
        projectId: item.project_id,
        module: item.module || 'Other',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching project items:', error);
      return [];
    }
  }

  static async getItemById(id: number): Promise<TodoItem | null> {
    try {
      const { data } = await apolloClient.query<{
        items_by_pk: {
          id: number;
          title: string;
          description: string | null;
          type: string;
          status: string;
          project_id: number;
          module: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        } | null;
      }>({
        query: GET_ITEM_BY_ID,
        variables: { id: typeof id === 'string' ? parseInt(id, 10) : id },
        fetchPolicy: 'network-only',
      });

      if (!data?.items_by_pk) return null;

      const item = data.items_by_pk;
      return {
        id: item.id,
        title: item.title,
        description: item.description || '',
        type: item.type as 'Feature' | 'Issue',
        status: item.status as TodoItem['status'],
        projectId: item.project_id,
        module: item.module || 'Other',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
      };
    } catch (error) {
      console.error('Error fetching item:', error);
      return null;
    }
  }

  static async addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    try {
      const { data } = await apolloClient.mutate<{
        insert_items_one: {
          id: number;
          title: string;
          description: string | null;
          type: string;
          status: string;
          project_id: number;
          module: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
      }>({
        mutation: CREATE_ITEM,
        variables: {
          title: item.title,
          description: item.description || null,
          type: item.type,
          status: item.status,
          project_id: item.projectId,
          module: item.module || null,
        },
      });

      if (!data?.insert_items_one) {
        throw new Error('Failed to create item');
      }

      const created = data.insert_items_one;
      return {
        id: created.id,
        title: created.title,
        description: created.description || '',
        type: created.type as 'Feature' | 'Issue',
        status: created.status as TodoItem['status'],
        projectId: created.project_id,
        module: created.module || 'Other',
        createdAt: new Date(created.created_at),
        updatedAt: new Date(created.updated_at),
        completedAt: created.completed_at ? new Date(created.completed_at) : undefined,
      };
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  static async updateItem(id: number, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    try {
      // 构建只包含要更新的字段的 variables 对象
      // 注意：只包含实际要更新的字段，不包含 null 或 undefined 值
      const variables: any = {
        id: typeof id === 'string' ? parseInt(id, 10) : id,
      };

      // 只添加实际要更新的字段，并且确保非空字段不为 null
      // title 是 NOT NULL 字段，所以必须确保不为 null 或空字符串
      if (updates.title !== undefined && updates.title !== null && updates.title.trim() !== '') {
        variables.title = updates.title;
      }
      // description 可以为 null
      if (updates.description !== undefined) {
        variables.description = updates.description || null;
      }
      // type 是 NOT NULL 字段
      if (updates.type !== undefined && updates.type !== null) {
        variables.type = updates.type;
      }
      // status 是 NOT NULL 字段
      if (updates.status !== undefined && updates.status !== null) {
        variables.status = updates.status;
      }
      // project_id 是 NOT NULL 字段
      if (updates.projectId !== undefined && updates.projectId !== null) {
        variables.project_id = updates.projectId;
      }
      // module 可以为 null
      if (updates.module !== undefined) {
        variables.module = updates.module || null;
      }
      // completed_at 可以为 null，格式为 timestamp (YYYY-MM-DD HH:MM:SS)
      if (updates.completedAt !== undefined) {
        if (updates.completedAt) {
          const date = new Date(updates.completedAt);
          // 格式化为 timestamp 格式 (YYYY-MM-DD HH:MM:SS)，不带时区
          const year = date.getUTCFullYear();
          const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
          const day = date.getUTCDate().toString().padStart(2, '0');
          const hours = date.getUTCHours().toString().padStart(2, '0');
          const minutes = date.getUTCMinutes().toString().padStart(2, '0');
          const seconds = date.getUTCSeconds().toString().padStart(2, '0');
          variables.completed_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else {
          variables.completed_at = null;
        }
      }

      const { data } = await apolloClient.mutate<{
        update_items_by_pk: {
          id: number;
          title: string;
          description: string | null;
          type: string;
          status: string;
          project_id: number;
          module: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        } | null;
      }>({
        mutation: UPDATE_ITEM,
        variables,
      });

      if (!data?.update_items_by_pk) return null;

      const item = data.update_items_by_pk;
      return {
        id: item.id,
        title: item.title,
        description: item.description || '',
        type: item.type as 'Feature' | 'Issue',
        status: item.status as TodoItem['status'],
        projectId: item.project_id,
        module: item.module || 'Other',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
      };
    } catch (error) {
      console.error('Error updating item:', error);
      return null;
    }
  }

  static async deleteItem(id: number): Promise<boolean> {
    try {
      const { data } = await apolloClient.mutate<{
        delete_items_by_pk: {
          id: number;
        } | null;
      }>({
        mutation: DELETE_ITEM,
        variables: { id: typeof id === 'string' ? parseInt(id, 10) : id },
      });

      return !!data?.delete_items_by_pk;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }

  // ==================== 批量操作 ====================

  static async addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]> {
    try {
      const objects = items.map((item) => {
        let completed_at: string | null = null;
        if (item.completedAt) {
          const date = new Date(item.completedAt);
          // 格式化为 timestamp 格式 (YYYY-MM-DD HH:MM:SS)，不带时区
          const year = date.getUTCFullYear();
          const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
          const day = date.getUTCDate().toString().padStart(2, '0');
          const hours = date.getUTCHours().toString().padStart(2, '0');
          const minutes = date.getUTCMinutes().toString().padStart(2, '0');
          const seconds = date.getUTCSeconds().toString().padStart(2, '0');
          completed_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        return {
          title: item.title,
          description: item.description || null,
          type: item.type,
          status: item.status,
          project_id: item.projectId,
          module: item.module || null,
          completed_at,
        };
      });

      const { data } = await apolloClient.mutate<{
        insert_items: {
          returning: Array<{
            id: number;
            title: string;
            description: string | null;
            type: string;
            status: string;
            project_id: number;
            module: string | null;
            created_at: string;
            updated_at: string;
            completed_at: string | null;
          }>;
        };
      }>({
        mutation: CREATE_ITEMS,
        variables: { objects },
      });

      if (!data?.insert_items) {
        throw new Error('Failed to create items');
      }

      return data.insert_items.returning.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        type: item.type as 'Feature' | 'Issue',
        status: item.status as TodoItem['status'],
        projectId: item.project_id,
        module: item.module || 'Other',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error creating items:', error);
      throw error;
    }
  }

  // ==================== 特殊功能 ====================

  static async archiveCompletedItems(projectId: number): Promise<number> {
    try {
      const items = await this.getItemsByProject(projectId);
      const completedItems = items.filter((item) => item.status === 'Completed');

      let archivedCount = 0;
      for (const item of completedItems) {
        const updated = await this.updateItem(item.id, { status: 'Archive' as TodoItem['status'] });
        if (updated) archivedCount++;
      }

      return archivedCount;
    } catch (error) {
      console.error('Error archiving items:', error);
      return 0;
    }
  }

  static async getWeeklyCompletedItems(): Promise<TodoItem[]> {
    try {
      const items = await this.getItems();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      return items.filter(
        (item) =>
          item.status === 'Completed' &&
          item.completedAt &&
          item.completedAt >= oneWeekAgo
      );
    } catch (error) {
      console.error('Error fetching weekly completed items:', error);
      return [];
    }
  }

  static async getStatistics(): Promise<any> {
    try {
      // 使用统计 API 端点
      const response = await fetch('/api/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      return data.statistics;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        totalItems: 0,
        completedItems: 0,
        inProgressItems: 0,
        notStartedItems: 0,
        weeklyNewItems: 0,
        weeklyCompletedItems: 0,
        averageCompletionTime: 0,
        projectEfficiency: [],
        typeDistribution: [],
        dailyCompletions: [],
        totalProjects: 0,
      };
    }
  }

  static async exportData(): Promise<any> {
    try {
      const projects = await this.getProjects();
      const items = await this.getItems();
      const statistics = await this.getStatistics();

      return {
        projects,
        items,
        exportTime: new Date().toISOString(),
        version: '1.0.0',
        totalProjects: projects.length,
        totalItems: items.length,
        statistics,
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async importData(data: { projects: any[]; items: any[] }): Promise<any> {
    try {
      // 导入项目
      const importedProjects: Project[] = [];
      for (const project of data.projects) {
        const newProject = await this.addProject({
          name: project.name,
          description: project.description,
        });
        importedProjects.push(newProject);
      }

      // 导入任务（需要映射项目 ID）
      const projectIdMap = new Map<string | number, number>();
      data.projects.forEach((oldProject, index) => {
        if (importedProjects[index]) {
          projectIdMap.set(oldProject.id, importedProjects[index].id);
        }
      });

      const importedItems: TodoItem[] = [];
      for (const item of data.items) {
        const newProjectId = projectIdMap.get(item.projectId) || item.projectId;
        const newItem = await this.addItem({
          title: item.title,
          description: item.description,
          type: item.type,
          status: item.status,
          projectId: newProjectId,
          module: item.module || 'Other',
          completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
        });
        importedItems.push(newItem);
      }

      return { projects: importedProjects, items: importedItems };
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

