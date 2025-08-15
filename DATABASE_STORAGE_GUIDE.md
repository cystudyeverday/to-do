# 数据库存储功能使用指南

## 🎯 功能概述

现在您的 Todo 应用支持使用 SQLite 数据库存储数据，这比 localStorage 更加可靠和安全。数据库存储可以避免数据丢失的问题，并提供更好的数据管理功能。

## ✨ 主要特性

### 1. 数据持久化
- 使用 SQLite 数据库存储，数据不会因浏览器缓存清除而丢失
- 数据库文件保存在 `data/todo.db` 中
- 支持数据备份和恢复

### 2. 数据迁移
- 支持从 localStorage 迁移到数据库
- 一键迁移所有现有数据
- 迁移后数据保持完整

### 3. 数据管理
- 数据导入/导出功能
- 批量操作支持
- 统计信息查询

### 4. 性能优化
- 数据库索引提高查询性能
- 事务支持确保数据一致性
- 连接池管理

## 🚀 快速开始

### 步骤 1: 访问数据库管理器
1. 打开浏览器，访问 `http://localhost:3004/database-manager`
2. 您将看到数据库管理界面

### 步骤 2: 迁移现有数据
1. 点击"迁移到数据库"按钮
2. 系统会自动将 localStorage 中的数据迁移到数据库
3. 迁移完成后，您会看到成功提示

### 步骤 3: 验证数据
1. 检查"数据库数据"部分，确认数据已正确迁移
2. 查看统计信息，确认数据完整性

## 📋 功能详解

### 1. 数据迁移
**功能**: 将 localStorage 中的数据迁移到数据库

**使用场景**:
- 首次使用数据库存储
- 从旧版本升级
- 数据备份恢复

**操作步骤**:
1. 确保 localStorage 中有数据
2. 点击"迁移到数据库"按钮
3. 等待迁移完成
4. 验证迁移结果

### 2. 数据导出
**功能**: 将数据库中的数据导出为 JSON 文件

**使用场景**:
- 数据备份
- 数据分享
- 系统迁移

**操作步骤**:
1. 点击"导出数据库"按钮
2. 选择保存位置
3. 文件会自动下载

### 3. 数据导入
**功能**: 从 JSON 文件导入数据到数据库

**使用场景**:
- 数据恢复
- 数据同步
- 系统初始化

**操作步骤**:
1. 点击"导入数据库"按钮
2. 选择要导入的 JSON 文件
3. 等待导入完成

### 4. 创建示例数据
**功能**: 在数据库中创建示例项目和任务

**使用场景**:
- 系统测试
- 功能演示
- 新用户引导

**操作步骤**:
1. 点击"创建示例数据"按钮
2. 系统会自动创建示例数据
3. 查看创建的数据

### 5. 清空数据库
**功能**: 删除数据库中的所有数据

**使用场景**:
- 系统重置
- 数据清理
- 测试环境准备

**操作步骤**:
1. 点击"清空数据库"按钮
2. 确认操作
3. 等待清空完成

## 🔧 技术实现

### 数据库结构
```sql
-- 项目表
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 任务表
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  projectId TEXT NOT NULL,
  module TEXT DEFAULT 'Other',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  completedAt TEXT,
  FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_items_project_id ON items (projectId);
CREATE INDEX idx_items_status ON items (status);
CREATE INDEX idx_items_type ON items (type);
CREATE INDEX idx_items_module ON items (module);
```

### API 路由
- `GET /api/database/projects` - 获取所有项目
- `POST /api/database/projects` - 创建新项目
- `GET /api/database/items` - 获取所有任务
- `POST /api/database/items` - 创建新任务
- `PUT /api/database/items/[id]` - 更新任务
- `DELETE /api/database/items/[id]` - 删除任务
- `POST /api/database/migrate` - 数据迁移
- `GET /api/database/export` - 数据导出
- `POST /api/database/import` - 数据导入
- `GET /api/database/statistics` - 获取统计信息

## 📊 数据统计

数据库提供以下统计信息：
- **总项目数**: 数据库中的项目总数
- **总任务数**: 数据库中的任务总数
- **已完成任务**: 状态为"Completed"的任务数
- **进行中任务**: 状态为"On progress"的任务数
- **待处理任务**: 状态为"Not start"的任务数

## 🎯 使用场景

### 1. 个人使用
- 数据安全备份
- 跨设备数据同步
- 长期数据存储

### 2. 团队协作
- 数据共享和分发
- 统一数据格式
- 版本控制

### 3. 系统管理
- 数据迁移和升级
- 系统备份和恢复
- 性能监控

## 💡 最佳实践

### 1. 数据备份
- 定期导出数据库数据
- 保存多个备份文件
- 测试备份文件的可用性

### 2. 数据迁移
- 迁移前备份现有数据
- 在测试环境验证迁移
- 迁移后验证数据完整性

### 3. 性能优化
- 定期清理无用数据
- 监控数据库文件大小
- 优化查询性能

## ⚠️ 注意事项

### 1. 数据安全
- 数据库文件包含敏感信息，请妥善保管
- 定期备份重要数据
- 不要删除 `data/todo.db` 文件

### 2. 兼容性
- 数据库文件与特定版本兼容
- 升级时注意数据格式变化
- 保持备份文件的版本记录

### 3. 性能考虑
- 大量数据时注意查询性能
- 定期优化数据库结构
- 监控磁盘空间使用

## 🔮 未来扩展

### 1. 高级功能
- 数据加密存储
- 多用户支持
- 实时数据同步

### 2. 管理功能
- 数据版本控制
- 自动备份
- 数据恢复工具

### 3. 集成功能
- 云存储集成
- 第三方服务集成
- API 接口扩展

## ✅ 总结

数据库存储功能为您的 Todo 应用提供了：

- **数据安全**: 避免浏览器缓存清除导致的数据丢失
- **数据管理**: 完整的导入/导出和迁移功能
- **性能优化**: 数据库索引和事务支持
- **扩展性**: 支持大量数据和复杂查询
- **可靠性**: 数据持久化和备份功能

通过使用数据库存储，您的数据将更加安全和可靠，不再担心数据丢失的问题！ 