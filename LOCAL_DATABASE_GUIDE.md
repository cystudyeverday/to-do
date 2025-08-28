# 本地数据库使用指南

## 概述

本项目现在支持本地 SQLite 数据库存储，数据将存储在本地文件系统中，无需网络连接即可使用。

## 功能特性

### ✅ 已实现功能
- **本地 SQLite 数据库**: 使用 `better-sqlite3` 库
- **数据持久化**: 数据存储在 `data/todo.db` 文件中
- **完整的 CRUD 操作**: 支持项目的增删改查
- **任务管理**: 支持任务的增删改查和状态管理
- **批量操作**: 支持批量添加任务
- **数据统计**: 提供详细的统计信息
- **数据导出/导入**: 支持 JSON 格式的数据导出和导入
- **数据库备份**: 支持数据库文件备份
- **数据迁移**: 支持在本地数据库和 Supabase 之间迁移数据

### 🗂️ 数据库结构

#### 项目表 (projects)
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

#### 任务表 (items)
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

## 使用方法

### 1. 启动应用

```bash
npm run dev
```

### 2. 访问数据库管理页面

在浏览器中访问: `http://localhost:3000/database`

### 3. 切换存储类型

在数据库管理页面中，你可以：
- 查看当前存储类型（本地数据库或 Supabase）
- 切换存储类型
- 查看数据库状态和统计信息

### 4. 数据操作

#### 备份数据库
- 点击"备份数据库"按钮
- 数据库文件将备份到 `data/todo-backup-{timestamp}.db`

#### 导出数据
- 点击"导出数据"按钮
- 数据将以 JSON 格式下载到本地

#### 导入数据
- 点击"导入数据"按钮
- 选择之前导出的 JSON 文件
- 数据将被导入到当前数据库

#### 数据迁移
- 如果同时配置了 Supabase，可以在本地数据库和云端数据库之间迁移数据
- 点击相应的迁移按钮即可

## 技术实现

### 核心文件

1. **`src/lib/local-database.ts`** - 本地数据库管理器
   - 使用单例模式
   - 提供完整的数据库操作接口
   - 自动创建数据库文件和表结构

2. **`src/lib/storage-manager.ts`** - 存储管理器工厂
   - 统一管理本地数据库和 Supabase
   - 提供存储类型切换功能
   - 支持数据迁移

3. **`src/app/database/page.tsx`** - 数据库管理界面
   - 提供可视化的数据库管理功能
   - 显示数据库状态和统计信息
   - 支持各种数据操作

### 数据库文件位置

- **主数据库**: `data/todo.db`
- **备份文件**: `data/todo-backup-*.db`
- **测试数据库**: `data/todo-test.db`

## 配置说明

### 环境变量

本地数据库不需要特殊的环境变量配置，但如果你想使用 Supabase，需要设置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 依赖包

确保安装了以下依赖：

```json
{
  "better-sqlite3": "^12.2.0",
  "@types/better-sqlite3": "^7.6.13"
}
```

## 性能优化

### 索引优化
数据库自动创建以下索引以提高查询性能：
- `idx_items_project_id` - 项目ID索引
- `idx_items_status` - 任务状态索引
- `idx_items_created_at` - 创建时间索引
- `idx_items_completed_at` - 完成时间索引

### 事务处理
批量操作使用数据库事务确保数据一致性。

## 故障排除

### 常见问题

1. **数据库文件权限错误**
   ```bash
   # 确保 data 目录存在且有写权限
   mkdir -p data
   chmod 755 data
   ```

2. **better-sqlite3 安装失败**
   ```bash
   # 在 Linux 上可能需要安装系统依赖
   sudo apt-get install python3-dev build-essential
   npm install better-sqlite3
   ```

3. **数据库文件损坏**
   - 删除 `data/todo.db` 文件
   - 重启应用，数据库会自动重新创建

### 调试

运行测试脚本验证数据库功能：

```bash
node test-db-simple.js
```

## 数据安全

### 备份策略
- 定期备份数据库文件
- 使用数据导出功能创建 JSON 备份
- 考虑使用版本控制管理数据库文件

### 数据恢复
- 从备份文件恢复：替换 `data/todo.db` 文件
- 从 JSON 备份恢复：使用导入功能

## 扩展功能

### 未来计划
- [ ] 数据库压缩和优化
- [ ] 自动备份功能
- [ ] 数据加密
- [ ] 多用户支持
- [ ] 数据同步功能

### 自定义扩展
你可以通过修改 `src/lib/local-database.ts` 来添加自定义功能。

## 总结

本地数据库功能为你的 Todo 应用提供了：
- ✅ 离线使用能力
- ✅ 数据持久化
- ✅ 完整的 CRUD 操作
- ✅ 数据备份和恢复
- ✅ 与云端数据库的互操作性

现在你可以完全在本地使用这个 Todo 应用，数据将安全地存储在本地 SQLite 数据库中！
