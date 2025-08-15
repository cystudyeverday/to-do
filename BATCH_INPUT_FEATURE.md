# Quick Add 批量输入功能

## 功能概述

Quick Add 模态框现在支持批量输入模式，允许用户一次性添加多个任务。用户可以输入一个列表，系统会自动解析并创建相应的任务。

## 主要特性

### 1. 双模式支持
- **单个任务模式**: 传统的单个任务添加方式
- **批量输入模式**: 新的批量任务添加方式

### 2. 智能解析
- 自动移除数字编号（如 "1.", "2.", "3." 等）
- 支持带编号和不带编号的列表格式
- 自动过滤空行和多余空格
- 实时预览解析结果

### 3. 智能模块分类
- 基于任务内容自动分类到相应模块
- 支持企业级应用程序的特定模式识别
- 包含以下模块分类：
  - **Compliance**: 合规相关功能
  - **User Management**: 用户管理功能
  - **Data Source**: 数据源管理功能
  - **Configuration**: 配置管理功能
  - **Content Management**: 内容管理功能
  - **Frontend**: 前端开发
  - **Backend**: 后端开发
  - **Database**: 数据库
  - **Testing**: 测试
  - **Security**: 安全
  - **DevOps**: 运维
  - **UI/UX**: 用户界面/用户体验
  - **Other**: 其他

## 使用方法

### 1. 打开 Quick Add 模态框
- 在任务管理页面点击 "Quick Add" 按钮

### 2. 选择输入模式
- 点击 "Batch Input" 按钮切换到批量输入模式

### 3. 输入任务列表
支持以下格式：

```
1.re-gen topic
2.compliance matrix query / edit
3.valid option now has a showSendBtn boolean
data source view only
4.user management view only view for non-CMP user
```

或者：

```
re-gen topic
compliance matrix query / edit
valid option now has a showSendBtn boolean
data source view only
user management view only view for non-CMP user
```

### 4. 预览和确认
- 系统会实时显示解析后的任务列表
- 显示任务数量和每个任务的标题
- 点击 "Add X Tasks" 按钮批量添加

## 示例输出

当输入以下内容时：

```
1.re-gen topic
2.compliance matrix query / edit
3.valid option now has a showSendBtn boolean
data source view only
4.user management view only view for non-CMP user
```

系统会创建以下任务：

1. **re-gen topic** → Content Management 模块
2. **compliance matrix query / edit** → Compliance 模块
3. **valid option now has a showSendBtn boolean** → Configuration 模块
4. **data source view only** → Data Source 模块
5. **user management view only view for non-CMP user** → User Management 模块

## 技术实现

### 1. 解析逻辑
```javascript
const parseBatchInput = (input: string): string[] => {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // 移除数字编号和点号
      return line.replace(/^\d+\.\s*/, '');
    });
};
```

### 2. 模块分类逻辑
```javascript
const classifyModule = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  const moduleKeywords = {
    'Compliance': ['compliance', 'matrix', 'query', 'edit', ...],
    'User Management': ['user', 'management', 'role', 'permission', ...],
    'Data Source': ['data source', 'datasource', 'data management', ...],
    // ... 更多模块
  };

  // 根据关键词匹配模块
  for (const [moduleName, keywords] of Object.entries(moduleKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return moduleName;
      }
    }
  }

  return 'Other';
};
```

## 支持的输入格式

### 1. 带编号的列表
```
1. 第一个任务
2. 第二个任务
3. 第三个任务
```

### 2. 不带编号的列表
```
第一个任务
第二个任务
第三个任务
```

### 3. 混合格式
```
1. 带编号的任务
不带编号的任务
3. 另一个带编号的任务
```

### 4. 包含空行的列表
```
1. 第一个任务

2. 第二个任务
   
3. 第三个任务
```

## 优势

1. **提高效率**: 一次性添加多个任务，减少重复操作
2. **智能分类**: 自动识别任务类型并分配到相应模块
3. **灵活格式**: 支持多种输入格式，用户友好
4. **实时预览**: 在提交前可以预览解析结果
5. **错误处理**: 自动过滤无效输入，确保数据质量

## 注意事项

1. 每个任务会使用标题作为描述
2. 所有任务会使用相同的类型和状态设置
3. 模块会根据任务内容自动分类
4. 空行和只包含空格的行会被自动过滤
5. 数字编号会被自动移除，不影响任务内容

## 测试结果

测试显示功能正常工作：

```
输入: 1.re-gen topic
输出: "re-gen topic" → Content Management 模块

输入: 2.compliance matrix query / edit
输出: "compliance matrix query / edit" → Compliance 模块

输入: 3.valid option now has a showSendBtn boolean
输出: "valid option now has a showSendBtn boolean" → Configuration 模块

输入: data source view only
输出: "data source view only" → Data Source 模块

输入: 4.user management view only view for non-CMP user
输出: "user management view only view for non-CMP user" → User Management 模块
```

## 未来改进

1. 支持更复杂的任务描述格式
2. 添加任务优先级设置
3. 支持任务依赖关系
4. 添加批量编辑功能
5. 支持从文件导入任务列表 