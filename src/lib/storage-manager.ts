import { GraphQLStorageManager } from './graphql-storage';
import { Project, TodoItem } from '@/types';

// 存储管理器接口
export interface IStorageManager {
  // 项目相关操作
  getProjects(): Promise<Project[]>;
  getProjectById(id: number | string): Promise<Project | null>;
  addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  updateProject(id: number | string, updates: Partial<Project>): Promise<Project | null>;
  deleteProject(id: number | string): Promise<boolean>;

  // 任务相关操作
  getItems(): Promise<TodoItem[]>;
  getItemsByProject(projectId: number | string): Promise<TodoItem[]>;
  getItemById(id: number | string): Promise<TodoItem | null>;
  addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem>;
  updateItem(id: number | string, updates: Partial<TodoItem>): Promise<TodoItem | null>;
  deleteItem(id: number | string): Promise<boolean>;

  // 批量操作
  addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]>;

  // 特殊功能
  archiveCompletedItems(projectId: number | string): Promise<number>;
  getWeeklyCompletedItems(): Promise<TodoItem[]>;
  getStatistics(): Promise<any>;
  exportData(): Promise<any>;
  importData(data: { projects: any[], items: any[] }): Promise<any>;
}

// 存储管理器工厂 - 现在只使用 Hasura GraphQL
export class StorageManagerFactory {
  private static storageManager: IStorageManager | null = null;

  // 获取存储管理器实例（始终使用 GraphQL）
  static getStorageManager(): IStorageManager {
    if (!this.storageManager) {
      this.storageManager = new GraphQLStorageManagerWrapper();
    }
    return this.storageManager;
  }

  // 检查 Hasura 连接是否可用
  static async checkStorageAvailability(): Promise<boolean> {
    try {
      const response = await fetch('/api/test-graphql-connection');
      if (!response.ok) return false;
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Storage availability check failed:', error);
      return false;
    }
  }
}

// GraphQL 存储管理器包装器
class GraphQLStorageManagerWrapper implements IStorageManager {
  async getProjects(): Promise<Project[]> {
    return GraphQLStorageManager.getProjects();
  }

  async getProjectById(id: number | string): Promise<Project | null> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.getProjectById(numId);
  }

  async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return GraphQLStorageManager.addProject(project);
  }

  async updateProject(id: number | string, updates: Partial<Project>): Promise<Project | null> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.updateProject(numId, updates);
  }

  async deleteProject(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.deleteProject(numId);
  }

  async getItems(): Promise<TodoItem[]> {
    return GraphQLStorageManager.getItems();
  }

  async getItemsByProject(projectId: number | string): Promise<TodoItem[]> {
    const numId = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    return GraphQLStorageManager.getItemsByProject(numId);
  }

  async getItemById(id: number | string): Promise<TodoItem | null> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.getItemById(numId);
  }

  async addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    return GraphQLStorageManager.addItem(item);
  }

  async updateItem(id: number | string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.updateItem(numId, updates);
  }

  async deleteItem(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.deleteItem(numId);
  }

  async addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]> {
    return GraphQLStorageManager.addItems(items);
  }

  async archiveCompletedItems(projectId: number | string): Promise<number> {
    const numId = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    return GraphQLStorageManager.archiveCompletedItems(numId);
  }

  async getWeeklyCompletedItems(): Promise<TodoItem[]> {
    return GraphQLStorageManager.getWeeklyCompletedItems();
  }

  async getStatistics(): Promise<any> {
    return GraphQLStorageManager.getStatistics();
  }

  async exportData(): Promise<any> {
    return GraphQLStorageManager.exportData();
  }

  async importData(data: { projects: any[], items: any[] }): Promise<any> {
    return GraphQLStorageManager.importData(data);
  }
}

// 导出便捷函数
export const getStorageManager = () => StorageManagerFactory.getStorageManager();
export const checkStorageAvailability = () => StorageManagerFactory.checkStorageAvailability();
