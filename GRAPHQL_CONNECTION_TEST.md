# GraphQL 连接验证指南

本文档说明如何验证 Apollo Client 与 Hasura GraphQL 的连接是否成功。

## 方法 1: 使用测试 API 端点（推荐）

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 访问测试端点

在浏览器中访问或使用 curl：

```bash
# 使用 curl
curl http://localhost:3000/api/test-graphql-connection

# 或在浏览器中访问
http://localhost:3000/api/test-graphql-connection
```

### 3. 查看返回结果

**成功响应示例：**
```json
{
  "success": true,
  "message": "GraphQL connection successful",
  "details": {
    "configuration": {
      "endpoint": "https://your-hasura-instance.com/v1/graphql",
      "hasSecret": true,
      "secretLength": 32
    },
    "healthCheck": {
      "success": true,
      "error": null
    },
    "dataQuery": {
      "success": true,
      "error": null,
      "projectCount": 5
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**失败响应示例：**
```json
{
  "success": false,
  "message": "GraphQL connection failed",
  "details": {
    "configuration": {
      "endpoint": "Not configured",
      "hasSecret": false,
      "secretLength": 0
    },
    "healthCheck": {
      "success": false,
      "error": "Network error: Failed to fetch"
    },
    "dataQuery": {
      "success": false,
      "error": null
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## 方法 2: 使用浏览器开发者工具

### 1. 打开浏览器开发者工具（F12）

### 2. 切换到 Network（网络）标签

### 3. 访问任意使用 GraphQL 的页面或调用 API

例如：
- 访问 `/api/projects` 端点
- 查看网络请求中是否有对 Hasura GraphQL 端点的请求

### 4. 检查请求状态

- **200 OK**: 连接成功
- **401 Unauthorized**: 认证失败，检查 `HASURA_ADMIN_SECRET`
- **404 Not Found**: 端点地址错误，检查 `HASURA_GRAPHQL_ENDPOINT`
- **Network Error**: 无法连接到服务器

## 方法 3: 直接测试 API 端点

### 测试项目 API

```bash
# 获取所有项目
curl http://localhost:3000/api/projects

# 创建项目
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"测试项目","description":"这是一个测试项目"}'
```

### 测试任务 API

```bash
# 获取所有任务
curl http://localhost:3000/api/items

# 获取统计信息
curl http://localhost:3000/api/statistics
```

## 环境变量配置

确保在 `.env.local` 或 `.env` 文件中配置了以下变量：

```env
HASURA_GRAPHQL_ENDPOINT=https://your-hasura-instance.com/v1/graphql
HASURA_ADMIN_SECRET=your-admin-secret-key
```

## 常见问题排查

### 1. 环境变量未配置

**错误信息：** `Missing Hasura configuration`

**解决方法：**
- 检查 `.env.local` 文件是否存在
- 确认环境变量名称正确
- 重启开发服务器

### 2. 连接超时

**错误信息：** `Network error: Failed to fetch`

**解决方法：**
- 检查 Hasura 端点 URL 是否正确
- 确认 Hasura 服务是否运行
- 检查网络连接和防火墙设置

### 3. 认证失败

**错误信息：** `401 Unauthorized`

**解决方法：**
- 检查 `HASURA_ADMIN_SECRET` 是否正确
- 确认 Hasura 实例是否启用了 Admin Secret
- 验证 Secret 是否过期

### 4. 表不存在

**错误信息：** `Table 'projects' not found`

**解决方法：**
- 在 Hasura Console 中创建相应的表
- 确认表名和字段名与 GraphQL 查询匹配
- 检查表的权限设置

## 验证步骤总结

1. ✅ 检查环境变量是否配置
2. ✅ 访问 `/api/test-graphql-connection` 端点
3. ✅ 查看返回的 `success` 字段
4. ✅ 如果失败，查看 `details` 中的错误信息
5. ✅ 根据错误信息进行相应的修复

## 自动化测试

你也可以在代码中添加自动化测试：

```typescript
// 在测试文件中
import { apolloClient } from '@/lib/apollo-client';
import { GET_PROJECTS } from '@/lib/graphql/queries';

test('GraphQL connection', async () => {
  const { data } = await apolloClient.query({
    query: GET_PROJECTS,
    fetchPolicy: 'network-only',
  });
  
  expect(data).toBeDefined();
  expect(Array.isArray(data.projects)).toBe(true);
});
```

