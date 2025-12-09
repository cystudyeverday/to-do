/**
 * Item Service
 * 任务相关的业务逻辑（函数式风格）
 */

import { TodoItem } from '@/types';
import { ItemRepository, ProjectRepository } from '../repositories';

/**
 * 完成任务（自动设置完成时间，检查项目状态）
 * @param itemId 任务ID
 */
export async function completeItem(itemId: number): Promise<{
  item: TodoItem;
  projectCompleted: boolean;
}> {
  console.log('[ItemService] Completing item:', itemId);

  // 1. 获取任务
  const item = await ItemRepository.getById(itemId);
  if (!item) {
    throw new Error('任务不存在');
  }

  // 2. 更新任务状态和完成时间
  const updatedItem = await ItemRepository.update(itemId, {
    status: 'Completed',
    completedAt: new Date(),
  });

  if (!updatedItem) {
    throw new Error('更新任务失败');
  }

  // 3. 检查项目中的所有任务是否都已完成
  const projectItems = await ItemRepository.getByProject(item.projectId);
  const allCompleted = projectItems.every(
    (i) => i.status === 'Completed' || i.status === 'Archive'
  );

  console.log('[ItemService] Item completed, project completed:', allCompleted);

  return {
    item: updatedItem,
    projectCompleted: allCompleted,
  };
}

/**
 * 创建任务（带验证和自动分类）
 * @param itemData 任务数据
 */
export async function createItem(
  itemData: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TodoItem> {
  console.log('[ItemService] Creating item:', itemData);

  // 1. 业务验证
  validateItemData(itemData);

  // 2. 检查项目是否存在
  const project = await ProjectRepository.getById(itemData.projectId);
  if (!project) {
    throw new Error('项目不存在');
  }

  // 3. 业务规则：如果没有指定模块，自动分类
  if (!itemData.module || itemData.module === 'Other') {
    itemData.module = autoClassifyModule(itemData.title);
    console.log('[ItemService] Auto-classified to module:', itemData.module);
  }

  // 4. 创建任务
  return ItemRepository.create(itemData);
}

/**
 * 批量更新任务状态
 * @param itemIds 任务ID列表
 * @param status 新状态
 */
export async function batchUpdateStatus(
  itemIds: number[],
  status: TodoItem['status']
): Promise<TodoItem[]> {
  console.log('[ItemService] Batch updating status:', { itemIds, status });

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

  console.log('[ItemService] Batch update completed:', updatedItems.length);
  return updatedItems;
}

/**
 * 获取逾期任务
 * @param daysThreshold 逾期天数阈值（默认7天）
 */
export async function getOverdueItems(daysThreshold: number = 7): Promise<TodoItem[]> {
  const allItems = await ItemRepository.getAll();
  const now = new Date();

  // 业务逻辑：根据创建时间判断是否逾期
  return allItems.filter((item) => {
    if (item.status === 'Completed' || item.status === 'Archive') {
      return false;
    }

    const daysSinceCreation =
      (now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceCreation > daysThreshold;
  });
}

// ==================== 内部辅助函数（不导出）====================

/**
 * 验证任务数据
 */
function validateItemData(
  itemData: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>
): void {
  if (!itemData.title || itemData.title.trim().length === 0) {
    throw new Error('任务标题不能为空');
  }

  if (itemData.title.length > 200) {
    throw new Error('任务标题不能超过200个字符');
  }

  const validStatuses: TodoItem['status'][] = [
    'Not start',
    'On progress',
    'Pending',
    'Completed',
    'Archive',
  ];
  if (!validStatuses.includes(itemData.status)) {
    throw new Error('无效的任务状态');
  }

  const validTypes: ('Feature' | 'Issue')[] = ['Feature', 'Issue'];
  if (!validTypes.includes(itemData.type)) {
    throw new Error('无效的任务类型');
  }
}

/**
 * 自动分类模块
 */
function autoClassifyModule(title: string): string {
  const lowerTitle = title.toLowerCase();

  const moduleKeywords: Record<string, string[]> = {
    Frontend: ['ui', 'ux', '界面', '前端', '页面', 'component', '组件'],
    Backend: ['api', 'backend', '后端', '接口', '服务', 'service', 'controller'],
    Database: ['database', 'db', '数据库', 'sql', 'query', '查询'],
    DevOps: ['deploy', 'ci', 'cd', '部署', '运维', 'docker', 'kubernetes'],
    Testing: ['test', 'testing', '测试', 'bug', 'fix', '修复'],
    Configuration: ['config', '配置', 'setting', '设置', 'option'],
  };

  for (const [module, keywords] of Object.entries(moduleKeywords)) {
    if (keywords.some((keyword) => lowerTitle.includes(keyword))) {
      return module;
    }
  }

  return 'Other';
}
