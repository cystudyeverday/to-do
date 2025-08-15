import { TodoItem, Project } from '@/types';

const STORAGE_KEYS = {
  PROJECTS: 'todo_projects',
  ITEMS: 'todo_items',
} as const;

// 兼容的 UUID 生成函数
function generateUUID(): string {
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

export class StorageManager {
  static getProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!data) return [];
    return JSON.parse(data).map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  }

  static saveProjects(projects: Project[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  static getItems(): TodoItem[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!data) return [];
    return JSON.parse(data).map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
    }));
  }

  static saveItems(items: TodoItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }

  static addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      ...project,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    projects.push(newProject);
    this.saveProjects(projects);
    return newProject;
  }

  static addItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): TodoItem {
    const items = this.getItems();
    const newItem: TodoItem = {
      ...item,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    items.push(newItem);
    this.saveItems(items);
    return newItem;
  }

  static updateItem(id: string, updates: Partial<TodoItem>): TodoItem | null {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveItems(items);
    return items[index];
  }

  static deleteItem(id: string): boolean {
    const items = this.getItems();
    const filteredItems = items.filter(item => item.id !== id);
    if (filteredItems.length === items.length) return false;
    this.saveItems(filteredItems);
    return true;
  }

  static deleteProject(id: string): boolean {
    const projects = this.getProjects();
    const items = this.getItems();

    const filteredProjects = projects.filter(project => project.id !== id);
    const filteredItems = items.filter(item => item.projectId !== id);

    if (filteredProjects.length === projects.length) return false;

    this.saveProjects(filteredProjects);
    this.saveItems(filteredItems);
    return true;
  }
} 