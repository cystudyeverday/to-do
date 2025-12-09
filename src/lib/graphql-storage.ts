/**
 * GraphQL Storage Manager
 * Main orchestrator for data operations using GraphQL backend
 * Delegates to repositories for basic CRUD and provides high-level operations
 */

import { Project, TodoItem } from '@/types';
import { ProjectRepository, ItemRepository } from './repositories';

/**
 * GraphQL Storage Manager
 * Provides a unified interface for all storage operations
 */
export class GraphQLStorageManager {
  // ==================== Project Operations ====================

  /**
   * Get all projects
   */
  static async getProjects(): Promise<Project[]> {
    return ProjectRepository.getAll();
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: number): Promise<Project | null> {
    return ProjectRepository.getById(id);
  }

  /**
   * Create a new project
   */
  static async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return ProjectRepository.create(project);
  }

  /**
   * Update a project
   */
  static async updateProject(id: number, updates: Partial<Project>): Promise<Project | null> {
    return ProjectRepository.update(id, updates);
  }

  /**
   * Delete a project
   */
  static async deleteProject(id: number): Promise<boolean> {
    return ProjectRepository.delete(id);
  }

  // ==================== Item Operations ====================

  /**
   * Get all items
   */
  static async getItems(): Promise<TodoItem[]> {
    return ItemRepository.getAll();
  }

  /**
   * Get items by project
   */
  static async getItemsByProject(projectId: number): Promise<TodoItem[]> {
    return ItemRepository.getByProject(projectId);
  }

  /**
   * Get item by ID
   */
  static async getItemById(id: number): Promise<TodoItem | null> {
    return ItemRepository.getById(id);
  }

  /**
   * Create a new item
   */
  static async addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    return ItemRepository.create(item);
  }

  /**
   * Update an item
   */
  static async updateItem(id: number, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    return ItemRepository.update(id, updates);
  }

  /**
   * Delete an item
   */
  static async deleteItem(id: number): Promise<boolean> {
    return ItemRepository.delete(id);
  }

  /**
   * Create multiple items in batch
   */
  static async addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]> {
    return ItemRepository.createBatch(items);
  }

  // ==================== High-Level Operations ====================

  /**
   * Archive all completed items in a project
   */
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
      console.error('[GraphQLStorageManager] Error archiving items:', error);
      return 0;
    }
  }

  /**
   * Get items completed in the last week
   */
  static async getWeeklyCompletedItems(): Promise<TodoItem[]> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const now = new Date();

      return ItemRepository.getCompletedInRange(oneWeekAgo, now);
    } catch (error) {
      console.error('[GraphQLStorageManager] Error fetching weekly completed items:', error);
      return [];
    }
  }

  /**
   * Get statistics (delegates to statistics API)
   */
  static async getStatistics(): Promise<any> {
    try {
      const response = await fetch('/api/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      return data.statistics;
    } catch (error) {
      console.error('[GraphQLStorageManager] Error fetching statistics:', error);
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

  /**
   * Export all data
   */
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
      console.error('[GraphQLStorageManager] Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import data from external source
   */
  static async importData(data: { projects: any[]; items: any[] }): Promise<any> {
    try {
      // Import projects
      const importedProjects: Project[] = [];
      for (const project of data.projects) {
        const newProject = await this.addProject({
          name: project.name,
          description: project.description,
        });
        importedProjects.push(newProject);
      }

      // Map old project IDs to new project IDs
      const projectIdMap = new Map<string | number, number>();
      data.projects.forEach((oldProject, index) => {
        if (importedProjects[index]) {
          projectIdMap.set(oldProject.id, importedProjects[index].id);
        }
      });

      // Import items with mapped project IDs
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
      console.error('[GraphQLStorageManager] Error importing data:', error);
      throw error;
    }
  }
}
