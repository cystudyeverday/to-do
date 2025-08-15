export interface DatabaseInfo {
  type: 'localStorage' | 'indexedDB' | 'sqlite' | 'mysql' | 'postgresql' | 'mongodb' | 'unknown';
  available: boolean;
  version?: string;
  size?: number;
  lastModified?: Date;
  error?: string;
}

export interface DatabaseConnection {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
}

export class DatabaseDetector {
  // 检测本地存储
  static async detectLocalStorage(): Promise<DatabaseInfo> {
    try {
      const testKey = '__db_test__';
      const testValue = 'test';

      // 测试localStorage是否可用
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved !== testValue) {
        throw new Error('localStorage read/write test failed');
      }

      // 计算localStorage使用情况
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalSize += localStorage.getItem(key)?.length || 0;
        }
      }

      return {
        type: 'localStorage',
        available: true,
        size: totalSize,
        lastModified: new Date(),
      };
    } catch (error) {
      return {
        type: 'localStorage',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 检测IndexedDB
  static async detectIndexedDB(): Promise<DatabaseInfo> {
    try {
      if (!window.indexedDB) {
        throw new Error('IndexedDB not supported');
      }

      // 测试IndexedDB连接
      const dbName = '__db_test__';
      const request = indexedDB.open(dbName, 1);

      return new Promise((resolve) => {
        request.onerror = () => {
          resolve({
            type: 'indexedDB',
            available: false,
            error: 'Failed to open IndexedDB',
          });
        };

        request.onsuccess = () => {
          const db = request.result;
          db.close();

          // 删除测试数据库
          indexedDB.deleteDatabase(dbName);

          resolve({
            type: 'indexedDB',
            available: true,
            lastModified: new Date(),
          });
        };

        request.onupgradeneeded = () => {
          const db = request.result;
          db.createObjectStore('test');
        };
      });
    } catch (error) {
      return {
        type: 'indexedDB',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 检测SQLite（通过WebAssembly或其他方式）
  static async detectSQLite(): Promise<DatabaseInfo> {
    try {
      // 这里可以检测SQLite的WebAssembly版本或其他实现
      // 目前返回不可用状态
      return {
        type: 'sqlite',
        available: false,
        error: 'SQLite not implemented in browser environment',
      };
    } catch (error) {
      return {
        type: 'sqlite',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 检测远程数据库连接
  static async detectRemoteDatabase(connection: DatabaseConnection): Promise<DatabaseInfo> {
    try {
      // 这里可以实现实际的数据库连接测试
      // 目前返回模拟结果
      return {
        type: 'unknown',
        available: false,
        error: 'Remote database detection not implemented',
      };
    } catch (error) {
      return {
        type: 'unknown',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 检测所有可用的数据库
  static async detectAllDatabases(): Promise<DatabaseInfo[]> {
    const results: DatabaseInfo[] = [];

    // 检测本地存储
    results.push(await this.detectLocalStorage());

    // 检测IndexedDB
    results.push(await this.detectIndexedDB());

    // 检测SQLite
    results.push(await this.detectSQLite());

    return results;
  }

  // 获取推荐的数据库
  static async getRecommendedDatabase(): Promise<DatabaseInfo | null> {
    const databases = await this.detectAllDatabases();

    // 按优先级排序：IndexedDB > localStorage > 其他
    const priority = ['indexedDB', 'localStorage', 'sqlite'];

    for (const dbType of priority) {
      const db = databases.find(d => d.type === dbType && d.available);
      if (db) {
        return db;
      }
    }

    return null;
  }

  // 检查数据完整性
  static async checkDataIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 检查localStorage中的数据
      const projects = localStorage.getItem('projects');
      const items = localStorage.getItem('items');

      if (!projects && !items) {
        issues.push('No data found in localStorage');
        recommendations.push('Consider importing sample data or creating new projects');
      } else {
        // 验证数据格式
        try {
          if (projects) JSON.parse(projects);
          if (items) JSON.parse(items);
        } catch (error) {
          issues.push('Data format is corrupted');
          recommendations.push('Backup current data and reset to default');
        }
      }

      // 检查数据一致性
      if (projects && items) {
        const projectsData = JSON.parse(projects);
        const itemsData = JSON.parse(items);

        // 检查是否有孤立的任务（没有对应项目）
        const projectIds = new Set(projectsData.map((p: any) => p.id));
        const orphanedItems = itemsData.filter((item: any) => !projectIds.has(item.projectId));

        if (orphanedItems.length > 0) {
          issues.push(`${orphanedItems.length} items have invalid project references`);
          recommendations.push('Clean up orphaned items or reassign them to valid projects');
        }
      }

    } catch (error) {
      issues.push('Failed to check data integrity');
      recommendations.push('Check browser console for detailed error information');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }
} 