/**
 * Database Schema API Route
 * Returns the database schema definitions
 * 
 * GET /api/schema - Get database schema information
 */

import { NextRequest } from 'next/server';
import { asyncHandler, successResponse } from '@/lib/api';

/**
 * GET /api/schema
 * Returns comprehensive schema information for all database tables
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const schema = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    tables: {
      projects: {
        name: 'projects',
        description: '项目表',
        sqlite: {
          createTable: `CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`,
          fields: [
            {
              name: 'id',
              type: 'TEXT',
              constraints: ['PRIMARY KEY'],
              description: '项目唯一标识符（UUID）',
            },
            {
              name: 'name',
              type: 'TEXT',
              constraints: ['NOT NULL'],
              description: '项目名称',
            },
            {
              name: 'description',
              type: 'TEXT',
              constraints: [],
              description: '项目描述（可选）',
            },
            {
              name: 'created_at',
              type: 'TEXT',
              constraints: ['NOT NULL'],
              description: '创建时间（ISO 8601 格式）',
            },
            {
              name: 'updated_at',
              type: 'TEXT',
              constraints: ['NOT NULL'],
              description: '更新时间（ISO 8601 格式）',
            },
          ],
        },
        postgresql: {
          createTable: `CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
          fields: [
            {
              name: 'id',
              type: 'TEXT',
              constraints: ['PRIMARY KEY'],
              description: '项目唯一标识符（UUID）',
            },
            {
              name: 'name',
              type: 'TEXT',
              constraints: ['NOT NULL'],
              description: '项目名称',
            },
            {
              name: 'description',
              type: 'TEXT',
              constraints: [],
              description: '项目描述（可选）',
            },
            {
              name: 'created_at',
              type: 'TIMESTAMPTZ',
              constraints: ['NOT NULL', 'DEFAULT NOW()'],
              description: '创建时间（带时区的时间戳）',
            },
            {
              name: 'updated_at',
              type: 'TIMESTAMPTZ',
              constraints: ['NOT NULL', 'DEFAULT NOW()'],
              description: '更新时间（带时区的时间戳）',
            },
          ],
        },
        typescript: {
          interface: `interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}`,
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'name', type: 'string', required: true },
            { name: 'description', type: 'string', required: false },
            { name: 'createdAt', type: 'Date', required: true },
            { name: 'updatedAt', type: 'Date', required: true },
          ],
        },
        graphql: {
          type: `type projects {
  id: String!
  name: String!
  description: String
  created_at: timestamptz!
  updated_at: timestamptz!
}`,
          fields: [
            { name: 'id', type: 'String!', description: '项目唯一标识符' },
            { name: 'name', type: 'String!', description: '项目名称' },
            { name: 'description', type: 'String', description: '项目描述' },
            { name: 'created_at', type: 'timestamptz!', description: '创建时间' },
            { name: 'updated_at', type: 'timestamptz!', description: '更新时间' },
          ],
        },
      },
      items: {
        name: 'items',
        description: '任务表',
        sqlite: {
          createTable: `CREATE TABLE items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('Feature', 'Issue')),
  status TEXT NOT NULL CHECK (status IN ('Not start', 'On progress', 'Pending', 'Completed', 'Archive')),
  project_id TEXT NOT NULL,
  module TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
)`,
          fields: [
            {
              name: 'id',
              type: 'TEXT',
              constraints: ['PRIMARY KEY'],
              description: '任务唯一标识符（UUID）',
            },
            {
              name: 'title',
              type: 'TEXT',
              constraints: ['NOT NULL'],
              description: '任务标题',
            },
            {
              name: 'description',
              type: 'TEXT',
              constraints: [],
              description: '任务描述（可选）',
            },
            {
              name: 'type',
              type: 'TEXT',
              constraints: ['NOT NULL', "CHECK (type IN ('Feature', 'Issue'))"],
              description: '任务类型：Feature 或 Issue',
              enum: ['Feature', 'Issue'],
            },
            {
              name: 'status',
              type: 'TEXT',
              constraints: [
                'NOT NULL',
                "CHECK (status IN ('Not start', 'On progress', 'Pending', 'Completed', 'Archive'))",
              ],
              description: '任务状态',
              enum: ['Not start', 'On progress', 'Pending', 'Completed', 'Archive'],
            },
            {
              name: 'project_id',
              type: 'TEXT',
              constraints: ['NOT NULL', 'FOREIGN KEY REFERENCES projects(id)'],
              description: '所属项目 ID',
            },
            {
              name: 'module',
              type: 'TEXT',
              constraints: [],
              description: '模块名称（可选）',
            },
            {
              name: 'created_at',
              type: 'TEXT',
              constraints: ['NOT NULL'],
              description: '创建时间（ISO 8601 格式）',
            },
            {
              name: 'updated_at',
              type: 'TEXT',
              constraints: ['NOT NULL'],
              description: '更新时间（ISO 8601 格式）',
            },
            {
              name: 'completed_at',
              type: 'TEXT',
              constraints: [],
              description: '完成时间（ISO 8601 格式，可选）',
            },
          ],
        },
        postgresql: {
          createTable: `CREATE TABLE items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('Feature', 'Issue')),
  status TEXT NOT NULL CHECK (status IN ('Not start', 'On progress', 'Pending', 'Completed', 'Archive')),
  project_id TEXT NOT NULL,
  module TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
)`,
          fields: [
            {
              name: 'id',
              type: 'TEXT',
              constraints: ['PRIMARY KEY'],
              description: '任务唯一标识符（UUID）',
            },
            {
              name: 'title',
              type: 'TEXT',
              constraints: ['NOT NULL'],
              description: '任务标题',
            },
            {
              name: 'description',
              type: 'TEXT',
              constraints: [],
              description: '任务描述（可选）',
            },
            {
              name: 'type',
              type: 'TEXT',
              constraints: ['NOT NULL', "CHECK (type IN ('Feature', 'Issue'))"],
              description: '任务类型：Feature 或 Issue',
              enum: ['Feature', 'Issue'],
            },
            {
              name: 'status',
              type: 'TEXT',
              constraints: [
                'NOT NULL',
                "CHECK (status IN ('Not start', 'On progress', 'Pending', 'Completed', 'Archive'))",
              ],
              description: '任务状态',
              enum: ['Not start', 'On progress', 'Pending', 'Completed', 'Archive'],
            },
            {
              name: 'project_id',
              type: 'TEXT',
              constraints: ['NOT NULL', 'FOREIGN KEY REFERENCES projects(id)'],
              description: '所属项目 ID',
            },
            {
              name: 'module',
              type: 'TEXT',
              constraints: [],
              description: '模块名称（可选）',
            },
            {
              name: 'created_at',
              type: 'TIMESTAMPTZ',
              constraints: ['NOT NULL', 'DEFAULT NOW()'],
              description: '创建时间（带时区的时间戳）',
            },
            {
              name: 'updated_at',
              type: 'TIMESTAMPTZ',
              constraints: ['NOT NULL', 'DEFAULT NOW()'],
              description: '更新时间（带时区的时间戳）',
            },
            {
              name: 'completed_at',
              type: 'TIMESTAMPTZ',
              constraints: [],
              description: '完成时间（带时区的时间戳，可选）',
            },
          ],
        },
        typescript: {
          interface: `type ItemType = 'Feature' | 'Issue';
type ItemStatus = 'Not start' | 'On progress' | 'Pending' | 'Completed' | 'Archive';

interface TodoItem {
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
}`,
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
            { name: 'description', type: 'string', required: true },
            { name: 'type', type: "ItemType ('Feature' | 'Issue')", required: true },
            { name: 'status', type: 'ItemStatus', required: true },
            { name: 'projectId', type: 'string', required: true },
            { name: 'module', type: 'string', required: false },
            { name: 'createdAt', type: 'Date', required: true },
            { name: 'updatedAt', type: 'Date', required: true },
            { name: 'completedAt', type: 'Date', required: false },
          ],
        },
        graphql: {
          type: `type items {
  id: String!
  title: String!
  description: String
  type: String!
  status: String!
  project_id: String!
  module: String
  created_at: timestamptz!
  updated_at: timestamptz!
  completed_at: timestamptz
}`,
          fields: [
            { name: 'id', type: 'String!', description: '任务唯一标识符' },
            { name: 'title', type: 'String!', description: '任务标题' },
            { name: 'description', type: 'String', description: '任务描述' },
            { name: 'type', type: 'String!', description: '任务类型：Feature 或 Issue' },
            { name: 'status', type: 'String!', description: '任务状态' },
            { name: 'project_id', type: 'String!', description: '所属项目 ID' },
            { name: 'module', type: 'String', description: '模块名称' },
            { name: 'created_at', type: 'timestamptz!', description: '创建时间' },
            { name: 'updated_at', type: 'timestamptz!', description: '更新时间' },
            { name: 'completed_at', type: 'timestamptz', description: '完成时间' },
          ],
        },
      },
    },
    indexes: {
      sqlite: [
        {
          name: 'idx_items_project_id',
          table: 'items',
          columns: ['project_id'],
          description: '项目 ID 索引（用于快速查询项目的所有任务）',
        },
        {
          name: 'idx_items_status',
          table: 'items',
          columns: ['status'],
          description: '状态索引（用于按状态筛选任务）',
        },
        {
          name: 'idx_items_created_at',
          table: 'items',
          columns: ['created_at'],
          description: '创建时间索引（用于按时间排序）',
        },
        {
          name: 'idx_items_completed_at',
          table: 'items',
          columns: ['completed_at'],
          description: '完成时间索引（用于统计和查询已完成任务）',
        },
      ],
      postgresql: [
        {
          name: 'idx_items_project_id',
          table: 'items',
          columns: ['project_id'],
          description: '项目 ID 索引',
        },
        {
          name: 'idx_items_status',
          table: 'items',
          columns: ['status'],
          description: '状态索引',
        },
        {
          name: 'idx_items_created_at',
          table: 'items',
          columns: ['created_at'],
          description: '创建时间索引',
        },
        {
          name: 'idx_items_completed_at',
          table: 'items',
          columns: ['completed_at'],
          description: '完成时间索引',
        },
        {
          name: 'idx_items_project_status',
          table: 'items',
          columns: ['project_id', 'status'],
          description: '复合索引（项目 ID + 状态）',
        },
        {
          name: 'idx_items_status_created',
          table: 'items',
          columns: ['status', 'created_at'],
          description: '复合索引（状态 + 创建时间）',
        },
      ],
    },
    relationships: [
      {
        from: 'projects',
        to: 'items',
        type: 'one-to-many',
        foreignKey: 'project_id',
        onDelete: 'CASCADE',
        description: '一个项目可以有多个任务，删除项目时关联的任务会被级联删除',
      },
    ],
  };

  return successResponse(schema);
});
