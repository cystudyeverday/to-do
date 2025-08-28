export type ItemType = 'Feature' | 'Issue';
export type ItemStatus = 'Not start' | 'On progress' | 'Pending' | 'Completed' | 'Archive';

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  status: ItemStatus;
  projectId: string;
  module?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
}

export interface ProjectEfficiency {
  projectId: string;
  projectName: string;
  completionRate: number;
  totalItems: number;
  completedItems: number;
}

export interface TypeDistribution {
  type: ItemType;
  count: number;
  percentage: number;
}

export interface DailyCompletion {
  date: string;
  completedItems: number;
  features: number;
  issues: number;
}

export interface StatusChange {
  date: string;
  status: ItemStatus;
  count: number;
} 