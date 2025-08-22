import Database from 'better-sqlite3';
import { TodoItem, Project } from '@/types';
import path from 'path';
import fs from 'fs';

// 确保数据目录存在
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'todo.db');

// 定义数据库行类型
interface ProjectRow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemRow {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  projectId: string;
  module: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database;

  private constructor() {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private initDatabase() {
    // 创建项目表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // 创建任务表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        projectId TEXT NOT NULL,
        module TEXT DEFAULT 'Other',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        completedAt TEXT,
        FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);

    // 创建索引以提高查询性能
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_items_project_id ON items (projectId);
      CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
      CREATE INDEX IF NOT EXISTS idx_items_type ON items (type);
      CREATE INDEX IF NOT EXISTS idx_items_module ON items (module);
    `);
  }

  // 项目相关操作
  getProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY createdAt DESC');
    const rows = stmt.all() as ProjectRow[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  getProjectById(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as ProjectRow | undefined;
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const id = this.generateUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, project.name, project.description, now, now);

    return {
      id,
      name: project.name,
      description: project.description,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const project = this.getProjectById(id);
    if (!project) return null;

    const updatedProject = { ...project, ...updates, updatedAt: new Date() };

    const stmt = this.db.prepare(`
      UPDATE projects 
      SET name = ?, description = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedProject.name,
      updatedProject.description,
      updatedProject.updatedAt.toISOString(),
      id
    );

    return updatedProject;
  }

  deleteProject(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 任务相关操作
  getItems(): TodoItem[] {
    const stmt = this.db.prepare('SELECT * FROM items ORDER BY createdAt DESC');
    const rows = stmt.all() as ItemRow[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type as 'Feature' | 'Issue',
      status: row.status as 'Not start' | 'On progress' | 'Build UI' | 'Integration' | 'Waiting for API' | 'Completed' | 'Fix',
      projectId: row.projectId,
      module: row.module,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    }));
  }

  getItemsByProject(projectId: string): TodoItem[] {
    const stmt = this.db.prepare('SELECT * FROM items WHERE projectId = ? ORDER BY createdAt DESC');
    const rows = stmt.all(projectId) as ItemRow[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type as 'Feature' | 'Issue',
      status: row.status as 'Not start' | 'On progress' | 'Build UI' | 'Integration' | 'Waiting for API' | 'Completed' | 'Fix',
      projectId: row.projectId,
      module: row.module,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    }));
  }

  getItemById(id: string): TodoItem | null {
    const stmt = this.db.prepare('SELECT * FROM items WHERE id = ?');
    const row = stmt.get(id) as ItemRow | undefined;
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type as 'Feature' | 'Issue',
      status: row.status as 'Not start' | 'On progress' | 'Build UI' | 'Integration' | 'Waiting for API' | 'Completed' | 'Fix',
      projectId: row.projectId,
      module: row.module,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    };
  }

  addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): TodoItem {
    const id = this.generateUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO items (id, title, description, type, status, projectId, module, createdAt, updatedAt, completedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      item.title,
      item.description,
      item.type,
      item.status,
      item.projectId,
      item.module || 'Other',
      now,
      now,
      item.completedAt?.toISOString() || null
    );

    return {
      id,
      title: item.title,
      description: item.description,
      type: item.type,
      status: item.status,
      projectId: item.projectId,
      module: item.module || 'Other',
      createdAt: new Date(now),
      updatedAt: new Date(now),
      completedAt: item.completedAt,
    };
  }

  updateItem(id: string, updates: Partial<TodoItem>): TodoItem | null {
    const item = this.getItemById(id);
    if (!item) return null;

    const updatedItem = { ...item, ...updates, updatedAt: new Date() };

    const stmt = this.db.prepare(`
      UPDATE items 
      SET title = ?, description = ?, type = ?, status = ?, projectId = ?, module = ?, updatedAt = ?, completedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedItem.title,
      updatedItem.description,
      updatedItem.type,
      updatedItem.status,
      updatedItem.projectId,
      updatedItem.module || 'Other',
      updatedItem.updatedAt.toISOString(),
      updatedItem.completedAt?.toISOString() || null,
      id
    );

    return updatedItem;
  }

  deleteItem(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM items WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 批量操作
  addItems(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): TodoItem[] {
    const transaction = this.db.transaction(() => {
      return items.map(item => this.addItem(item));
    });

    return transaction();
  }

  // 统计查询
  getStatistics() {
    const totalItems = this.db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
    const completedItems = this.db.prepare('SELECT COUNT(*) as count FROM items WHERE status = "Completed"').get() as { count: number };
    const inProgressItems = this.db.prepare('SELECT COUNT(*) as count FROM items WHERE status = "On progress"').get() as { count: number };
    const pendingItems = this.db.prepare('SELECT COUNT(*) as count FROM items WHERE status = "Not start"').get() as { count: number };
    const totalProjects = this.db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };

    return {
      totalItems: totalItems.count,
      completedItems: completedItems.count,
      inProgressItems: inProgressItems.count,
      pendingItems: pendingItems.count,
      totalProjects: totalProjects.count,
    };
  }

  // 数据迁移（从 localStorage 到数据库）
  async migrateFromLocalStorage(localStorageData: { projects: Record<string, unknown>[], items: Record<string, unknown>[] }) {
    const transaction = this.db.transaction(() => {
      // 清空现有数据
      this.db.prepare('DELETE FROM items').run();
      this.db.prepare('DELETE FROM projects').run();

      // 迁移项目
      const migratedProjects = localStorageData.projects.map(project => {
        return this.addProject({
          name: project.name as string,
          description: project.description as string,
        });
      });

      // 迁移任务
      const migratedItems = localStorageData.items.map(item => {
        return this.addItem({
          title: item.title as string,
          description: item.description as string,
          type: item.type as 'Feature' | 'Issue',
          status: item.status as 'Not start' | 'On progress' | 'Build UI' | 'Integration' | 'Waiting for API' | 'Completed' | 'Fix',
          projectId: item.projectId as string,
          module: (item.module as string) || 'Other',
          completedAt: item.completedAt ? new Date(item.completedAt as string) : undefined,
        });
      });

      return { projects: migratedProjects, items: migratedItems };
    });

    return transaction();
  }

  // 数据导出
  exportData() {
    const projects = this.getProjects();
    const items = this.getItems();

    return {
      projects,
      items,
      exportTime: new Date().toISOString(),
      version: '1.0.0',
      totalProjects: projects.length,
      totalItems: items.length,
      statistics: this.getStatistics()
    };
  }

  // 数据导入
  importData(data: { projects: Record<string, unknown>[], items: Record<string, unknown>[] }) {
    const transaction = this.db.transaction(() => {
      // 清空现有数据
      this.db.prepare('DELETE FROM items').run();
      this.db.prepare('DELETE FROM projects').run();

      // 导入项目
      const importedProjects = data.projects.map(project => {
        return this.addProject({
          name: project.name as string,
          description: project.description as string,
        });
      });

      // 导入任务
      const importedItems = data.items.map(item => {
        return this.addItem({
          title: item.title as string,
          description: item.description as string,
          type: item.type as 'Feature' | 'Issue',
          status: item.status as 'Not start' | 'On progress' | 'Build UI' | 'Integration' | 'Waiting for API' | 'Completed' | 'Fix',
          projectId: item.projectId as string,
          module: (item.module as string) || 'Other',
          completedAt: item.completedAt ? new Date(item.completedAt as string) : undefined,
        });
      });

      return { projects: importedProjects, items: importedItems };
    });

    return transaction();
  }

  // 工具方法
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // 降级方案：使用时间戳和随机数生成
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 关闭数据库连接
  close() {
    this.db.close();
  }
}

export const dbManager = DatabaseManager.getInstance(); 