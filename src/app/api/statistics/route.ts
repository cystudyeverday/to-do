import { NextRequest, NextResponse } from 'next/server';
import { apolloClient } from '@/lib/apollo-client';
import { GET_STATISTICS, GET_ITEMS, GET_PROJECTS } from '@/lib/graphql/queries';

// GET /api/statistics - 获取统计信息
export async function GET() {
  try {
    // 获取基本统计
    const { data: statsData } = await apolloClient.query<{
      items_aggregate: {
        aggregate: {
          count: number;
        };
      };
      completed_items: {
        aggregate: {
          count: number;
        };
      };
      in_progress_items: {
        aggregate: {
          count: number;
        };
      };
      not_started_items: {
        aggregate: {
          count: number;
        };
      };
      projects_aggregate: {
        aggregate: {
          count: number;
        };
      };
    }>({
      query: GET_STATISTICS,
      fetchPolicy: 'network-only',
    });

    // 获取所有任务以计算更详细的统计
    const { data: itemsData } = await apolloClient.query<{
      items: Array<{
        id: string;
        title: string;
        description: string | null;
        type: string;
        status: string;
        project_id: string;
        module: string | null;
        created_at: string;
        updated_at: string;
        completed_at: string | null;
      }>;
    }>({
      query: GET_ITEMS,
      fetchPolicy: 'network-only',
    });

    if (!statsData || !itemsData) {
      throw new Error('Failed to fetch data from GraphQL');
    }

    const items = itemsData.items;
    const totalItems = statsData.items_aggregate.aggregate.count || 0;
    const completedItems =
      statsData.completed_items.aggregate.count || 0;
    const inProgressItems =
      statsData.in_progress_items.aggregate.count || 0;
    const notStartedItems =
      statsData.not_started_items.aggregate.count || 0;
    const totalProjects =
      statsData.projects_aggregate.aggregate.count || 0;

    // 计算本周新增任务
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyNewItems = items.filter(
      (item: any) => new Date(item.created_at) >= oneWeekAgo
    ).length;

    // 计算本周完成的任务
    const weeklyCompletedItems = items.filter(
      (item: any) =>
        item.status === 'Completed' &&
        item.completed_at &&
        new Date(item.completed_at) >= oneWeekAgo
    ).length;

    // 计算平均完成时间（仅针对已完成的任务）
    const completedItemsWithTime = items.filter(
      (item: any) =>
        item.status === 'Completed' &&
        item.completed_at &&
        item.created_at
    );
    let averageCompletionTime = 0;
    if (completedItemsWithTime.length > 0) {
      const totalTime = completedItemsWithTime.reduce(
        (sum: number, item: any) => {
          const created = new Date(item.created_at).getTime();
          const completed = new Date(item.completed_at).getTime();
          return sum + (completed - created);
        },
        0
      );
      averageCompletionTime = totalTime / completedItemsWithTime.length / (1000 * 60 * 60 * 24); // 转换为天数
    }

    // 按类型分布统计
    const typeDistribution = [
      { type: 'Feature', count: 0, percentage: 0 },
      { type: 'Issue', count: 0, percentage: 0 },
    ];
    items.forEach((item: any) => {
      const typeIndex = typeDistribution.findIndex(
        (t) => t.type === item.type
      );
      if (typeIndex !== -1) {
        typeDistribution[typeIndex].count++;
      }
    });
    typeDistribution.forEach((type) => {
      type.percentage =
        totalItems > 0 ? (type.count / totalItems) * 100 : 0;
    });

    // 按日期统计完成情况（最近30天）
    const dailyCompletions: Array<{
      date: string;
      completedItems: number;
      features: number;
      issues: number;
    }> = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedInLast30Days = items.filter(
      (item: any) =>
        item.status === 'Completed' &&
        item.completed_at &&
        new Date(item.completed_at) >= thirtyDaysAgo
    );

    // 按日期分组
    const dateMap = new Map<string, { features: number; issues: number }>();
    completedInLast30Days.forEach((item: any) => {
      const date = new Date(item.completed_at).toISOString().split('T')[0];
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

    // 转换为数组格式
    dateMap.forEach((data, date) => {
      dailyCompletions.push({
        date,
        completedItems: data.features + data.issues,
        features: data.features,
        issues: data.issues,
      });
    });

    // 按日期排序
    dailyCompletions.sort((a, b) => a.date.localeCompare(b.date));

    // 项目效率统计（需要获取项目数据）
    const { data: projectsData } = await apolloClient.query<{
      projects: Array<{
        id: string;
        name: string;
        description: string | null;
        created_at: string;
        updated_at: string;
      }>;
    }>({
      query: GET_PROJECTS,
      fetchPolicy: 'network-only',
    });

    if (!projectsData) {
      throw new Error('Failed to fetch projects data from GraphQL');
    }

    const projectEfficiency = projectsData.projects.map((project) => {
      const projectItems = items.filter(
        (item: any) => item.project_id === project.id
      );
      const completed = projectItems.filter(
        (item: any) => item.status === 'Completed'
      ).length;
      const completionRate =
        projectItems.length > 0
          ? (completed / projectItems.length) * 100
          : 0;

      return {
        projectId: project.id,
        projectName: project.name,
        completionRate: Math.round(completionRate * 100) / 100,
        totalItems: projectItems.length,
        completedItems: completed,
      };
    });

    const statistics = {
      totalItems,
      completedItems,
      inProgressItems,
      notStartedItems,
      weeklyNewItems,
      weeklyCompletedItems,
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
      projectEfficiency,
      typeDistribution,
      dailyCompletions,
      totalProjects,
    };

    return NextResponse.json({ statistics }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', message: error.message },
      { status: 500 }
    );
  }
}

