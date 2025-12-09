/**
 * Statistics Service
 * Business logic for statistics and analytics
 */

import { ItemRepository, ProjectRepository } from '../repositories';
import { TodoItem } from '@/types';

/**
 * Statistics Response
 */
export interface Statistics {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  weeklyNewItems: number;
  weeklyCompletedItems: number;
  averageCompletionTime: number;
  projectEfficiency: ProjectEfficiency[];
  typeDistribution: TypeDistribution[];
  dailyCompletions: DailyCompletion[];
  totalProjects: number;
}

/**
 * Project Efficiency
 */
export interface ProjectEfficiency {
  projectId: number;
  projectName: string;
  completionRate: number;
  totalItems: number;
  completedItems: number;
}

/**
 * Type Distribution
 */
export interface TypeDistribution {
  type: 'Feature' | 'Issue';
  count: number;
  percentage: number;
}

/**
 * Daily Completion
 */
export interface DailyCompletion {
  date: string;
  completedItems: number;
  features: number;
  issues: number;
}

/**
 * Get comprehensive statistics
 */
export async function getStatistics(): Promise<Statistics> {
  console.log('[StatisticsService] Fetching statistics');

  // Fetch all data
  const [items, projects] = await Promise.all([
    ItemRepository.getAll(),
    ProjectRepository.getAll(),
  ]);

  // Calculate basic counts
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === 'Completed').length;
  const inProgressItems = items.filter((i) => i.status === 'On progress').length;
  const notStartedItems = items.filter((i) => i.status === 'Not start').length;
  const totalProjects = projects.length;

  // Calculate weekly statistics
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyNewItems = items.filter(
    (item) => item.createdAt >= oneWeekAgo
  ).length;

  const weeklyCompletedItems = items.filter(
    (item) =>
      item.status === 'Completed' &&
      item.completedAt &&
      item.completedAt >= oneWeekAgo
  ).length;

  // Calculate average completion time
  const averageCompletionTime = calculateAverageCompletionTime(items);

  // Calculate project efficiency
  const projectEfficiency = calculateProjectEfficiency(items, projects);

  // Calculate type distribution
  const typeDistribution = calculateTypeDistribution(items);

  // Calculate daily completions (last 30 days)
  const dailyCompletions = calculateDailyCompletions(items);

  return {
    totalItems,
    completedItems,
    inProgressItems,
    notStartedItems,
    weeklyNewItems,
    weeklyCompletedItems,
    averageCompletionTime,
    projectEfficiency,
    typeDistribution,
    dailyCompletions,
    totalProjects,
  };
}

/**
 * Get statistics for a specific project
 */
export async function getProjectStatistics(projectId: number) {
  console.log('[StatisticsService] Fetching project statistics:', projectId);

  const items = await ItemRepository.getByProject(projectId);

  const stats = {
    total: items.length,
    completed: items.filter((i) => i.status === 'Completed').length,
    inProgress: items.filter((i) => i.status === 'On progress').length,
    notStarted: items.filter((i) => i.status === 'Not start').length,
    archived: items.filter((i) => i.status === 'Archive').length,
    pending: items.filter((i) => i.status === 'Pending').length,
    completionRate: 0,
    averageCompletionTime: 0,
    typeDistribution: calculateTypeDistribution(items),
  };

  // Calculate completion rate
  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.completed / stats.total) * 100);
  }

  // Calculate average completion time for this project
  stats.averageCompletionTime = calculateAverageCompletionTime(items);

  return stats;
}

/**
 * Get trend data (daily completions over time)
 */
export async function getTrendData(days: number = 30): Promise<DailyCompletion[]> {
  console.log('[StatisticsService] Fetching trend data for', days, 'days');

  const items = await ItemRepository.getAll();
  return calculateDailyCompletions(items, days);
}

// ==================== Internal Helper Functions ====================

/**
 * Calculate average completion time in days
 */
function calculateAverageCompletionTime(items: TodoItem[]): number {
  const completedItemsWithTime = items.filter(
    (item) =>
      item.status === 'Completed' &&
      item.completedAt &&
      item.createdAt
  );

  if (completedItemsWithTime.length === 0) {
    return 0;
  }

  const totalTime = completedItemsWithTime.reduce((sum, item) => {
    const created = item.createdAt.getTime();
    const completed = item.completedAt!.getTime();
    return sum + (completed - created);
  }, 0);

  // Convert to days
  const averageMs = totalTime / completedItemsWithTime.length;
  return Math.round((averageMs / (1000 * 60 * 60 * 24)) * 100) / 100;
}

/**
 * Calculate project efficiency
 */
function calculateProjectEfficiency(
  items: TodoItem[],
  projects: any[]
): ProjectEfficiency[] {
  return projects.map((project) => {
    const projectItems = items.filter((item) => item.projectId === project.id);
    const completed = projectItems.filter(
      (item) => item.status === 'Completed'
    ).length;
    const completionRate =
      projectItems.length > 0
        ? Math.round((completed / projectItems.length) * 100 * 100) / 100
        : 0;

    return {
      projectId: project.id,
      projectName: project.name,
      completionRate,
      totalItems: projectItems.length,
      completedItems: completed,
    };
  });
}

/**
 * Calculate type distribution
 */
function calculateTypeDistribution(items: TodoItem[]): TypeDistribution[] {
  const distribution: TypeDistribution[] = [
    { type: 'Feature', count: 0, percentage: 0 },
    { type: 'Issue', count: 0, percentage: 0 },
  ];

  items.forEach((item) => {
    const typeIndex = distribution.findIndex((t) => t.type === item.type);
    if (typeIndex !== -1) {
      distribution[typeIndex].count++;
    }
  });

  // Calculate percentages
  const total = items.length;
  distribution.forEach((type) => {
    type.percentage = total > 0 ? Math.round((type.count / total) * 100 * 100) / 100 : 0;
  });

  return distribution;
}

/**
 * Calculate daily completions
 */
function calculateDailyCompletions(
  items: TodoItem[],
  days: number = 30
): DailyCompletion[] {
  const nDaysAgo = new Date();
  nDaysAgo.setDate(nDaysAgo.getDate() - days);

  const completedInLastNDays = items.filter(
    (item) =>
      item.status === 'Completed' &&
      item.completedAt &&
      item.completedAt >= nDaysAgo
  );

  // Group by date
  const dateMap = new Map<string, { features: number; issues: number }>();

  completedInLastNDays.forEach((item) => {
    const date = item.completedAt!.toISOString().split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, { features: 0, issues: 0 });
    }
    const dayData = dateMap.get(date)!;
    if (item.type === 'Feature') {
      dayData.features++;
    } else {
      dayData.issues++;
    }
  });

  // Convert to array format
  const dailyCompletions: DailyCompletion[] = [];
  dateMap.forEach((data, date) => {
    dailyCompletions.push({
      date,
      completedItems: data.features + data.issues,
      features: data.features,
      issues: data.issues,
    });
  });

  // Sort by date
  dailyCompletions.sort((a, b) => a.date.localeCompare(b.date));

  return dailyCompletions;
}

