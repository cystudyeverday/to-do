import { TodoItem, Project } from '@/types';

export class DatabaseStorageManager {
  // 项目相关操作
  static async getProjects(): Promise<Project[]> {
    try {
      const response = await fetch('/api/database/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const response = await fetch('/api/database/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const response = await fetch(`/api/database/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to update project');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  static async deleteProject(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/database/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        throw new Error('Failed to delete project');
      }

      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // 任务相关操作
  static async getItems(projectId?: string): Promise<TodoItem[]> {
    try {
      const url = projectId 
        ? `/api/database/items?projectId=${projectId}`
        : '/api/database/items';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  }

  static async addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    try {
      const response = await fetch('/api/database/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error('Failed to create item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  static async updateItem(id: string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    try {
      const response = await fetch(`/api/database/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to update item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  static async deleteItem(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/database/items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        throw new Error('Failed to delete item');
      }

      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }

  // 批量操作
  static async addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]> {
    const results: TodoItem[] = [];
    
    for (const item of items) {
      try {
        const result = await this.addItem(item);
        results.push(result);
      } catch (error) {
        console.error('Error adding item:', error);
        throw error;
      }
    }
    
    return results;
  }

  // 数据迁移
  static async migrateFromLocalStorage(localStorageData: { projects: any[], items: any[] }): Promise<any> {
    try {
      const response = await fetch('/api/database/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ localStorageData }),
      });

      if (!response.ok) {
        throw new Error('Migration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error migrating data:', error);
      throw error;
    }
  }

  // 数据导出
  static async exportData(): Promise<any> {
    try {
      const response = await fetch('/api/database/export');
      if (!response.ok) {
        throw new Error('Export failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // 数据导入
  static async importData(data: { projects: any[], items: any[] }): Promise<any> {
    try {
      const response = await fetch('/api/database/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // 统计信息
  static async getStatistics(): Promise<any> {
    try {
      const response = await fetch('/api/database/statistics');
      if (!response.ok) {
        throw new Error('Failed to get statistics');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalItems: 0,
        completedItems: 0,
        inProgressItems: 0,
        pendingItems: 0,
        totalProjects: 0,
      };
    }
  }
} 