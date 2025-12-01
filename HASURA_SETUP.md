# Hasura GraphQL 配置指南

## 问题：Missing Hasura configuration

如果遇到 "Missing Hasura configuration" 错误，说明环境变量未正确配置。

## 快速配置步骤

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
cp .env.local.example .env.local
```

### 2. 配置 Hasura 端点

编辑 `.env.local` 文件，填入你的 Hasura 配置：

```env
# Hasura GraphQL 端点 URL
HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app/v1/graphql

# Hasura Admin Secret
HASURA_ADMIN_SECRET=your-admin-secret-key
```

### 3. 获取 Hasura 配置信息

#### 方式 A: 使用 Hasura Cloud

1. 登录 [Hasura Cloud](https://cloud.hasura.io/)
2. 选择你的项目
3. 在项目设置中找到：
   - **GraphQL Endpoint**: 通常是 `https://your-project.hasura.app/v1/graphql`
   - **Admin Secret**: 在 Settings > Admin Secret 中设置或查看

#### 方式 B: 使用本地 Hasura

如果你在本地运行 Hasura：

```env
HASURA_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
HASURA_ADMIN_SECRET=myadminsecretkey
```

本地 Hasura 启动命令示例：

```bash
docker run -d \
  -p 8080:8080 \
  -e HASURA_GRAPHQL_DATABASE_URL=postgres://user:password@host:5432/dbname \
  -e HASURA_GRAPHQL_ENABLE_CONSOLE=true \
  -e HASURA_GRAPHQL_ADMIN_SECRET=myadminsecretkey \
  hasura/graphql-engine:latest
```

### 4. 重启开发服务器

配置完成后，重启 Next.js 开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

### 5. 验证配置

访问测试端点验证配置：

```bash
curl http://localhost:3000/api/test-graphql-connection
```

或者在浏览器中访问：
```
http://localhost:3000/api/test-graphql-connection
```

## 配置示例

### 示例 1: Hasura Cloud

```env
HASURA_GRAPHQL_ENDPOINT=https://my-project.hasura.app/v1/graphql
HASURA_ADMIN_SECRET=my-super-secret-admin-key-12345
```

### 示例 2: 本地开发

```env
HASURA_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
HASURA_ADMIN_SECRET=dev-secret-key
```

### 示例 3: 不使用 Admin Secret（不推荐）

如果你的 Hasura 实例没有启用 Admin Secret：

```env
HASURA_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
HASURA_ADMIN_SECRET=
```

**注意**: 生产环境强烈建议启用 Admin Secret。

## 环境变量说明

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `HASURA_GRAPHQL_ENDPOINT` | ✅ | Hasura GraphQL API 端点 URL | `https://xxx.hasura.app/v1/graphql` |
| `HASURA_ADMIN_SECRET` | ✅ | Hasura Admin Secret（用于认证） | `my-secret-key` |

## 常见问题

### Q1: 如何知道我的 Hasura 端点 URL？

**Hasura Cloud:**
- 登录 Hasura Cloud 控制台
- 在项目概览页面可以看到 GraphQL Endpoint

**本地 Hasura:**
- 默认是 `http://localhost:8080/v1/graphql`
- 如果修改了端口，相应调整 URL

### Q2: 如何设置或查看 Admin Secret？

**Hasura Cloud:**
1. 进入项目设置
2. 找到 "Admin Secret" 部分
3. 设置或查看 Secret

**本地 Hasura:**
- 通过环境变量 `HASURA_GRAPHQL_ADMIN_SECRET` 设置
- 在 Hasura Console 的 Settings 中查看

### Q3: 可以不使用 Admin Secret 吗？

可以，但不推荐，特别是生产环境。如果确实不使用，将 `HASURA_ADMIN_SECRET` 设置为空字符串。

### Q4: 配置后仍然报错？

1. **检查文件位置**: 确保 `.env.local` 在项目根目录
2. **检查变量名**: 确保变量名完全匹配（大小写敏感）
3. **重启服务器**: 修改 `.env.local` 后必须重启开发服务器
4. **检查格式**: 确保没有多余的空格或引号

### Q5: 如何在生产环境配置？

生产环境（如 Vercel、Netlify）需要在平台的环境变量设置中配置：

**Vercel:**
1. 进入项目设置
2. 找到 "Environment Variables"
3. 添加 `HASURA_GRAPHQL_ENDPOINT` 和 `HASURA_ADMIN_SECRET`

**Docker:**
在 `docker-compose.yml` 或 Dockerfile 中设置环境变量。

## 安全提示

⚠️ **重要安全提示：**

1. **不要提交 `.env.local` 到 Git**
   - `.env.local` 已在 `.gitignore` 中
   - 不要将包含密钥的文件提交到版本控制

2. **使用不同的 Secret**
   - 开发、测试、生产环境使用不同的 Admin Secret

3. **定期轮换 Secret**
   - 定期更新 Admin Secret 以提高安全性

4. **限制访问**
   - 只允许必要的 IP 地址访问 Hasura 端点

## 下一步

配置完成后，你可以：

1. ✅ 测试连接: `/api/test-graphql-connection`
2. ✅ 查看 Schema: `/api/schema`
3. ✅ 使用 API: `/api/projects`, `/api/items`, `/api/statistics`

## 相关文档

- [GraphQL 连接测试指南](./GRAPHQL_CONNECTION_TEST.md)
- [数据库 Schema 文档](./DATABASE_SCHEMA.md)
- [Hasura 官方文档](https://hasura.io/docs/)

