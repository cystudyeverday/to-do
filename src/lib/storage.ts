import { GraphQLStorageManager } from './graphql-storage';
import { TodoItem, Project } from '@/types';

/**
 * StorageManager - 兼容层，使用 Hasura GraphQL 作为后端
 * 保持原有 API 接口，但所有操作都通过 GraphQL API 进行
 */
export class StorageManager {
  // 同步方法改为异步，但保持接口兼容
  static async getProjects(): Promise<Project[]> {
    return GraphQLStorageManager.getProjects();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async saveProjects(_projects: Project[]): Promise<void> {
    // 这个方法在新的 GraphQL 架构中不再需要
    // 保留以保持兼容性，但不执行任何操作
    console.warn('saveProjects is deprecated. Use addProject/updateProject instead.');
  }

  static async getItems(): Promise<TodoItem[]> {
    return GraphQLStorageManager.getItems();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async saveItems(_items: TodoItem[]): Promise<void> {
    // 这个方法在新的 GraphQL 架构中不再需要
    // 保留以保持兼容性，但不执行任何操作
    console.warn('saveItems is deprecated. Use addItem/updateItem instead.');
  }

  static async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return GraphQLStorageManager.addProject(project);
  }

  static async addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    return GraphQLStorageManager.addItem(item);
  }

  static async updateItem(id: number | string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.updateItem(numId, updates);
  }

  static async deleteItem(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.deleteItem(numId);
  }

  static async deleteProject(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.deleteProject(numId);
  }

  // 新增方法
  static async getProjectById(id: number | string): Promise<Project | null> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.getProjectById(numId);
  }

  static async getItemsByProject(projectId: number | string): Promise<TodoItem[]> {
    const numId = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    return GraphQLStorageManager.getItemsByProject(numId);
  }

  static async getItemById(id: number | string): Promise<TodoItem | null> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.getItemById(numId);
  }

  static async updateProject(id: number | string, updates: Partial<Project>): Promise<Project | null> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return GraphQLStorageManager.updateProject(numId, updates);
  }

  static async addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]> {
    return GraphQLStorageManager.addItems(items);
  }
} 