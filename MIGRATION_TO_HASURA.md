# 迁移到 Hasura GraphQL 数据库

## 概述

项目已完全迁移到使用 Hasura GraphQL 作为唯一的数据存储后端。所有本地数据库（SQLite）和 Supabase 相关代码已被移除。

## 已完成的更改

### 1. 删除的文件
- ✅ `src/lib/local-database.ts` - 本地 SQLite 数据库管理器
- ✅ `src/lib/supabase.ts` - Supabase 客户端配置
- ✅ `src/lib/supabase-storage.ts` - Supabase 存储管理器

### 2. 新增的文件
- ✅ `src/lib/graphql-storage.ts` - 基于 Hasura GraphQL 的存储管理器

### 3. 更新的文件
- ✅ `src/lib/storage-manager.ts` - 现在只使用 GraphQL 存储
- ✅ `src/lib/storage.ts` - 更新为使用 GraphQL API（保持接口兼容）
- ✅ `src/lib/init-data.ts` - 更新为异步方法
- ✅ `src/app/items/page.tsx` - 更新为异步调用
- ✅ `src/app/dashboard/page.tsx` - 更新为异步调用

### 4. 依赖更新
- ✅ 从 `package.json` 移除：
  - `better-sqlite3`
  - `@types/better-sqlite3`
  - `@supabase/supabase-js`
- ✅ 保留：
  - `@apollo/client` - GraphQL 客户端
  - `rxjs` - Apollo Client 依赖

## 需要更新的组件

以下组件仍需要更新为异步调用（如果它们使用同步的 StorageManager 方法）：

### 客户端组件（需要异步更新）
- `src/app/add/page.tsx`
- `src/app/recovery/page.tsx`
- `src/app/statistics/page.tsx`
- `src/components/quick-add-modal.tsx`
- `src/components/quick-edit.tsx`
- `src/components/batch-manager.tsx`
- `src/components/project-modal.tsx`

### 更新模式

**之前（同步）：**
```typescript
const items = StorageManager.getItems();
const projects = StorageManager.getProjects();
StorageManager.addItem(item);
```

**现在（异步）：**
```typescript
const items = await StorageManager.getItems();
const projects = await StorageManager.getProjects();
await StorageManager.addItem(item);
```

## API 端点

所有数据操作现在通过以下 API 端点进行：

- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建项目
- `GET /api/projects/[id]` - 获取单个项目
- `PUT /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目
- `GET /api/items` - 获取所有任务
- `POST /api/items` - 创建任务
- `GET /api/items/[id]` - 获取单个任务
- `PUT /api/items/[id]` - 更新任务
- `DELETE /api/items/[id]` - 删除任务
- `GET /api/statistics` - 获取统计信息

## 环境变量配置

确保在 `.env.local` 中配置了 Hasura：

```env
HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app/v1/graphql
HASURA_ADMIN_SECRET=your-admin-secret
```

## 测试连接

使用以下端点测试 Hasura 连接：

```bash
curl http://localhost:3000/api/test-graphql-connection
```

## 注意事项

1. **所有 StorageManager 方法现在都是异步的**
   - 需要使用 `await` 或 `.then()`
   - 在 React 组件中，在 `useEffect` 或事件处理函数中使用

2. **错误处理**
   - 所有 GraphQL 操作都应该包含 try-catch
   - 网络错误会抛出异常

3. **数据格式**
   - GraphQL 返回的数据格式与之前相同
   - 时间字段会自动转换为 Date 对象

4. **性能考虑**
   - 使用 `fetchPolicy: 'network-only'` 确保获取最新数据
   - 考虑添加缓存策略以提高性能

## 下一步

1. 更新剩余的组件为异步调用
2. 测试所有功能确保正常工作
3. 配置 Hasura 数据库和表结构
4. 设置 Hasura 权限和角色

## 相关文档

- [Hasura 配置指南](./HASURA_SETUP.md)
- [GraphQL 连接测试](./GRAPHQL_CONNECTION_TEST.md)
- [数据库 Schema](./DATABASE_SCHEMA.md)

