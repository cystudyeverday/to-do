# 数据库 Schema 文档

本文档详细列出了项目中所有数据表的结构定义。

## 📋 目录

- [项目表 (projects)](#项目表-projects)
- [任务表 (items)](#任务表-items)
- [索引定义](#索引定义)
- [TypeScript 类型定义](#typescript-类型定义)
- [GraphQL Schema](#graphql-schema)

---

## 项目表 (projects)

### SQLite Schema

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

### 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | TEXT | PRIMARY KEY | 项目唯一标识符（UUID） |
| `name` | TEXT | NOT NULL | 项目名称 |
| `description` | TEXT | NULL | 项目描述（可选） |
| `created_at` | TEXT | NOT NULL | 创建时间（ISO 8601 格式） |
| `updated_at` | TEXT | NOT NULL | 更新时间（ISO 8601 格式） |

### Hasura/PostgreSQL Schema

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### TypeScript 接口

```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### GraphQL 类型

```graphql
type projects {
  id: String!
  name: String!
  description: String
  created_at: timestamptz!
  updated_at: timestamptz!
}
```

---

## 任务表 (items)

### SQLite Schema

```sql
CREATE TABLE items (
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
)
```

### 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | TEXT | PRIMARY KEY | 任务唯一标识符（UUID） |
| `title` | TEXT | NOT NULL | 任务标题 |
| `description` | TEXT | NULL | 任务描述（可选） |
| `type` | TEXT | NOT NULL, CHECK | 任务类型：'Feature' 或 'Issue' |
| `status` | TEXT | NOT NULL, CHECK | 任务状态：'Not start', 'On progress', 'Pending', 'Completed', 'Archive' |
| `project_id` | TEXT | NOT NULL, FOREIGN KEY | 所属项目 ID（外键关联 projects.id） |
| `module` | TEXT | NULL | 模块名称（可选） |
| `created_at` | TEXT | NOT NULL | 创建时间（ISO 8601 格式） |
| `updated_at` | TEXT | NOT NULL | 更新时间（ISO 8601 格式） |
| `completed_at` | TEXT | NULL | 完成时间（ISO 8601 格式，可选） |

### 枚举值

#### type 枚举
- `Feature` - 功能需求
- `Issue` - 问题/缺陷

#### status 枚举
- `Not start` - 未开始
- `On progress` - 进行中
- `Pending` - 待处理
- `Completed` - 已完成
- `Archive` - 已归档

### Hasura/PostgreSQL Schema

```sql
CREATE TABLE items (
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
);

-- 创建枚举类型（可选，PostgreSQL 推荐方式）
CREATE TYPE item_type AS ENUM ('Feature', 'Issue');
CREATE TYPE item_status AS ENUM ('Not start', 'On progress', 'Pending', 'Completed', 'Archive');
```

### TypeScript 接口

```typescript
type ItemType = 'Feature' | 'Issue';
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
}
```

### GraphQL 类型

```graphql
type items {
  id: String!
  title: String!
  description: String
  type: String!  # 'Feature' or 'Issue'
  status: String!  # 'Not start', 'On progress', 'Pending', 'Completed', 'Archive'
  project_id: String!
  module: String
  created_at: timestamptz!
  updated_at: timestamptz!
  completed_at: timestamptz
}
```

---

## 索引定义

### SQLite 索引

```sql
-- 项目 ID 索引（用于快速查询项目的所有任务）
CREATE INDEX IF NOT EXISTS idx_items_project_id ON items (project_id);

-- 状态索引（用于按状态筛选任务）
CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);

-- 创建时间索引（用于按时间排序）
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at);

-- 完成时间索引（用于统计和查询已完成任务）
CREATE INDEX IF NOT EXISTS idx_items_completed_at ON items (completed_at);
```

### PostgreSQL/Hasura 索引（推荐）

```sql
-- 项目 ID 索引
CREATE INDEX idx_items_project_id ON items (project_id);

-- 状态索引
CREATE INDEX idx_items_status ON items (status);

-- 创建时间索引
CREATE INDEX idx_items_created_at ON items (created_at);

-- 完成时间索引
CREATE INDEX idx_items_completed_at ON items (completed_at);

-- 复合索引（用于常见查询模式）
CREATE INDEX idx_items_project_status ON items (project_id, status);
CREATE INDEX idx_items_status_created ON items (status, created_at);
```

---

## TypeScript 类型定义

### 完整类型定义

```typescript
// src/types/index.ts

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
```

### 数据库行类型（内部使用）

```typescript
// SQLite 数据库行类型
interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemRow {
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
```

---

## GraphQL Schema

### 查询 (Queries)

```graphql
# 获取所有项目
query GetProjects {
  projects(order_by: { created_at: desc }) {
    id
    name
    description
    created_at
    updated_at
  }
}

# 根据 ID 获取项目
query GetProjectById($id: String!) {
  projects_by_pk(id: $id) {
    id
    name
    description
    created_at
    updated_at
  }
}

# 获取所有任务
query GetItems {
  items(order_by: { created_at: desc }) {
    id
    title
    description
    type
    status
    project_id
    module
    created_at
    updated_at
    completed_at
  }
}

# 根据项目 ID 获取任务
query GetItemsByProject($projectId: String!) {
  items(
    where: { project_id: { _eq: $projectId } }
    order_by: { created_at: desc }
  ) {
    id
    title
    description
    type
    status
    project_id
    module
    created_at
    updated_at
    completed_at
  }
}
```

### 变更 (Mutations)

```graphql
# 创建项目
mutation CreateProject($name: String!, $description: String) {
  insert_projects_one(object: { name: $name, description: $description }) {
    id
    name
    description
    created_at
    updated_at
  }
}

# 更新项目
mutation UpdateProject($id: String!, $name: String, $description: String) {
  update_projects_by_pk(
    pk_columns: { id: $id }
    _set: { name: $name, description: $description, updated_at: "now()" }
  ) {
    id
    name
    description
    created_at
    updated_at
  }
}

# 删除项目
mutation DeleteProject($id: String!) {
  delete_projects_by_pk(id: $id) {
    id
  }
}

# 创建任务
mutation CreateItem(
  $title: String!
  $description: String
  $type: String!
  $status: String!
  $project_id: String!
  $module: String
) {
  insert_items_one(
    object: {
      title: $title
      description: $description
      type: $type
      status: $status
      project_id: $project_id
      module: $module
    }
  ) {
    id
    title
    description
    type
    status
    project_id
    module
    created_at
    updated_at
    completed_at
  }
}

# 更新任务
mutation UpdateItem(
  $id: String!
  $title: String
  $description: String
  $type: String
  $status: String
  $project_id: String
  $module: String
  $completed_at: timestamptz
) {
  update_items_by_pk(
    pk_columns: { id: $id }
    _set: {
      title: $title
      description: $description
      type: $type
      status: $status
      project_id: $project_id
      module: $module
      completed_at: $completed_at
      updated_at: "now()"
    }
  ) {
    id
    title
    description
    type
    status
    project_id
    module
    created_at
    updated_at
    completed_at
  }
}

# 删除任务
mutation DeleteItem($id: String!) {
  delete_items_by_pk(id: $id) {
    id
  }
}
```

---

## 关系说明

### 外键关系

```
projects (1) ──────< (N) items
   id              project_id
```

- 一个项目可以有多个任务
- 一个任务只属于一个项目
- 删除项目时，关联的任务会被级联删除（`ON DELETE CASCADE`）

---

## 数据约束

### 检查约束

1. **items.type**: 只能是 'Feature' 或 'Issue'
2. **items.status**: 只能是 'Not start', 'On progress', 'Pending', 'Completed', 'Archive'

### 外键约束

- `items.project_id` 必须引用 `projects.id` 中存在的值
- 删除项目时，关联的任务会自动删除

---

## 时间戳格式

- **SQLite**: 使用 TEXT 类型存储 ISO 8601 格式字符串（例如：`2024-01-01T12:00:00.000Z`）
- **PostgreSQL/Hasura**: 使用 `TIMESTAMPTZ` 类型存储带时区的时间戳

---

## 示例数据

### 项目示例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "电商平台开发",
  "description": "开发一个完整的电商平台",
  "created_at": "2024-01-01T10:00:00.000Z",
  "updated_at": "2024-01-01T10:00:00.000Z"
}
```

### 任务示例

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "用户注册登录",
  "description": "完成用户注册和登录功能",
  "type": "Feature",
  "status": "Completed",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "module": "User Management",
  "created_at": "2024-01-01T10:00:00.000Z",
  "updated_at": "2024-01-15T14:30:00.000Z",
  "completed_at": "2024-01-15T14:30:00.000Z"
}
```

---

## 迁移说明

### 从 SQLite 到 PostgreSQL

主要差异：
1. 时间戳类型：TEXT → TIMESTAMPTZ
2. 索引语法略有不同
3. CHECK 约束语法相同

### 从 PostgreSQL 到 SQLite

主要差异：
1. 时间戳类型：TIMESTAMPTZ → TEXT（ISO 8601 字符串）
2. 需要手动转换时间格式

---

## 相关文件

- **SQLite 实现**: `src/lib/local-database.ts`
- **TypeScript 类型**: `src/types/index.ts`
- **GraphQL 查询**: `src/lib/graphql/queries.ts`
- **GraphQL 变更**: `src/lib/graphql/mutations.ts`
- **Supabase 类型**: `src/lib/supabase.ts`

