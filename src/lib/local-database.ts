import Database from 'better-sqlite3';
import { Project, TodoItem } from '@/types';
import path from 'path';
import fs from 'fs';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'todo.db');

// 确保数据目录存在
const ensureDataDir = () => {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// 数据库行类型定义
interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemRow {
  id: string;
  title: string;
  description: string | null;
  type: 'Feature' | 'Issue';
  status: 'Not start' | 'On progress' | 'Pending' | 'Completed' | 'Archive';
  project_id: string;
  module: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

class LocalDatabaseManager {
  private static instance: LocalDatabaseManager;
  private db: Database.Database | null = null;

  // 映射数据库状态到应用状态
  private mapStatus(dbStatus: string): 'Not start' | 'On progress' | 'Waiting for API' | 'Build UI' | 'Integration' | 'Completed' | 'Fix' {
    switch (dbStatus) {
      case 'Not start':
        return 'Not start';
      case 'On progress':
        return 'On progress';
      case 'Pending':
        return 'Not start'; // Map Pending to Not start
      case 'Completed':
        return 'Completed';
      case 'Archive':
        return 'Completed'; // Map Archive to Completed
      default:
        return 'Not start'; // Default fallback
    }
  }

  private constructor() {
    this.initDatabase();
  }

  public static getInstance(): LocalDatabaseManager {
    if (!LocalDatabaseManager.instance) {
      LocalDatabaseManager.instance = new LocalDatabaseManager();
    }
    return LocalDatabaseManager.instance;
  }

  private initDatabase() {
    try {
      ensureDataDir();
      this.db = new Database(DB_PATH);
      this.createTables();
      console.log('Local database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize local database:', error);
      throw error;
    }
  }

  private createTables() {
    if (!this.db) return;

    // 创建项目表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 创建任务表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('Feature', 'Issue')),
        status TEXT NOT NULL CHECK (status IN ('Not start', 'On progress', 'Pending', 'Completed', 'Archive')),
        project_id TEXT NOT NULL,
        module TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_items_project_id ON items (project_id);
      CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
      CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at);
      CREATE INDEX IF NOT EXISTS idx_items_completed_at ON items (completed_at);
    `);
  }

  // 项目相关操作
  public getProjects(): Project[] {
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
      const rows = stmt.all() as ProjectRow[];

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  public getProjectById(id: string): Project | null {
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
      const row = stmt.get(id) as ProjectRow | undefined;

      if (!row) return null;

      return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      console.error('Error fetching project by id:', error);
      return null;
    }
  }

  public addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const stmt = this.db.prepare(`
        INSERT INTO projects (id, name, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(id, project.name, project.description || null, now, now);

      return {
        id,
        name: project.name,
        description: project.description || '',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  }

  public updateProject(id: string, updates: Partial<Project>): Project | null {
    if (!this.db) return null;

    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        values.push(updates.description || null);
      }

      if (updateFields.length === 0) return this.getProjectById(id);

      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE projects 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);
      return this.getProjectById(id);
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  public deleteProject(id: string): boolean {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // 任务相关操作
  public getItems(): TodoItem[] {
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare('SELECT * FROM items ORDER BY created_at DESC');
      const rows = stmt.all() as ItemRow[];

      return rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        type: row.type,
        status: this.mapStatus(row.status),
        projectId: row.project_id,
        module: row.module || 'Other',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  }

  public getItemsByProject(projectId: string): TodoItem[] {
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare('SELECT * FROM items WHERE project_id = ? ORDER BY created_at DESC');
      const rows = stmt.all(projectId) as ItemRow[];

      return rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        type: row.type,
        status: this.mapStatus(row.status),
        projectId: row.project_id,
        module: row.module || 'Other',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching project items:', error);
      return [];
    }
  }

  public getItemById(id: string): TodoItem | null {
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare('SELECT * FROM items WHERE id = ?');
      const row = stmt.get(id) as ItemRow | undefined;

      if (!row) return null;

      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        type: row.type,
        status: this.mapStatus(row.status),
        projectId: row.project_id,
        module: row.module || 'Other',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      };
    } catch (error) {
      console.error('Error fetching item by id:', error);
      return null;
    }
  }

  public addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): TodoItem {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const stmt = this.db.prepare(`
        INSERT INTO items (id, title, description, type, status, project_id, module, created_at, updated_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        item.title,
        item.description || null,
        item.type,
        item.status,
        item.projectId,
        item.module || null,
        now,
        now,
        item.completedAt?.toISOString() || null
      );

      return {
        id,
        title: item.title,
        description: item.description || '',
        type: item.type,
        status: item.status,
        projectId: item.projectId,
        module: item.module || 'Other',
        createdAt: new Date(now),
        updatedAt: new Date(now),
        completedAt: item.completedAt,
      };
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  }

  public updateItem(id: string, updates: Partial<TodoItem>): TodoItem | null {
    if (!this.db) return null;

    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.title !== undefined) {
        updateFields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        values.push(updates.description || null);
      }
      if (updates.type !== undefined) {
        updateFields.push('type = ?');
        values.push(updates.type);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.projectId !== undefined) {
        updateFields.push('project_id = ?');
        values.push(updates.projectId);
      }
      if (updates.module !== undefined) {
        updateFields.push('module = ?');
        values.push(updates.module || null);
      }
      if (updates.completedAt !== undefined) {
        updateFields.push('completed_at = ?');
        values.push(updates.completedAt?.toISOString() || null);
      }

      if (updateFields.length === 0) return this.getItemById(id);

      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE items 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);
      return this.getItemById(id);
    } catch (error) {
      console.error('Error updating item:', error);
      return null;
    }
  }

  public deleteItem(id: string): boolean {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare('DELETE FROM items WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }

  // 批量操作
  public addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): TodoItem[] {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        INSERT INTO items (id, title, description, type, status, project_id, module, created_at, updated_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = this.db.transaction(() => {
        const addedItems: TodoItem[] = [];

        for (const item of items) {
          const id = crypto.randomUUID();

          stmt.run(
            id,
            item.title,
            item.description || null,
            item.type,
            item.status,
            item.projectId,
            item.module || null,
            now,
            now,
            item.completedAt?.toISOString() || null
          );

          addedItems.push({
            id,
            title: item.title,
            description: item.description || '',
            type: item.type,
            status: item.status,
            projectId: item.projectId,
            module: item.module || 'Other',
            createdAt: new Date(now),
            updatedAt: new Date(now),
            completedAt: item.completedAt,
          });
        }

        return addedItems;
      });

      return transaction();
    } catch (error) {
      console.error('Error adding items:', error);
      throw error;
    }
  }

  // 归档功能
  public archiveCompletedItems(projectId: string): number {
    if (!this.db) return 0;

    try {
      const stmt = this.db.prepare(`
        UPDATE items 
        SET status = 'Archive', updated_at = ?
        WHERE project_id = ? AND status = 'Completed'
      `);

      const result = stmt.run(new Date().toISOString(), projectId);
      return result.changes || 0;
    } catch (error) {
      console.error('Error archiving items:', error);
      return 0;
    }
  }

  // 获取本周完成的任务
  public getWeeklyCompletedItems(): TodoItem[] {
    if (!this.db) return [];

    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const stmt = this.db.prepare(`
        SELECT * FROM items 
        WHERE status = 'Completed' 
        AND completed_at >= ?
        ORDER BY completed_at DESC
      `);

      const rows = stmt.all(oneWeekAgo.toISOString()) as ItemRow[];

      return rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        type: row.type,
        status: this.mapStatus(row.status),
        projectId: row.project_id,
        module: row.module || 'Other',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching weekly completed items:', error);
      return [];
    }
  }

  // 统计功能
  public getStatistics() {
    if (!this.db) {
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

    try {
      // 获取总任务数（不包括归档的）
      const totalItemsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM items WHERE status != 'Archive'
      `);
      const totalItems = (totalItemsStmt.get() as { count: number }).count;

      // 获取已完成任务数
      const completedItemsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM items WHERE status = 'Completed'
      `);
      const completedItems = (completedItemsStmt.get() as { count: number }).count;

      // 获取进行中任务数
      const inProgressItemsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM items WHERE status = 'On progress'
      `);
      const inProgressItems = (inProgressItemsStmt.get() as { count: number }).count;

      // 获取待处理任务数
      const pendingItemsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM items WHERE status = 'Pending'
      `);
      const pendingItems = (pendingItemsStmt.get() as { count: number }).count;

      // 获取未开始任务数
      const notStartedItemsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM items WHERE status = 'Not start'
      `);
      const notStartedItems = (notStartedItemsStmt.get() as { count: number }).count;

      // 获取归档任务数
      const archivedItemsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM items WHERE status = 'Archive'
      `);
      const archivedItems = (archivedItemsStmt.get() as { count: number }).count;

      // 获取项目总数
      const totalProjectsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM projects
      `);
      const totalProjects = (totalProjectsStmt.get() as { count: number }).count;

      return {
        totalItems,
        completedItems,
        inProgressItems,
        pendingItems,
        notStartedItems,
        archivedItems,
        totalProjects,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
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

  // 数据迁移（从localStorage到本地数据库）
  public migrateFromLocalStorage(localStorageData: { projects: any[], items: any[] }) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const transaction = this.db.transaction(() => {
        // 清空现有数据
        this.db!.exec('DELETE FROM items');
        this.db!.exec('DELETE FROM projects');

        // 迁移项目
        const migratedProjects: Project[] = [];
        for (const project of localStorageData.projects) {
          const newProject = this.addProject({
            name: project.name,
            description: project.description,
          });
          migratedProjects.push(newProject);
        }

        // 迁移任务
        const migratedItems: TodoItem[] = [];
        for (const item of localStorageData.items) {
          const newItem = this.addItem({
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
      });

      return transaction();
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      throw error;
    }
  }

  // 数据导出
  public exportData() {
    try {
      const projects = this.getProjects();
      const items = this.getItems();
      const statistics = this.getStatistics();

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

  // 数据导入
  public importData(data: { projects: any[], items: any[] }) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const transaction = this.db.transaction(() => {
        // 清空现有数据
        this.db!.exec('DELETE FROM items');
        this.db!.exec('DELETE FROM projects');

        // 导入项目
        const importedProjects: Project[] = [];
        for (const project of data.projects) {
          const newProject = this.addProject({
            name: project.name,
            description: project.description,
          });
          importedProjects.push(newProject);
        }

        // 导入任务
        const importedItems: TodoItem[] = [];
        for (const item of data.items) {
          const newItem = this.addItem({
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
      });

      return transaction();
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // 获取数据库文件路径
  public getDatabasePath(): string {
    return DB_PATH;
  }

  // 备份数据库
  public backupDatabase(backupPath: string): boolean {
    if (!this.db) return false;

    try {
      this.db.backup(backupPath);
      return true;
    } catch (error) {
      console.error('Error backing up database:', error);
      return false;
    }
  }

  // 关闭数据库连接
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const localDatabaseManager = LocalDatabaseManager.getInstance();
