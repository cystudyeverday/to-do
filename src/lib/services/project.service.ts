/**
 * Project Service
 * 项目相关的业务逻辑（函数式风格）
 */

import { Project } from '@/types';
import { ProjectRepository, ItemRepository } from '../repositories';

/**
 * 创建项目并初始化默认任务
 * @param projectData 项目数据
 * @param createDefaultTasks 是否创建默认任务
 */
export async function createProjectWithDefaults(
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  createDefaultTasks: boolean = true
): Promise<Project> {
  console.log('[ProjectService] Creating project with defaults:', projectData);

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
        module: 'Planning',
      },
      {
        title: '需求分析',
        description: '收集和分析项目需求',
        type: 'Feature' as const,
        status: 'Not start' as const,
        projectId: project.id,
        module: 'Planning',
      },
    ];

    await ItemRepository.createBatch(defaultTasks);
    console.log('[ProjectService] Created default tasks for project:', project.id);
  }

  return project;
}

/**
 * 归档项目（只有当所有任务完成时）
 * @param projectId 项目ID
 */
export async function archiveProject(projectId: number): Promise<{
  success: boolean;
  message: string;
}> {
  console.log('[ProjectService] Archiving project:', projectId);

  // 1. 获取项目的所有任务
  const items = await ItemRepository.getByProject(projectId);

  // 2. 业务规则：检查是否所有任务都已完成
  const hasUncompletedItems = items.some(
    (item) => item.status !== 'Completed' && item.status !== 'Archive'
  );

  if (hasUncompletedItems) {
    return {
      success: false,
      message: '只有当所有任务都完成时才能归档项目',
    };
  }

  // 3. 归档所有任务
  for (const item of items) {
    if (item.status !== 'Archive') {
      await ItemRepository.update(item.id, { status: 'Archive' });
    }
  }

  console.log('[ProjectService] Project archived successfully:', projectId);

  return {
    success: true,
    message: `项目已成功归档，共归档 ${items.length} 个任务`,
  };
}

/**
 * 删除项目（级联删除所有任务）
 * @param projectId 项目ID
 */
export async function deleteProjectCascade(projectId: number): Promise<void> {
  console.log('[ProjectService] Deleting project cascade:', projectId);

  // 1. 获取所有任务
  const items = await ItemRepository.getByProject(projectId);

  // 2. 删除所有任务
  for (const item of items) {
    await ItemRepository.delete(item.id);
  }

  // 3. 删除项目
  await ProjectRepository.delete(projectId);

  console.log('[ProjectService] Project and tasks deleted:', projectId);
}

/**
 * 获取项目统计信息
 * @param projectId 项目ID
 */
export async function getProjectStats(projectId: number) {
  const items = await ItemRepository.getByProject(projectId);

  const stats = {
    total: items.length,
    completed: items.filter((i) => i.status === 'Completed').length,
    inProgress: items.filter((i) => i.status === 'On progress').length,
    notStarted: items.filter((i) => i.status === 'Not start').length,
    completionRate: 0,
    estimatedCompletion: null as Date | null,
  };

  // 计算完成率
  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.completed / stats.total) * 100);
  }

  // 估算完成时间
  if (stats.completed > 0 && stats.total > stats.completed) {
    const completedItems = items.filter((i) => i.status === 'Completed');
    const avgCompletionTime = calculateAverageCompletionTime(completedItems);
    const remainingItems = stats.total - stats.completed;

    if (avgCompletionTime > 0) {
      stats.estimatedCompletion = new Date(
        Date.now() + avgCompletionTime * remainingItems
      );
    }
  }

  return stats;
}

// ==================== 内部辅助函数（不导出）====================

/**
 * 计算平均完成时间（毫秒）
 */
function calculateAverageCompletionTime(items: any[]): number {
  const times = items
    .filter((i) => i.completedAt && i.createdAt)
    .map((i) => i.completedAt.getTime() - i.createdAt.getTime());

  if (times.length === 0) return 0;

  return times.reduce((a, b) => a + b, 0) / times.length;
}
