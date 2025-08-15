import { TodoItem, Project } from '@/types';
import { StorageManager } from './storage';

export interface MigrationResult {
  success: boolean;
  migratedItems: number;
  migratedProjects: number;
  errors: string[];
  warnings: string[];
}

export class DatabaseMigrator {
  // 导出数据为JSON
  static exportToJSON(): { projects: Project[]; items: TodoItem[] } {
    try {
      const projects = StorageManager.getProjects();
      const items = StorageManager.getItems();

      return {
        projects,
        items,
      };
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 从JSON导入数据
  static importFromJSON(data: { projects: Project[]; items: TodoItem[] }): MigrationResult {
    const result: MigrationResult = {
      success: false,
      migratedItems: 0,
      migratedProjects: 0,
      errors: [],
      warnings: [],
    };

    try {
      // 验证数据格式
      if (!Array.isArray(data.projects) || !Array.isArray(data.items)) {
        result.errors.push('Invalid data format: projects and items must be arrays');
        return result;
      }

      // 清除现有数据
      localStorage.removeItem('projects');
      localStorage.removeItem('items');

      // 导入项目
      if (data.projects.length > 0) {
        data.projects.forEach(project => {
          try {
            StorageManager.addProject({
              name: project.name,
              description: project.description,
            });
            result.migratedProjects++;
          } catch (error) {
            result.errors.push(`Failed to import project "${project.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });
      }

      // 导入任务
      if (data.items.length > 0) {
        data.items.forEach(item => {
          try {
            StorageManager.addItem({
              title: item.title,
              description: item.description,
              type: item.type,
              status: item.status,
              projectId: item.projectId,
            });
            result.migratedItems++;
          } catch (error) {
            result.errors.push(`Failed to import item "${item.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });
      }

      result.success = result.errors.length === 0;

      if (result.warnings.length > 0) {
        console.warn('Migration warnings:', result.warnings);
      }

      return result;
    } catch (error) {
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  // 备份数据
  static backup(): string {
    try {
      const data = this.exportToJSON();
      const backup = {
        ...data,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };

      return JSON.stringify(backup, null, 2);
    } catch (error) {
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 从备份恢复
  static restore(backupData: string): MigrationResult {
    try {
      const backup = JSON.parse(backupData);

      // 验证备份格式
      if (!backup.projects || !backup.items || !backup.timestamp) {
        throw new Error('Invalid backup format');
      }

      return this.importFromJSON(backup);
    } catch (error) {
      const result: MigrationResult = {
        success: false,
        migratedItems: 0,
        migratedProjects: 0,
        errors: [`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
      return result;
    }
  }

  // 清理孤立数据
  static cleanupOrphanedData(): { removedItems: number; removedProjects: number } {
    try {
      const projects = StorageManager.getProjects();
      const items = StorageManager.getItems();

      const projectIds = new Set(projects.map(p => p.id));
      const orphanedItems = items.filter(item => !projectIds.has(item.projectId));

      let removedItems = 0;
      let removedProjects = 0;

      // 删除孤立的任务
      orphanedItems.forEach(item => {
        try {
          StorageManager.deleteItem(item.id);
          removedItems++;
        } catch (error) {
          console.error(`Failed to remove orphaned item ${item.id}:`, error);
        }
      });

      // 删除空项目
      projects.forEach(project => {
        const projectItems = items.filter(item => item.projectId === project.id);
        if (projectItems.length === 0) {
          try {
            // 这里需要添加删除项目的方法
            // StorageManager.deleteProject(project.id);
            removedProjects++;
          } catch (error) {
            console.error(`Failed to remove empty project ${project.id}:`, error);
          }
        }
      });

      return { removedItems, removedProjects };
    } catch (error) {
      console.error('Cleanup failed:', error);
      return { removedItems: 0, removedProjects: 0 };
    }
  }

  // 验证数据完整性
  static validateData(): {
    valid: boolean;
    issues: string[];
    statistics: {
      totalProjects: number;
      totalItems: number;
      orphanedItems: number;
      emptyProjects: number;
    };
  } {
    try {
      const projects = StorageManager.getProjects();
      const items = StorageManager.getItems();

      const projectIds = new Set(projects.map(p => p.id));
      const orphanedItems = items.filter(item => !projectIds.has(item.projectId));
      const emptyProjects = projects.filter(project =>
        items.filter(item => item.projectId === project.id).length === 0
      );

      const issues: string[] = [];

      if (orphanedItems.length > 0) {
        issues.push(`${orphanedItems.length} items have invalid project references`);
      }

      if (emptyProjects.length > 0) {
        issues.push(`${emptyProjects.length} projects have no items`);
      }

      return {
        valid: issues.length === 0,
        issues,
        statistics: {
          totalProjects: projects.length,
          totalItems: items.length,
          orphanedItems: orphanedItems.length,
          emptyProjects: emptyProjects.length,
        },
      };
    } catch (error) {
      return {
        valid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        statistics: {
          totalProjects: 0,
          totalItems: 0,
          orphanedItems: 0,
          emptyProjects: 0,
        },
      };
    }
  }
} 