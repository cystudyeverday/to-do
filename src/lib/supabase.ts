import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表结构
export const TABLES = {
  PROJECTS: 'projects',
  ITEMS: 'items',
} as const;

// 项目表结构
export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// 任务表结构
export interface ItemRow {
  id: string;
  title: string;
  description: string | null;
  type: 'Feature' | 'Issue';
  status: 'Not start' | 'On progress' | 'Pending' | 'Completed' | 'Archive';
  project_id: string;
  module: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}
