import { SupabaseStorageManager } from './supabase-storage';
import { localDatabaseManager } from './local-database';
import { Project, TodoItem } from '@/types';

export type StorageType = 'local' | 'supabase';

// 存储管理器接口
export interface IStorageManager {
  // 项目相关操作
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;

  // 任务相关操作
  getItems(): Promise<TodoItem[]>;
  getItemsByProject(projectId: string): Promise<TodoItem[]>;
  getItemById(id: string): Promise<TodoItem | null>;
  addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem>;
  updateItem(id: string, updates: Partial<TodoItem>): Promise<TodoItem | null>;
  deleteItem(id: string): Promise<boolean>;

  // 批量操作
  addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]>;

  // 特殊功能
  archiveCompletedItems(projectId: string): Promise<number>;
  getWeeklyCompletedItems(): Promise<TodoItem[]>;
  getStatistics(): Promise<any>;
  exportData(): Promise<any>;
  importData(data: { projects: any[], items: any[] }): Promise<any>;
}

// 存储管理器工厂
export class StorageManagerFactory {
  private static currentStorageType: StorageType = 'local';
  private static storageManager: IStorageManager | null = null;

  // 设置存储类型
  static setStorageType(type: StorageType) {
    this.currentStorageType = type;
    this.storageManager = null; // 重置管理器实例
  }

  // 获取当前存储类型
  static getStorageType(): StorageType {
    return this.currentStorageType;
  }

  // 获取存储管理器实例
  static getStorageManager(): IStorageManager {
    if (!this.storageManager) {
      switch (this.currentStorageType) {
        case 'local':
          this.storageManager = new LocalStorageManager();
          break;
        case 'supabase':
          this.storageManager = new SupabaseStorageManagerWrapper();
          break;
        default:
          throw new Error(`Unsupported storage type: ${this.currentStorageType}`);
      }
    }
    return this.storageManager!;
  }

  // 检查存储类型是否可用
  static async checkStorageAvailability(type: StorageType): Promise<boolean> {
    try {
      switch (type) {
        case 'local':
          // 本地存储总是可用的
          return true;
        case 'supabase':
          // 检查 Supabase 连接
          const { supabase } = await import('./supabase');
          const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
          return !error;
        default:
          return false;
      }
    } catch (error) {
      console.error(`Storage availability check failed for ${type}:`, error);
      return false;
    }
  }

  // 获取可用的存储类型
  static async getAvailableStorageTypes(): Promise<StorageType[]> {
    const availableTypes: StorageType[] = [];

    // 本地存储总是可用的
    availableTypes.push('local');

    // 检查 Supabase 是否可用
    const supabaseAvailable = await this.checkStorageAvailability('supabase');
    if (supabaseAvailable) {
      availableTypes.push('supabase');
    }

    return availableTypes;
  }

  // 数据迁移
  static async migrateData(fromType: StorageType, toType: StorageType): Promise<boolean> {
    try {
      // 临时设置源存储类型
      const originalType = this.currentStorageType;
      this.setStorageType(fromType);
      const sourceManager = this.getStorageManager();

      // 导出数据
      const exportData = await sourceManager.exportData();

      // 切换到目标存储类型
      this.setStorageType(toType);
      const targetManager = this.getStorageManager();

      // 导入数据
      await targetManager.importData(exportData);

      // 恢复原始存储类型
      this.setStorageType(originalType);

      return true;
    } catch (error) {
      console.error('Data migration failed:', error);
      return false;
    }
  }
}

// Supabase 存储管理器包装器
class SupabaseStorageManagerWrapper implements IStorageManager {
  async getProjects(): Promise<Project[]> {
    return SupabaseStorageManager.getProjects();
  }

  async getProjectById(id: string): Promise<Project | null> {
    return SupabaseStorageManager.getProjectById(id);
  }

  async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return SupabaseStorageManager.addProject(project);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    return SupabaseStorageManager.updateProject(id, updates);
  }

  async deleteProject(id: string): Promise<boolean> {
    return SupabaseStorageManager.deleteProject(id);
  }

  async getItems(): Promise<TodoItem[]> {
    return SupabaseStorageManager.getItems();
  }

  async getItemsByProject(projectId: string): Promise<TodoItem[]> {
    return SupabaseStorageManager.getItemsByProject(projectId);
  }

  async getItemById(id: string): Promise<TodoItem | null> {
    return SupabaseStorageManager.getItemById(id);
  }

  async addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    return SupabaseStorageManager.addItem(item);
  }

  async updateItem(id: string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    return SupabaseStorageManager.updateItem(id, updates);
  }

  async deleteItem(id: string): Promise<boolean> {
    return SupabaseStorageManager.deleteItem(id);
  }

  async addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]> {
    return SupabaseStorageManager.addItems(items);
  }

  async archiveCompletedItems(projectId: string): Promise<number> {
    return SupabaseStorageManager.archiveCompletedItems(projectId);
  }

  async getWeeklyCompletedItems(): Promise<TodoItem[]> {
    return SupabaseStorageManager.getWeeklyCompletedItems();
  }

  async getStatistics(): Promise<any> {
    return SupabaseStorageManager.getStatistics();
  }

  async exportData(): Promise<any> {
    return SupabaseStorageManager.exportData();
  }

  async importData(data: { projects: any[], items: any[] }): Promise<any> {
    return SupabaseStorageManager.importData(data);
  }
}

// 本地存储管理器包装器
class LocalStorageManager implements IStorageManager {
  private dbManager = localDatabaseManager;

  async getProjects(): Promise<Project[]> {
    return this.dbManager.getProjects();
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.dbManager.getProjectById(id);
  }

  async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return this.dbManager.addProject(project);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    return this.dbManager.updateProject(id, updates);
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.dbManager.deleteProject(id);
  }

  async getItems(): Promise<TodoItem[]> {
    return this.dbManager.getItems();
  }

  async getItemsByProject(projectId: string): Promise<TodoItem[]> {
    return this.dbManager.getItemsByProject(projectId);
  }

  async getItemById(id: string): Promise<TodoItem | null> {
    return this.dbManager.getItemById(id);
  }

  async addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    return this.dbManager.addItem(item);
  }

  async updateItem(id: string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    return this.dbManager.updateItem(id, updates);
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.dbManager.deleteItem(id);
  }

  async addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]> {
    return this.dbManager.addItems(items);
  }

  async archiveCompletedItems(projectId: string): Promise<number> {
    return this.dbManager.archiveCompletedItems(projectId);
  }

  async getWeeklyCompletedItems(): Promise<TodoItem[]> {
    return this.dbManager.getWeeklyCompletedItems();
  }

  async getStatistics(): Promise<any> {
    return this.dbManager.getStatistics();
  }

  async exportData(): Promise<any> {
    return this.dbManager.exportData();
  }

  async importData(data: { projects: any[], items: any[] }): Promise<any> {
    return this.dbManager.importData(data);
  }
}

// 导出便捷函数
export const getStorageManager = () => StorageManagerFactory.getStorageManager();
export const setStorageType = (type: StorageType) => StorageManagerFactory.setStorageType(type);
export const getStorageType = () => StorageManagerFactory.getStorageType();
export const checkStorageAvailability = (type: StorageType) => StorageManagerFactory.checkStorageAvailability(type);
export const getAvailableStorageTypes = () => StorageManagerFactory.getAvailableStorageTypes();
export const migrateData = (fromType: StorageType, toType: StorageType) => StorageManagerFactory.migrateData(fromType, toType);
