# Repositories

This directory contains repository classes that handle data access operations using GraphQL.

## Structure

```
repositories/
├── README.md                 # This file
├── index.ts                  # Export barrel
├── project.repository.ts     # Project data operations
└── item.repository.ts        # Item data operations
```

## Repository Pattern

The repository pattern provides:
- **Abstraction** - Hides implementation details from consumers
- **Centralization** - Single place for data access logic
- **Testability** - Easy to mock for unit tests
- **Maintainability** - Changes to data access don't affect business logic

## Files

### project.repository.ts

Handles all project-related CRUD operations.

**Methods:**
- `getAll()` - Fetch all projects
- `getById(id)` - Fetch single project
- `create(project)` - Create new project
- `update(id, updates)` - Update project
- `delete(id)` - Delete project

**Usage:**
```typescript
import { ProjectRepository } from '@/lib/repositories';

// Get all projects
const projects = await ProjectRepository.getAll();

// Create project
const newProject = await ProjectRepository.create({
  name: 'My Project',
  description: 'Project description'
});

// Update project
const updated = await ProjectRepository.update(1, {
  name: 'Updated Name'
});

// Delete project
const success = await ProjectRepository.delete(1);
```

### item.repository.ts

Handles all item-related CRUD operations.

**Methods:**
- `getAll()` - Fetch all items
- `getByProject(projectId)` - Fetch items by project
- `getById(id)` - Fetch single item
- `create(item)` - Create new item
- `update(id, updates)` - Update item
- `delete(id)` - Delete item
- `createBatch(items)` - Create multiple items
- `getByStatus(status)` - Fetch items by status
- `getCompletedInRange(start, end)` - Fetch completed items in date range

**Usage:**
```typescript
import { ItemRepository } from '@/lib/repositories';

// Get all items
const items = await ItemRepository.getAll();

// Get items by project
const projectItems = await ItemRepository.getByProject(1);

// Create item
const newItem = await ItemRepository.create({
  title: 'Task title',
  description: 'Task description',
  type: 'Feature',
  status: 'Not start',
  projectId: 1,
  module: 'Backend'
});

// Batch create
const newItems = await ItemRepository.createBatch([
  { title: 'Task 1', /* ... */ },
  { title: 'Task 2', /* ... */ }
]);

// Get by status
const completedItems = await ItemRepository.getByStatus('Completed');
```

## Adding New Repositories

To add a new repository:

1. Create a new file: `entity.repository.ts`
2. Define the repository class:
```typescript
export class EntityRepository {
  static async getAll(): Promise<Entity[]> {
    // Implementation
  }
  
  static async getById(id: number): Promise<Entity | null> {
    // Implementation
  }
  
  // ... more methods
}
```

3. Export from `index.ts`:
```typescript
export { EntityRepository } from './entity.repository';
```

4. Use in storage manager:
```typescript
import { EntityRepository } from './repositories';

class StorageManager {
  static async getEntities() {
    return EntityRepository.getAll();
  }
}
```

## Design Principles

1. **Single Responsibility** - Each repository handles one entity type
2. **Static Methods** - No need to instantiate repositories
3. **Error Handling** - All methods handle errors gracefully
4. **Logging** - Errors are logged with context
5. **Type Safety** - Full TypeScript support
6. **Consistency** - All repositories follow the same patterns

