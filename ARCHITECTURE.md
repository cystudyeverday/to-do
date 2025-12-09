# Architecture Documentation

This document describes the architecture and structure of the My Todo application.

## Overview

My Todo is a Next.js application with a GraphQL backend (Hasura) for data persistence. The application follows a layered architecture with clear separation of concerns.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (React Components, Pages, UI)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Application/Orchestration          │
│  (Storage Manager)                      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Business Logic Layer            │
│  (Services - NEW!)                      │
│  - ProjectService                       │
│  - ItemService                          │
│  - StatisticsService                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Access Layer               │
│  (Repositories, GraphQL Client)         │
│  - ProjectRepository                    │
│  - ItemRepository                       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Backend Layer                   │
│  (Hasura GraphQL API, PostgreSQL)       │
└─────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── items/            # Items page
│   └── statistics/       # Statistics page
│
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── batch-manager.tsx
│   ├── navigation.tsx
│   ├── project-modal.tsx
│   └── ...
│
├── lib/                   # Core library code
│   ├── graphql/          # GraphQL module
│   │   ├── types.ts      # GraphQL types
│   │   ├── transformers.ts  # Data transformers
│   │   ├── utils.ts      # Utility functions
│   │   ├── queries.ts    # GraphQL queries
│   │   └── mutations.ts  # GraphQL mutations
│   │
│   ├── services/         # Business logic layer (NEW!)
│   │   ├── project.service.ts  # Project business logic
│   │   ├── item.service.ts     # Item business logic
│   │   └── index.ts
│   │
│   ├── repositories/     # Data access repositories
│   │   ├── project.repository.ts
│   │   ├── item.repository.ts
│   │   └── index.ts
│   │
│   ├── graphql-storage.ts   # Storage manager
│   ├── storage.ts           # Storage interface
│   ├── apollo-client.ts     # Apollo client setup
│   └── utils.ts             # General utilities
│
└── types/                 # TypeScript type definitions
    └── index.ts
```

## Module Documentation

### GraphQL Module (`src/lib/graphql/`)

Handles all GraphQL-related operations.

**Files:**
- `types.ts` - GraphQL response type definitions
- `transformers.ts` - Data transformation functions (GraphQL ↔ Domain)
- `utils.ts` - Utility functions (ID normalization, date formatting)
- `queries.ts` - GraphQL query definitions
- `mutations.ts` - GraphQL mutation definitions

**Responsibilities:**
- Define GraphQL types
- Transform data between GraphQL and domain models
- Provide utilities for GraphQL operations

### Repositories (`src/lib/repositories/`)

Implements the Repository pattern for data access.

**Files:**
- `project.repository.ts` - Project CRUD operations
- `item.repository.ts` - Item CRUD operations
- `index.ts` - Barrel export

**Responsibilities:**
- Execute GraphQL queries/mutations
- Handle errors and logging
- Provide clean API for data access
- Abstract GraphQL details from business logic

### Storage Manager (`src/lib/graphql-storage.ts`)

Orchestrates data operations and provides high-level APIs.

**Responsibilities:**
- Delegate to repositories for CRUD operations
- Implement complex business operations (archive, export, import)
- Provide unified interface for data access
- Handle cross-entity operations

## Data Flow

### Reading Data (Query)

```
Component
  ↓
Storage Manager
  ↓
Repository
  ↓
GraphQL Query → Apollo Client → Hasura
  ↓
GraphQL Response
  ↓
Transformer (GraphQL → Domain)
  ↓
Domain Model
  ↓
Component
```

### Writing Data (Mutation)

```
Component
  ↓
Storage Manager
  ↓
Repository
  ↓
Transformer (Domain → GraphQL)
  ↓
GraphQL Mutation → Apollo Client → Hasura
  ↓
GraphQL Response
  ↓
Transformer (GraphQL → Domain)
  ↓
Domain Model
  ↓
Component
```

## Design Patterns

### Repository Pattern
- Encapsulates data access logic
- Provides clean interface for CRUD operations
- Easy to test and mock

### Transformer Pattern
- Separates data transformation logic
- Converts between GraphQL and domain models
- Reusable across the application

### Factory Pattern
- Used in transformers for object creation
- Centralized object construction logic

### Singleton Pattern
- Apollo client instance
- Storage manager (static methods)

## Key Design Principles

1. **Separation of Concerns**
   - Each layer has clear responsibilities
   - No mixing of concerns across layers

2. **Single Responsibility**
   - Each module/class handles one thing
   - Easy to understand and maintain

3. **DRY (Don't Repeat Yourself)**
   - Shared utilities and transformers
   - Reusable components

4. **Type Safety**
   - Full TypeScript coverage
   - Strongly typed GraphQL responses

5. **Testability**
   - Pure functions where possible
   - Easy to mock repositories
   - Clear dependencies

6. **Scalability**
   - Modular architecture
   - Easy to add new entities/features
   - Clear patterns to follow

## Adding New Features

### Adding a New Entity

1. **Define Domain Type** (`src/types/index.ts`)
```typescript
export interface NewEntity {
  id: number;
  name: string;
  // ... more fields
}
```

2. **Add GraphQL Types** (`src/lib/graphql/types.ts`)
```typescript
export type GraphQLNewEntity = {
  id: number;
  name: string;
  // ... GraphQL fields
};
```

3. **Create Transformer** (`src/lib/graphql/transformers.ts`)
```typescript
export function transformNewEntity(entity: GraphQLNewEntity): NewEntity {
  // Transform logic
}
```

4. **Add Queries/Mutations** (`src/lib/graphql/`)
```typescript
export const GET_NEW_ENTITIES = gql`...`;
export const CREATE_NEW_ENTITY = gql`...`;
```

5. **Create Repository** (`src/lib/repositories/new-entity.repository.ts`)
```typescript
export class NewEntityRepository {
  static async getAll(): Promise<NewEntity[]> { ... }
  // ... CRUD methods
}
```

6. **Update Storage Manager** (`src/lib/graphql-storage.ts`)
```typescript
static async getNewEntities(): Promise<NewEntity[]> {
  return NewEntityRepository.getAll();
}
```

7. **Use in Components**
```typescript
import { StorageManager } from '@/lib/storage';

const entities = await StorageManager.getNewEntities();
```

## Testing Strategy

### Unit Tests
- Test transformers independently
- Test utility functions
- Mock repositories for business logic tests

### Integration Tests
- Test repository operations with test database
- Test full data flow

### E2E Tests
- Test complete user flows
- Verify UI interactions

## Performance Considerations

1. **Caching**
   - Apollo client cache for GraphQL
   - Consider implementing Redis for API routes

2. **Batch Operations**
   - Use batch mutations for multiple items
   - Reduce round trips to backend

3. **Query Optimization**
   - Fetch only needed fields
   - Use indexes on database

4. **Code Splitting**
   - Next.js automatic code splitting
   - Dynamic imports for heavy components

## Security

1. **Authentication**
   - Hasura JWT authentication
   - Secure API routes

2. **Authorization**
   - Role-based access control in Hasura
   - Frontend permission checks

3. **Input Validation**
   - Validate in components
   - Backend validation in Hasura

## Future Enhancements

1. **Service Layer**
   - Add business logic layer between storage and components
   - Complex operations and validations

2. **Event System**
   - Implement pub/sub for real-time updates
   - WebSocket support

3. **Caching Strategy**
   - Implement proper cache invalidation
   - Optimistic UI updates

4. **Error Handling**
   - Global error boundary
   - Centralized error logging

5. **Monitoring**
   - Add application monitoring
   - Performance tracking
   - Error tracking (Sentry, etc.)

