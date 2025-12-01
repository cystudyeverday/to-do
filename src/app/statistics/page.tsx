'use client';

import { useState, useEffect } from 'react';
import { TodoItem, Project, Statistics, DailyCompletion } from '@/types';
import { StorageManager } from '@/lib/storage';
import { StatisticsCalculator } from '@/lib/statistics';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const projects = await StorageManager.getProjects();
      const items = await StorageManager.getItems();
      const statistics = StatisticsCalculator.calculateStatistics(items, projects);

      // 计算本周完成的任务
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weeklyCompletedItems = items.filter(item =>
        item.status === 'Completed' &&
        item.completedAt &&
        item.completedAt >= weekStart &&
        item.completedAt < weekEnd
      );

      // 更新本周完成的任务数量和每日完成统计
      statistics.weeklyCompletedItems = weeklyCompletedItems.length;

      // 重新计算每日完成统计，基于本地数据
      const dailyCompletions = calculateDailyCompletions(weeklyCompletedItems);
      statistics.dailyCompletions = dailyCompletions;

      setStats(statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
      // 降级到本地计算
      try {
        const projects = await StorageManager.getProjects();
        const items = await StorageManager.getItems();
        const statistics = StatisticsCalculator.calculateStatistics(items, projects);
        setStats(statistics);
      } catch (fallbackError) {
        console.error('Fallback statistics calculation failed:', fallbackError);
        // 设置空统计以避免页面崩溃
        setStats({
          totalItems: 0,
          completedItems: 0,
          inProgressItems: 0,
          notStartedItems: 0,
          weeklyNewItems: 0,
          weeklyCompletedItems: 0,
          averageCompletionTime: 0,
          projectEfficiency: [],
          typeDistribution: [
            { type: 'Feature', count: 0, percentage: 0 },
            { type: 'Issue', count: 0, percentage: 0 },
          ],
          dailyCompletions: [],
        });
      }
    }
  };

  // 计算每日完成统计
  const calculateDailyCompletions = (weeklyCompletedItems: TodoItem[]) => {
    const dailyCompletions: DailyCompletion[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayCompletedItems = weeklyCompletedItems.filter(item =>
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

    return dailyCompletions;
  };

  if (!stats) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const summary = StatisticsCalculator.generateSummary(stats);

  // typeDistribution 现在已经是数组格式
  const typeDistributionData = stats.typeDistribution.map(dist => ({
    type: dist.type,
    count: dist.count,
    percentage: dist.percentage,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
          <p className="mt-2 text-gray-600">View your work efficiency and project progress</p>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.weeklyCompletedItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageCompletionTime} days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalItems > 0 ? Math.round((stats.completedItems / stats.totalItems) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.weeklyNewItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Type Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {typeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Completion Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Completions This Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyCompletions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completedItems" fill="#3B82F6" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Efficiency Ranking */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Project Efficiency Ranking</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.projectEfficiency.map((project, index) => (
                <div key={project.projectId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{project.projectName}</h4>
                      <p className="text-sm text-gray-500">
                        {project.completedItems}/{project.totalItems} completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{project.completionRate}%</p>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{ width: `${project.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Module */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Weekly Summary</h3>
          </div>
          <div className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-gray-700 leading-relaxed">{summary}</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-900">Feature Tasks</p>
                    <p className="text-blue-600">{stats.typeDistribution.find(d => d.type === 'Feature')?.count || 0} items</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="font-medium text-orange-900">Issue Tasks</p>
                    <p className="text-orange-600">{stats.typeDistribution.find(d => d.type === 'Issue')?.count || 0} items</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-medium text-green-900">Avg. Efficiency</p>
                    <p className="text-green-600">{stats.averageCompletionTime} days/task</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 