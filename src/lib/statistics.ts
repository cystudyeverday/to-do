import { TodoItem, Project, Statistics, ProjectEfficiency, TypeDistribution, DailyCompletion } from '@/types';
import { startOfWeek, endOfWeek, format, differenceInDays } from 'date-fns';

export class StatisticsCalculator {
  static calculateStatistics(items: TodoItem[], projects: Project[]): Statistics {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const weeklyItems = items.filter(item =>
      item.createdAt >= weekStart && item.createdAt <= weekEnd
    );

    const completedItems = items.filter(item => item.status === 'Completed');
    const inProgressItems = items.filter(item => item.status === 'On progress');
    const pendingItems = items.filter(item => item.status === 'Not start'); // Pending is mapped to Not start

    const weeklyCompletedItems = weeklyItems.filter(item => item.status === 'Completed');
    const weeklyNewItems = weeklyItems.length;

    // 计算平均完成时间
    const completedWithTime = completedItems.filter(item => item.completedAt);
    const totalCompletionDays = completedWithTime.reduce((sum, item) => {
      if (item.completedAt) {
        return sum + differenceInDays(item.completedAt, item.createdAt);
      }
      return sum;
    }, 0);
    const averageCompletionDays = completedWithTime.length > 0
      ? Math.round(totalCompletionDays / completedWithTime.length)
      : 0;

    // 按状态统计
    const statusDistribution = {
      'Not start': items.filter(item => item.status === 'Not start').length,
      'On progress': items.filter(item => item.status === 'On progress').length,
      'Pending': items.filter(item => item.status === 'Pending').length,
      'Completed': items.filter(item => item.status === 'Completed').length,
      'Archive': items.filter(item => item.status === 'Archive').length,
    };

    // 按类型统计
    const featureCount = items.filter(item => item.type === 'Feature').length;
    const issueCount = items.filter(item => item.type === 'Issue').length;
    const totalCount = items.length;
    const typeDistribution: TypeDistribution[] = [
      {
        type: 'Feature',
        count: featureCount,
        percentage: totalCount > 0 ? Math.round((featureCount / totalCount) * 100) : 0,
      },
      {
        type: 'Issue',
        count: issueCount,
        percentage: totalCount > 0 ? Math.round((issueCount / totalCount) * 100) : 0,
      },
    ];

    // 项目效率排名
    const projectEfficiency: ProjectEfficiency[] = projects.map(project => {
      const projectItems = items.filter(item => item.projectId === project.id);
      const completedCount = projectItems.filter(item => item.status === 'Completed').length;
      const totalCount = projectItems.length;
      const efficiency = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      return {
        projectId: project.id,
        projectName: project.name,
        totalItems: totalCount,
        completedItems: completedCount,
        completionRate: Math.round(efficiency),
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    // 每日完成统计
    const dailyCompletions: DailyCompletion[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayCompletedItems = completedItems.filter(item =>
        item.completedAt && item.completedAt >= dayStart && item.completedAt < dayEnd
      );

      const features = dayCompletedItems.filter(item => item.type === 'Feature').length;
      const issues = dayCompletedItems.filter(item => item.type === 'Issue').length;

      dailyCompletions.push({
        date: format(dayStart, 'MM/dd'),
        completedItems: dayCompletedItems.length,
        features,
        issues,
      });
    }

    return {
      totalItems: items.length,
      completedItems: completedItems.length,
      inProgressItems: inProgressItems.length,
      notStartedItems: pendingItems.length,
      weeklyNewItems,
      weeklyCompletedItems: weeklyCompletedItems.length,
      averageCompletionTime: averageCompletionDays,
      projectEfficiency,
      typeDistribution,
      dailyCompletions,
    };
  }

  static generateSummary(stats: Statistics): string {
    const completionRate = stats.totalItems > 0
      ? Math.round((stats.completedItems / stats.totalItems) * 100)
      : 0;

    let summary = `Total: ${stats.totalItems} items, ${stats.completedItems} completed (${completionRate}% completion rate). `;

    if (stats.weeklyNewItems > 0) {
      summary += `This week: ${stats.weeklyNewItems} new items, ${stats.weeklyCompletedItems} completed. `;
    }

    if (stats.averageCompletionTime > 0) {
      summary += `Average completion time: ${stats.averageCompletionTime} days. `;
    }

    const topProject = stats.projectEfficiency[0];
    if (topProject && topProject.completionRate > 0) {
      summary += `Top performing project: ${topProject.projectName} (${topProject.completionRate}% efficiency).`;
    }

    return summary;
  }
} 