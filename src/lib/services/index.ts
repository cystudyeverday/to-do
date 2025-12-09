/**
 * Service Layer Exports
 * 业务逻辑层导出
 */

// Project Service - 项目服务
export {
  createProjectWithDefaults,
  archiveProject,
  deleteProjectCascade,
  getProjectStats,
} from './project.service';

// Item Service - 任务服务
export {
  completeItem,
  createItem,
  batchUpdateStatus,
  getOverdueItems,
} from './item.service';

// Statistics Service - 统计服务
export {
  getStatistics,
  getProjectStatistics,
  getTrendData,
} from './statistics.service';
export type {
  Statistics,
  ProjectEfficiency,
  TypeDistribution,
  DailyCompletion,
} from './statistics.service';
