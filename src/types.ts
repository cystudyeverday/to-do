export type ItemType = 'Feature' | 'Issue';
export type ItemStatus = 'Not start' | 'On progress' | 'Waiting for API' | 'Build UI' | 'Integration' | 'Completed' | 'Fix';

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  status: ItemStatus;
  projectId: string;
  module: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  order?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectEfficiency {
  projectId: string;
  projectName: string;
  totalItems: number;
  completedItems: number;
  efficiency: number;
}

export interface TypeDistribution {
  Feature: number;
  Issue: number;
}

export interface DailyCompletion {
  date: string;
  completedCount: number;
}

export interface Statistics {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  pendingItems: number;
  weeklyNewItems: number;
  weeklyCompletedItems: number;
  averageCompletionDays: number;
  statusDistribution: {
    'Not start': number;
    'On progress': number;
    'Waiting for API': number;
    'Build UI': number;
    'Integration': number;
    'Completed': number;
    'Fix': number;
  };
  typeDistribution: TypeDistribution;
  projectEfficiency: ProjectEfficiency[];
  dailyCompletions: DailyCompletion[];
} 