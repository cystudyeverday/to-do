import { supabase, TABLES, ProjectRow, ItemRow } from './supabase';
import { Project, TodoItem } from '@/types';

export class SupabaseStorageManager {
  // 映射应用状态到数据库状态
  private static mapStatusToDb(appStatus: 'Not start' | 'On progress' | 'Waiting for API' | 'Build UI' | 'Integration' | 'Completed' | 'Fix'): 'Not start' | 'On progress' | 'Pending' | 'Completed' | 'Archive' {
    switch (appStatus) {
      case 'Not start':
        return 'Not start';
      case 'On progress':
        return 'On progress';
      case 'Waiting for API':
        return 'Pending'; // Map to Pending in database
      case 'Build UI':
        return 'On progress'; // Map to On progress in database
      case 'Integration':
        return 'On progress'; // Map to On progress in database
      case 'Completed':
        return 'Completed';
      case 'Fix':
        return 'On progress'; // Map to On progress in database
      default:
        return 'Not start'; // Default fallback
    }
  }

  // 项目相关操作
  static async getProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }

      return data.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      console.error('Error in getProjects:', error);
      return [];
    }
  }

  static async getProjectById(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error in getProjectById:', error);
      return null;
    }
  }

  static async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const now = new Date().toISOString();
      const newProject: Omit<ProjectRow, 'id'> = {
        name: project.name,
        description: project.description || null,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .insert(newProject)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add project: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error in addProject:', error);
      throw error;
    }
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const updateData: Partial<ProjectRow> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description || null;

      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error in updateProject:', error);
      return null;
    }
  }

  static async deleteProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.PROJECTS)
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error in deleteProject:', error);
      return false;
    }
  }

  // 任务相关操作
  static async getItems(): Promise<TodoItem[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ITEMS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching items:', error);
        return [];
      }

      return data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        type: row.type,
        status: row.status,
        projectId: row.project_id,
        module: row.module || 'Other',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error in getItems:', error);
      return [];
    }
  }

  static async getItemsByProject(projectId: string): Promise<TodoItem[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ITEMS)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project items:', error);
        return [];
      }

      return data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        type: row.type,
        status: row.status,
        projectId: row.project_id,
        module: row.module || 'Other',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error in getItemsByProject:', error);
      return [];
    }
  }

  static async getItemById(id: string): Promise<TodoItem | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ITEMS)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        type: data.type,
        status: data.status,
        projectId: data.project_id,
        module: data.module || 'Other',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      };
    } catch (error) {
      console.error('Error in getItemById:', error);
      return null;
    }
  }

  static async addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    try {
      const now = new Date().toISOString();
      const newItem: Omit<ItemRow, 'id'> = {
        title: item.title,
        description: item.description || null,
        type: item.type,
        status: this.mapStatusToDb(item.status),
        project_id: item.projectId,
        module: item.module || null,
        created_at: now,
        updated_at: now,
        completed_at: item.completedAt?.toISOString() || null,
      };

      const { data, error } = await supabase
        .from(TABLES.ITEMS)
        .insert(newItem)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add item: ${error.message}`);
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        type: data.type,
        status: data.status,
        projectId: data.project_id,
        module: data.module || 'Other',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      };
    } catch (error) {
      console.error('Error in addItem:', error);
      throw error;
    }
  }

  static async updateItem(id: string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    try {
      const updateData: Partial<ItemRow> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.status !== undefined) updateData.status = this.mapStatusToDb(updates.status);
      if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
      if (updates.module !== undefined) updateData.module = updates.module || null;
      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt?.toISOString() || null;

      const { data, error } = await supabase
        .from(TABLES.ITEMS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        type: data.type,
        status: data.status,
        projectId: data.project_id,
        module: data.module || 'Other',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      };
    } catch (error) {
      console.error('Error in updateItem:', error);
      return null;
    }
  }

  static async deleteItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.ITEMS)
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error in deleteItem:', error);
      return false;
    }
  }

  // 批量操作
  static async addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]> {
    try {
      const now = new Date().toISOString();
      const newItems: Omit<ItemRow, 'id'>[] = items.map(item => ({
        title: item.title,
        description: item.description || null,
        type: item.type,
        status: this.mapStatusToDb(item.status),
        project_id: item.projectId,
        module: item.module || null,
        created_at: now,
        updated_at: now,
        completed_at: item.completedAt?.toISOString() || null,
      }));

      const { data, error } = await supabase
        .from(TABLES.ITEMS)
        .insert(newItems)
        .select();

      if (error) {
        throw new Error(`Failed to add items: ${error.message}`);
      }

      return data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        type: row.type,
        status: row.status,
        projectId: row.project_id,
        module: row.module || 'Other',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error in addItems:', error);
      throw error;
    }
  }

  // 归档功能
  static async archiveCompletedItems(projectId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(TABLES.ITEMS)
        .update({
          status: 'Archive',
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('status', 'Completed');

      if (error) {
        console.error('Error archiving items:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in archiveCompletedItems:', error);
      return 0;
    }
  }

  // 获取本周完成的任务
  static async getWeeklyCompletedItems(): Promise<TodoItem[]> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from(TABLES.ITEMS)
        .select('*')
        .eq('status', 'Completed')
        .gte('completed_at', oneWeekAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching weekly completed items:', error);
        return [];
      }

      return data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        type: row.type,
        status: row.status,
        projectId: row.project_id,
        module: row.module || 'Other',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error in getWeeklyCompletedItems:', error);
      return [];
    }
  }

  // 统计功能
  static async getStatistics() {
    try {
      // 获取总任务数（不包括归档的）
      const { count: totalItems } = await supabase
        .from(TABLES.ITEMS)
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Archive');

      // 获取已完成任务数
      const { count: completedItems } = await supabase
        .from(TABLES.ITEMS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Completed');

      // 获取进行中任务数
      const { count: inProgressItems } = await supabase
        .from(TABLES.ITEMS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'On progress');

      // 获取待处理任务数
      const { count: pendingItems } = await supabase
        .from(TABLES.ITEMS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      // 获取未开始任务数
      const { count: notStartedItems } = await supabase
        .from(TABLES.ITEMS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Not start');

      // 获取归档任务数
      const { count: archivedItems } = await supabase
        .from(TABLES.ITEMS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Archive');

      // 获取项目总数
      const { count: totalProjects } = await supabase
        .from(TABLES.PROJECTS)
        .select('*', { count: 'exact', head: true });

      return {
        totalItems: totalItems || 0,
        completedItems: completedItems || 0,
        inProgressItems: inProgressItems || 0,
        pendingItems: pendingItems || 0,
        notStartedItems: notStartedItems || 0,
        archivedItems: archivedItems || 0,
        totalProjects: totalProjects || 0,
      };
    } catch (error) {
      console.error('Error in getStatistics:', error);
      return {
        totalItems: 0,
        completedItems: 0,
        inProgressItems: 0,
        pendingItems: 0,
        notStartedItems: 0,
        archivedItems: 0,
        totalProjects: 0,
      };
    }
  }

  // 数据迁移（从localStorage到Supabase）
  static async migrateFromLocalStorage(localStorageData: { projects: any[], items: any[] }) {
    try {
      // 清空现有数据
      await supabase.from(TABLES.ITEMS).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from(TABLES.PROJECTS).delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 迁移项目
      const migratedProjects: Project[] = [];
      for (const project of localStorageData.projects) {
        const newProject = await this.addProject({
          name: project.name,
          description: project.description,
        });
        migratedProjects.push(newProject);
      }

      // 迁移任务
      const migratedItems: TodoItem[] = [];
      for (const item of localStorageData.items) {
        const newItem = await this.addItem({
          title: item.title,
          description: item.description,
          type: item.type,
          status: item.status,
          projectId: item.projectId,
          module: item.module || 'Other',
          completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
        });
        migratedItems.push(newItem);
      }

      return { projects: migratedProjects, items: migratedItems };
    } catch (error) {
      console.error('Error in migrateFromLocalStorage:', error);
      throw error;
    }
  }

  // 数据导出
  static async exportData() {
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
      console.error('Error in exportData:', error);
      throw error;
    }
  }

  // 数据导入
  static async importData(data: { projects: any[], items: any[] }) {
    try {
      // 清空现有数据
      await supabase.from(TABLES.ITEMS).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from(TABLES.PROJECTS).delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 导入项目
      const importedProjects: Project[] = [];
      for (const project of data.projects) {
        const newProject = await this.addProject({
          name: project.name,
          description: project.description,
        });
        importedProjects.push(newProject);
      }

      // 导入任务
      const importedItems: TodoItem[] = [];
      for (const item of data.items) {
        const newItem = await this.addItem({
          title: item.title,
          description: item.description,
          type: item.type,
          status: item.status,
          projectId: item.projectId,
          module: item.module || 'Other',
          completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
        });
        importedItems.push(newItem);
      }

      return { projects: importedProjects, items: importedItems };
    } catch (error) {
      console.error('Error in importData:', error);
      throw error;
    }
  }
}
