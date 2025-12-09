# 业务逻辑层（Service Layer）指南

如何在项目中组织和实现业务逻辑。

## 目录
1. [什么是业务逻辑](#什么是业务逻辑)
2. [架构层次](#架构层次)
3. [Service层的职责](#service层的职责)
4. [实现示例](#实现示例)
5. [最佳实践](#最佳实践)

---

## 什么是业务逻辑

### 数据访问 vs 业务逻辑

❌ **不是业务逻辑（数据访问）:**
```typescript
// 简单的CRUD操作
ProjectRepository.getAll()
ItemRepository.create(item)
```

✅ **是业务逻辑:**
```typescript
// 复杂的业务规则
- 创建项目时自动创建默认任务
- 完成所有任务时自动归档项目
- 根据优先级和依赖关系调度任务
- 计算项目完成度和预计完成时间
- 发送通知、生成报告
```

### 业务逻辑的特征

1. **包含业务规则** - "当X发生时，做Y"
2. **跨多个实体** - 涉及多个表/模型的操作
3. **需要验证** - 检查业务约束
4. **可能失败** - 需要错误处理和事务
5. **需要测试** - 单独的业务逻辑测试

---

## 架构层次

### 当前架构（3层）

```
Components（组件层）
    ↓
Storage Manager（存储管理层）
    ↓
Repositories（数据访问层）
    ↓
GraphQL / Database
```

**问题：** 业务逻辑分散在Components和Storage Manager中

### 推荐架构（4层）

```
Components（组件层）
    ↓ 只负责UI交互
    
Services（业务逻辑层）← 新增！
    ↓ 实现业务规则
    
Repositories（数据访问层）
    ↓ 只负责CRUD
    
GraphQL / Database
```

---

## Service层的职责

### Services 应该做什么

✅ **应该：**
1. **实现业务规则** - 复杂的业务逻辑
2. **编排操作** - 协调多个repository
3. **数据验证** - 业务级别的验证
4. **事务管理** - 确保数据一致性
5. **错误处理** - 业务级别的错误
6. **计算和转换** - 业务相关的计算

❌ **不应该：**
1. **直接访问数据库** - 使用repository
2. **UI逻辑** - 由components处理
3. **简单的CRUD** - 直接用repository

### 职责划分

```typescript
// ❌ 不好 - 业务逻辑在Component中
function Component() {
  const handleComplete = async (itemId: number) => {
    const item = await ItemRepository.getById(itemId);
    await ItemRepository.update(itemId, { 
      status: 'Completed',
      completedAt: new Date()
    });
    
    // 检查是否所有任务都完成了
    const allItems = await ItemRepository.getByProject(item.projectId);
    const allCompleted = allItems.every(i => i.status === 'Completed');
    
    if (allCompleted) {
      // 自动归档项目
      await ProjectRepository.update(item.projectId, { 
        status: 'Archived' 
      });
      // 发送通知
      await sendNotification('Project completed!');
    }
  }
}

// ✅ 好 - 业务逻辑在Service中
function Component() {
  const handleComplete = async (itemId: number) => {
    await ItemService.completeItem(itemId);
  }
}
```

---

## 实现示例

### 1. 创建Service目录结构

```
src/lib/
├── services/
│   ├── index.ts
│   ├── project.service.ts
│   ├── item.service.ts
│   └── statistics.service.ts
```

### 2. 基础Service示例

#### `src/lib/services/project.service.ts`

```typescript
import { Project } from '@/types';
import { ProjectRepository, ItemRepository } from '@/lib/repositories';

/**
 * 项目业务逻辑服务
 */
export class ProjectService {
  /**
   * 创建项目并初始化默认任务
   */
  static async createProjectWithDefaults(
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    createDefaultTasks: boolean = true
  ): Promise<Project> {
    // 1. 创建项目
    const project = await ProjectRepository.create(projectData);
    
    // 2. 如果需要，创建默认任务
    if (createDefaultTasks) {
      const defaultTasks = [
        {
          title: '项目规划',
          description: '定义项目目标和范围',
          type: 'Feature' as const,
          status: 'Not start' as const,
          projectId: project.id,
          module: 'Planning'
        },
        {
          title: '需求分析',
          description: '收集和分析需求',
          type: 'Feature' as const,
          status: 'Not start' as const,
          projectId: project.id,
          module: 'Planning'
        }
      ];
      
      await ItemRepository.createBatch(defaultTasks);
    }
    
    return project;
  }
  
  /**
   * 归档项目（只有当所有任务完成时）
   */
  static async archiveProject(projectId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    // 1. 获取项目的所有任务
    const items = await ItemRepository.getByProject(projectId);
    
    // 2. 业务规则：检查是否所有任务都已完成
    const hasUncompletedItems = items.some(
      item => item.status !== 'Completed' && item.status !== 'Archive'
    );
    
    if (hasUncompletedItems) {
      return {
        success: false,
        message: '只有当所有任务都完成时才能归档项目'
      };
    }
    
    // 3. 归档所有任务
    for (const item of items) {
      await ItemRepository.update(item.id, { status: 'Archive' });
    }
    
    // 4. 更新项目状态（如果有status字段）
    // await ProjectRepository.update(projectId, { status: 'Archived' });
    
    return {
      success: true,
      message: '项目已成功归档'
    };
  }
  
  /**
   * 删除项目（级联删除所有任务）
   */
  static async deleteProjectCascade(projectId: number): Promise<void> {
    // 1. 获取所有任务
    const items = await ItemRepository.getByProject(projectId);
    
    // 2. 删除所有任务
    for (const item of items) {
      await ItemRepository.delete(item.id);
    }
    
    // 3. 删除项目
    await ProjectRepository.delete(projectId);
  }
  
  /**
   * 获取项目统计信息
   */
  static async getProjectStats(projectId: number) {
    const items = await ItemRepository.getByProject(projectId);
    
    const stats = {
      total: items.length,
      completed: items.filter(i => i.status === 'Completed').length,
      inProgress: items.filter(i => i.status === 'On progress').length,
      notStarted: items.filter(i => i.status === 'Not start').length,
      completionRate: 0,
      estimatedCompletion: null as Date | null
    };
    
    // 计算完成率
    if (stats.total > 0) {
      stats.completionRate = (stats.completed / stats.total) * 100;
    }
    
    // 估算完成时间（简单示例）
    if (stats.completed > 0 && stats.total > stats.completed) {
      const completedItems = items.filter(i => i.status === 'Completed');
      const avgCompletionTime = this.calculateAverageCompletionTime(completedItems);
      const remainingItems = stats.total - stats.completed;
      
      stats.estimatedCompletion = new Date(
        Date.now() + (avgCompletionTime * remainingItems)
      );
    }
    
    return stats;
  }
  
  /**
   * 计算平均完成时间（私有辅助方法）
   */
  private static calculateAverageCompletionTime(items: any[]): number {
    const times = items
      .filter(i => i.completedAt && i.createdAt)
      .map(i => i.completedAt.getTime() - i.createdAt.getTime());
    
    if (times.length === 0) return 0;
    
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}
```

#### `src/lib/services/item.service.ts`

```typescript
import { TodoItem } from '@/types';
import { ItemRepository, ProjectRepository } from '@/lib/repositories';

/**
 * 任务业务逻辑服务
 */
export class ItemService {
  /**
   * 完成任务（自动设置完成时间，检查项目状态）
   */
  static async completeItem(itemId: number): Promise<{
    item: TodoItem;
    projectCompleted: boolean;
  }> {
    // 1. 获取任务
    const item = await ItemRepository.getById(itemId);
    if (!item) {
      throw new Error('任务不存在');
    }
    
    // 2. 更新任务状态和完成时间
    const updatedItem = await ItemRepository.update(itemId, {
      status: 'Completed',
      completedAt: new Date()
    });
    
    if (!updatedItem) {
      throw new Error('更新任务失败');
    }
    
    // 3. 检查项目中的所有任务是否都已完成
    const projectItems = await ItemRepository.getByProject(item.projectId);
    const allCompleted = projectItems.every(
      i => i.status === 'Completed' || i.status === 'Archive'
    );
    
    return {
      item: updatedItem,
      projectCompleted: allCompleted
    };
  }
  
  /**
   * 创建任务（带验证）
   */
  static async createItem(
    itemData: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TodoItem> {
    // 1. 业务验证
    this.validateItemData(itemData);
    
    // 2. 检查项目是否存在
    const project = await ProjectRepository.getById(itemData.projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    
    // 3. 业务规则：如果没有指定模块，自动分类
    if (!itemData.module || itemData.module === 'Other') {
      itemData.module = this.autoClassifyModule(itemData.title);
    }
    
    // 4. 创建任务
    return ItemRepository.create(itemData);
  }
  
  /**
   * 批量更新任务状态
   */
  static async batchUpdateStatus(
    itemIds: number[],
    status: TodoItem['status']
  ): Promise<TodoItem[]> {
    const updatedItems: TodoItem[] = [];
    
    for (const id of itemIds) {
      const updates: Partial<TodoItem> = { status };
      
      // 业务规则：如果状态是已完成，设置完成时间
      if (status === 'Completed') {
        updates.completedAt = new Date();
      }
      
      const updated = await ItemRepository.update(id, updates);
      if (updated) {
        updatedItems.push(updated);
      }
    }
    
    return updatedItems;
  }
  
  /**
   * 获取逾期任务
   */
  static async getOverdueItems(): Promise<TodoItem[]> {
    const allItems = await ItemRepository.getAll();
    const now = new Date();
    
    // 业务逻辑：根据创建时间判断是否逾期（示例）
    return allItems.filter(item => {
      if (item.status === 'Completed' || item.status === 'Archive') {
        return false;
      }
      
      // 如果超过7天未完成，视为逾期
      const daysSinceCreation = 
        (now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      return daysSinceCreation > 7;
    });
  }
  
  /**
   * 验证任务数据
   */
  private static validateItemData(
    itemData: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>
  ): void {
    if (!itemData.title || itemData.title.trim().length === 0) {
      throw new Error('任务标题不能为空');
    }
    
    if (itemData.title.length > 200) {
      throw new Error('任务标题不能超过200个字符');
    }
    
    const validStatuses = ['Not start', 'On progress', 'Pending', 'Completed', 'Archive'];
    if (!validStatuses.includes(itemData.status)) {
      throw new Error('无效的任务状态');
    }
  }
  
  /**
   * 自动分类模块
   */
  private static autoClassifyModule(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    const moduleKeywords: Record<string, string[]> = {
      'Frontend': ['ui', 'ux', '界面', '前端', '页面'],
      'Backend': ['api', 'backend', '后端', '接口', '服务'],
      'Database': ['database', 'db', '数据库', 'sql'],
      'DevOps': ['deploy', 'ci', 'cd', '部署', '运维'],
      'Testing': ['test', 'testing', '测试', 'bug'],
    };
    
    for (const [module, keywords] of Object.entries(moduleKeywords)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        return module;
      }
    }
    
    return 'Other';
  }
}
```

#### `src/lib/services/statistics.service.ts`

```typescript
import { ItemRepository, ProjectRepository } from '@/lib/repositories';

/**
 * 统计业务逻辑服务
 */
export class StatisticsService {
  /**
   * 获取仪表盘统计数据
   */
  static async getDashboardStats() {
    const [projects, items] = await Promise.all([
      ProjectRepository.getAll(),
      ItemRepository.getAll()
    ]);
    
    // 计算各种统计指标
    const stats = {
      // 项目统计
      totalProjects: projects.length,
      activeProjects: this.countActiveProjects(projects, items),
      
      // 任务统计
      totalItems: items.length,
      completedItems: items.filter(i => i.status === 'Completed').length,
      inProgressItems: items.filter(i => i.status === 'On progress').length,
      notStartedItems: items.filter(i => i.status === 'Not start').length,
      
      // 本周统计
      weeklyStats: this.getWeeklyStats(items),
      
      // 效率指标
      completionRate: this.calculateCompletionRate(items),
      averageCompletionTime: this.calculateAverageCompletionTime(items),
      
      // 项目效率
      projectEfficiency: this.calculateProjectEfficiency(projects, items),
      
      // 类型分布
      typeDistribution: this.calculateTypeDistribution(items),
      
      // 每日完成统计（最近7天）
      dailyCompletions: this.getDailyCompletions(items, 7)
    };
    
    return stats;
  }
  
  /**
   * 计算活跃项目数
   */
  private static countActiveProjects(projects: any[], items: any[]): number {
    return projects.filter(project => {
      const projectItems = items.filter(i => i.projectId === project.id);
      const hasActiveItems = projectItems.some(
        i => i.status !== 'Completed' && i.status !== 'Archive'
      );
      return hasActiveItems;
    }).length;
  }
  
  /**
   * 获取本周统计
   */
  private static getWeeklyStats(items: any[]) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyItems = items.filter(i => i.createdAt >= oneWeekAgo);
    const weeklyCompleted = items.filter(
      i => i.completedAt && i.completedAt >= oneWeekAgo
    );
    
    return {
      newItems: weeklyItems.length,
      completedItems: weeklyCompleted.length
    };
  }
  
  /**
   * 计算完成率
   */
  private static calculateCompletionRate(items: any[]): number {
    if (items.length === 0) return 0;
    const completed = items.filter(i => i.status === 'Completed').length;
    return Math.round((completed / items.length) * 100);
  }
  
  /**
   * 计算平均完成时间（小时）
   */
  private static calculateAverageCompletionTime(items: any[]): number {
    const completedItems = items.filter(
      i => i.status === 'Completed' && i.completedAt
    );
    
    if (completedItems.length === 0) return 0;
    
    const totalTime = completedItems.reduce((sum, item) => {
      const time = item.completedAt.getTime() - item.createdAt.getTime();
      return sum + time;
    }, 0);
    
    // 转换为小时
    return Math.round(totalTime / completedItems.length / (1000 * 60 * 60));
  }
  
  /**
   * 计算项目效率
   */
  private static calculateProjectEfficiency(projects: any[], items: any[]) {
    return projects.map(project => {
      const projectItems = items.filter(i => i.projectId === project.id);
      const completed = projectItems.filter(i => i.status === 'Completed').length;
      
      return {
        projectId: project.id,
        projectName: project.name,
        totalItems: projectItems.length,
        completedItems: completed,
        completionRate: projectItems.length > 0 
          ? Math.round((completed / projectItems.length) * 100)
          : 0
      };
    });
  }
  
  /**
   * 计算类型分布
   */
  private static calculateTypeDistribution(items: any[]) {
    const distribution = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / items.length) * 100)
    }));
  }
  
  /**
   * 获取每日完成统计
   */
  private static getDailyCompletions(items: any[], days: number) {
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayItems = items.filter(item => {
        if (!item.completedAt) return false;
        return item.completedAt >= date && item.completedAt < nextDate;
      });
      
      result.push({
        date: date.toISOString().split('T')[0],
        completedItems: dayItems.length,
        features: dayItems.filter(i => i.type === 'Feature').length,
        issues: dayItems.filter(i => i.type === 'Issue').length
      });
    }
    
    return result;
  }
}
```

#### `src/lib/services/index.ts`

```typescript
/**
 * Service层导出
 */

export { ProjectService } from './project.service';
export { ItemService } from './item.service';
export { StatisticsService } from './statistics.service';
```

### 3. 更新Storage Manager使用Services

```typescript
// src/lib/graphql-storage.ts
import { ProjectService, ItemService, StatisticsService } from './services';

export class GraphQLStorageManager {
  // 简单的CRUD操作仍然直接用Repository
  static async getProjects(): Promise<Project[]> {
    return ProjectRepository.getAll();
  }
  
  // 复杂的业务操作使用Service
  static async createProjectWithDefaults(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    createDefaultTasks: boolean = true
  ): Promise<Project> {
    return ProjectService.createProjectWithDefaults(project, createDefaultTasks);
  }
  
  static async archiveProject(projectId: number) {
    return ProjectService.archiveProject(projectId);
  }
  
  static async completeItem(itemId: number) {
    return ItemService.completeItem(itemId);
  }
  
  static async getDashboardStats() {
    return StatisticsService.getDashboardStats();
  }
}
```

### 4. 在组件中使用

```typescript
// components/project-form.tsx
import { StorageManager } from '@/lib/storage';

export function ProjectForm() {
  const handleSubmit = async (data: FormData) => {
    try {
      // 使用业务逻辑服务
      const project = await StorageManager.createProjectWithDefaults({
        name: data.name,
        description: data.description
      }, true); // 自动创建默认任务
      
      toast.success('项目创建成功，已添加默认任务！');
    } catch (error) {
      toast.error('创建失败：' + error.message);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## 最佳实践

### 1. 单一职责原则

每个Service只负责一个领域：

```typescript
// ✅ 好
ProjectService.createProject()
ProjectService.archiveProject()

ItemService.completeItem()
ItemService.batchUpdate()

// ❌ 不好
ProjectService.completeItem()  // 这应该在ItemService中
```

### 2. 使用依赖注入（可选）

```typescript
export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private itemRepo: ItemRepository
  ) {}
  
  async createProject(...) {
    // 使用this.projectRepo而不是静态导入
  }
}

// 这样更容易测试和mock
```

### 3. 错误处理

```typescript
export class ItemService {
  static async completeItem(itemId: number) {
    try {
      // 业务逻辑
    } catch (error) {
      // 包装错误，添加业务上下文
      throw new BusinessError(
        '完成任务失败',
        'COMPLETE_ITEM_FAILED',
        { itemId, originalError: error }
      );
    }
  }
}
```

### 4. 事务支持（使用Hasura）

```typescript
// 复杂的多步骤操作应该在一个事务中
static async moveItemToProject(
  itemId: number,
  targetProjectId: number
): Promise<void> {
  // Hasura支持在mutation中使用事务
  // 所有操作要么全部成功，要么全部失败
  try {
    await ItemRepository.update(itemId, { projectId: targetProjectId });
    // 更多操作...
  } catch (error) {
    // 自动回滚
    throw error;
  }
}
```

### 5. 日志记录

```typescript
export class ProjectService {
  static async createProject(data: any) {
    console.log('[ProjectService] Creating project:', data);
    
    try {
      const result = await ProjectRepository.create(data);
      console.log('[ProjectService] Project created:', result.id);
      return result;
    } catch (error) {
      console.error('[ProjectService] Failed to create project:', error);
      throw error;
    }
  }
}
```

### 6. 缓存策略

```typescript
export class StatisticsService {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5分钟
  
  static async getDashboardStats() {
    const cacheKey = 'dashboard-stats';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    const data = await this.calculateStats();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }
}
```

---

## 完整示例：任务依赖系统

更复杂的业务逻辑示例：

```typescript
// src/lib/services/task-dependency.service.ts
export class TaskDependencyService {
  /**
   * 添加任务依赖关系
   */
  static async addDependency(
    itemId: number,
    dependsOnItemId: number
  ): Promise<void> {
    // 1. 验证两个任务都存在
    const [item, dependsOn] = await Promise.all([
      ItemRepository.getById(itemId),
      ItemRepository.getById(dependsOnItemId)
    ]);
    
    if (!item || !dependsOn) {
      throw new Error('任务不存在');
    }
    
    // 2. 业务规则：不能依赖自己
    if (itemId === dependsOnItemId) {
      throw new Error('任务不能依赖自己');
    }
    
    // 3. 业务规则：不能形成循环依赖
    if (await this.wouldCreateCycle(itemId, dependsOnItemId)) {
      throw new Error('不能创建循环依赖');
    }
    
    // 4. 添加依赖（这里需要新的数据模型）
    // await DependencyRepository.create({ itemId, dependsOnItemId });
  }
  
  /**
   * 检查是否会形成循环依赖
   */
  private static async wouldCreateCycle(
    itemId: number,
    dependsOnItemId: number
  ): Promise<boolean> {
    // 使用深度优先搜索检测循环
    const visited = new Set<number>();
    
    const dfs = async (currentId: number): Promise<boolean> => {
      if (currentId === itemId) return true;
      if (visited.has(currentId)) return false;
      
      visited.add(currentId);
      
      // 获取当前任务的所有依赖
      // const dependencies = await DependencyRepository.getDependencies(currentId);
      // for (const dep of dependencies) {
      //   if (await dfs(dep.dependsOnItemId)) return true;
      // }
      
      return false;
    };
    
    return dfs(dependsOnItemId);
  }
  
  /**
   * 获取可以开始的任务（所有依赖都已完成）
   */
  static async getReadyTasks(projectId: number): Promise<TodoItem[]> {
    const items = await ItemRepository.getByProject(projectId);
    const readyTasks: TodoItem[] = [];
    
    for (const item of items) {
      if (item.status !== 'Not start') continue;
      
      // const dependencies = await DependencyRepository.getDependencies(item.id);
      // const allDependenciesCompleted = dependencies.every(
      //   d => d.status === 'Completed'
      // );
      
      // if (allDependenciesCompleted) {
      //   readyTasks.push(item);
      // }
    }
    
    return readyTasks;
  }
}
```

---

## 总结

### 架构演进

**阶段1（当前）：** Components → Storage Manager → Repositories

**阶段2（推荐）：** Components → Storage Manager → **Services** → Repositories

### 何时使用Service

| 场景 | 使用 |
|------|------|
| 简单的CRUD | ❌ Repository |
| 复杂业务规则 | ✅ Service |
| 多表操作 | ✅ Service |
| 需要验证 | ✅ Service |
| 需要事务 | ✅ Service |
| 计算统计 | ✅ Service |

### 下一步

1. ✅ 创建 `src/lib/services/` 目录
2. ✅ 根据业务需求创建Service文件
3. ✅ 将复杂逻辑从Components移到Services
4. ✅ 更新Storage Manager使用Services
5. ✅ 编写单元测试

**记住：** Service层是可选的，但对于复杂的业务逻辑非常有用！ 🚀

