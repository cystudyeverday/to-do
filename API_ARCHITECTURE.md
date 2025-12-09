# API Architecture Visualization

## Layered Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                       CLIENT / FRONTEND                        │
│                    (React Components, UI)                      │
└───────────────────────────────┬───────────────────────────────┘
                                │ HTTP Request
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                      API ROUTES LAYER                          │
│                  (Next.js Route Handlers)                      │
│                                                                 │
│  • /api/items/route.ts                                         │
│  • /api/items/[id]/route.ts                                    │
│  • /api/projects/route.ts                                      │
│  • /api/statistics/route.ts                                    │
│                                                                 │
│  Responsibilities:                                             │
│  - Define HTTP endpoints                                       │
│  - Delegate to controllers                                     │
│  - Wrap with asyncHandler                                      │
└───────────────────────────────┬───────────────────────────────┘
                                │ asyncHandler(controller)
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    CONTROLLERS LAYER                           │
│                (API Request Orchestration)                     │
│                                                                 │
│  • item.controller.ts                                          │
│  • project.controller.ts                                       │
│  • statistics.controller.ts                                    │
│                                                                 │
│  Responsibilities:                                             │
│  - Parse request (body, params, query)                         │
│  - Validate using DTOs & schemas                               │
│  - Call services for business logic                            │
│  - Transform responses using DTOs                              │
│  - Return formatted responses                                  │
└───────────────────────────────┬───────────────────────────────┘
                                │ Call services
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     SERVICES LAYER                             │
│                   (Business Logic)                             │
│                                                                 │
│  • item.service.ts                                             │
│  • project.service.ts                                          │
│  • statistics.service.ts                                       │
│                                                                 │
│  Responsibilities:                                             │
│  - Implement business rules                                    │
│  - Complex operations & validations                            │
│  - Coordinate multiple repositories                            │
│  - Transaction management                                      │
└───────────────────────────────┬───────────────────────────────┘
                                │ Call repositories
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                   REPOSITORIES LAYER                           │
│                    (Data Access)                               │
│                                                                 │
│  • item.repository.ts                                          │
│  • project.repository.ts                                       │
│                                                                 │
│  Responsibilities:                                             │
│  - Execute GraphQL queries/mutations                           │
│  - Transform GraphQL ↔ Domain models                           │
│  - Handle data access errors                                   │
│  - Abstract data source details                                │
└───────────────────────────────┬───────────────────────────────┘
                                │ GraphQL operations
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                │
│               (Hasura GraphQL + PostgreSQL)                    │
│                                                                 │
│  • GraphQL API (Hasura)                                        │
│  • PostgreSQL Database                                         │
│  • Data validation & constraints                               │
└───────────────────────────────────────────────────────────────┘
```

## Request Flow Example

### Creating an Item: POST /api/items

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                            │
│    POST /api/items                                           │
│    { title: "Fix bug", type: "Issue", projectId: 1 }        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ROUTE (route.ts)                                          │
│    export const POST = asyncHandler(createItem);             │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CONTROLLER (item.controller.ts)                           │
│    • Parse request body                                      │
│    • validateRequestBody(body, createItemSchema)             │
│    • Transform: fromCreateItemDto(dto)                       │
│    • Call service: await createItemService(itemData)         │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SERVICE (item.service.ts)                                 │
│    • Validate business rules                                 │
│    • Check if project exists                                 │
│    • Auto-classify module from title                         │
│    • Call repository: ItemRepository.create(itemData)        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. REPOSITORY (item.repository.ts)                           │
│    • Build GraphQL mutation variables                        │
│    • Execute: apolloClient.mutate(CREATE_ITEM)               │
│    • Transform GraphQL response to domain model              │
│    • Return: TodoItem                                        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. DATABASE (Hasura + PostgreSQL)                            │
│    • Execute INSERT query                                    │
│    • Apply constraints & validations                         │
│    • Return created record                                   │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. RESPONSE FLOW (back up the chain)                         │
│    Repository → Service → Controller                         │
│    • Controller transforms to DTO                            │
│    • Format response: createdResponse(toItemResponseDto())   │
│    • Return HTTP 201 with standardized format                │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. CLIENT RESPONSE                                           │
│    {                                                         │
│      "success": true,                                        │
│      "data": {                                               │
│        "id": 123,                                            │
│        "title": "Fix bug",                                   │
│        "type": "Issue",                                      │
│        "module": "Testing", // auto-classified               │
│        ...                                                   │
│      },                                                      │
│      "meta": { "timestamp": "..." }                          │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Error occurs at any layer                                   │
│ throw new NotFoundError("Item not found");                  │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Caught by asyncHandler (in route)                           │
│ • Identifies error type                                     │
│ • Formats error response                                    │
│ • Logs error details                                        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ CLIENT ERROR RESPONSE                                        │
│ {                                                            │
│   "success": false,                                          │
│   "error": {                                                 │
│     "code": "NOT_FOUND",                                     │
│     "message": "Item not found",                             │
│     "details": { ... }                                       │
│   },                                                         │
│   "meta": { "timestamp": "..." }                             │
│ }                                                            │
│ HTTP Status: 404                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Transformation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT DATA (JSON)                         │
│  { title: "Task", type: "Feature", projectId: 1 }           │
└────────────────────────┬─────────────────────────────────────┘
                         ▼ Parse & Validate
┌──────────────────────────────────────────────────────────────┐
│                    CreateItemDto (DTO)                        │
│  interface CreateItemDto {                                   │
│    title: string;                                            │
│    type: 'Feature' | 'Issue';                                │
│    projectId: number;                                        │
│  }                                                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼ fromCreateItemDto()
┌──────────────────────────────────────────────────────────────┐
│                 Domain Model (TodoItem)                       │
│  interface TodoItem {                                        │
│    id: number;                                               │
│    title: string;                                            │
│    type: 'Feature' | 'Issue';                                │
│    projectId: number;                                        │
│    createdAt: Date;                                          │
│  }                                                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼ buildItemCreateInput()
┌──────────────────────────────────────────────────────────────┐
│              GraphQL Variables (snake_case)                   │
│  {                                                            │
│    title: "Task",                                            │
│    type: "Feature",                                          │
│    project_id: 1                                             │
│  }                                                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼ GraphQL Mutation
┌──────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                       │
│  INSERT INTO items (title, type, project_id, ...)           │
│  RETURNING *                                                 │
└────────────────────────┬─────────────────────────────────────┘
                         ▼ GraphQL Response
┌──────────────────────────────────────────────────────────────┐
│              GraphQL Response (snake_case)                    │
│  {                                                            │
│    id: 123,                                                  │
│    title: "Task",                                            │
│    project_id: 1,                                            │
│    created_at: "2024-01-01T00:00:00Z"                        │
│  }                                                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼ transformItem()
┌──────────────────────────────────────────────────────────────┐
│                 Domain Model (TodoItem)                       │
│  {                                                            │
│    id: 123,                                                  │
│    title: "Task",                                            │
│    projectId: 1,                                             │
│    createdAt: Date object                                    │
│  }                                                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼ toItemResponseDto()
┌──────────────────────────────────────────────────────────────┐
│                ItemResponseDto (API Response)                 │
│  {                                                            │
│    id: 123,                                                  │
│    title: "Task",                                            │
│    projectId: 1,                                             │
│    createdAt: "2024-01-01T00:00:00.000Z" // ISO string       │
│  }                                                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼ successResponse()
┌──────────────────────────────────────────────────────────────┐
│                  FINAL API RESPONSE                           │
│  {                                                            │
│    "success": true,                                          │
│    "data": { ... ItemResponseDto ... },                      │
│    "meta": { "timestamp": "..." }                            │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
```

## Dependency Injection Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     HIGH LEVEL                               │
│                   (Controllers)                              │
│                                                              │
│  Depend on abstractions (services), not implementations      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MIDDLE LEVEL                              │
│                    (Services)                                │
│                                                              │
│  Depend on repositories, not data sources                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     LOW LEVEL                                │
│                  (Repositories)                              │
│                                                              │
│  Depend on GraphQL client, can be swapped                   │
└─────────────────────────────────────────────────────────────┘

Benefits:
• Easy to test with mocks
• Easy to swap implementations
• Loose coupling between layers
```

## File Organization Map

```
my-todo/
├── src/
│   ├── app/api/                    # Thin route layer
│   │   ├── items/
│   │   │   ├── route.ts           # → item.controller
│   │   │   └── [id]/route.ts      # → item.controller
│   │   ├── projects/
│   │   │   ├── route.ts           # → project.controller
│   │   │   └── [id]/
│   │   │       ├── route.ts       # → project.controller
│   │   │       └── items/route.ts # → project.controller
│   │   ├── statistics/route.ts    # → statistics.controller
│   │   ├── health/route.ts        # → health check
│   │   └── schema/route.ts        # → schema info
│   │
│   └── lib/
│       ├── api/                    # API infrastructure
│       │   ├── types.ts           # Response types
│       │   ├── errors.ts          # Error classes
│       │   ├── response.ts        # Response utilities
│       │   ├── validation.ts      # Validation utilities
│       │   ├── dto/               # Data Transfer Objects
│       │   │   ├── item.dto.ts
│       │   │   └── project.dto.ts
│       │   └── controllers/       # Request handlers
│       │       ├── item.controller.ts
│       │       ├── project.controller.ts
│       │       └── statistics.controller.ts
│       │
│       ├── services/              # Business logic
│       │   ├── item.service.ts
│       │   ├── project.service.ts
│       │   └── statistics.service.ts
│       │
│       └── repositories/          # Data access
│           ├── item.repository.ts
│           └── project.repository.ts
│
├── API_DOCUMENTATION.md           # Public API docs
├── API_ARCHITECTURE.md            # This file
└── REFACTORING_SUMMARY.md         # Refactoring overview
```

## Testing Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        E2E TESTS                              │
│  Test complete API endpoints with real database              │
│                                                               │
│  fetch('/api/items', { method: 'POST', ... })                │
└────────────────────────┬──────────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                   INTEGRATION TESTS                           │
│  Test controllers with real services, mocked repos            │
│                                                               │
│  createItem(mockRequest) with MockRepository                 │
└────────────────────────┬──────────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                      UNIT TESTS                               │
│  Test services in isolation with mocked dependencies          │
│                                                               │
│  createItemService(data) with jest.fn() mocks                │
└────────────────────────┬──────────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                   UTILITY TESTS                               │
│  Test pure functions (transformers, validators)               │
│                                                               │
│  toItemResponseDto(item), validate(data, schema)             │
└───────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Single Responsibility
Each layer has ONE job:
- Routes: HTTP routing
- Controllers: Request orchestration
- Services: Business logic
- Repositories: Data access

### 2. Dependency Inversion
High-level modules don't depend on low-level modules. Both depend on abstractions.

### 3. Open/Closed
Open for extension, closed for modification. Add new features without changing existing code.

### 4. DRY (Don't Repeat Yourself)
Shared utilities, transformers, and validators eliminate duplication.

### 5. Type Safety
Full TypeScript coverage ensures reliability and catches errors at compile time.

## Summary

This architecture provides:
- ✅ Clear separation of concerns
- ✅ High testability
- ✅ Easy to maintain and extend
- ✅ Professional error handling
- ✅ Consistent API responses
- ✅ Type-safe throughout
- ✅ Scalable for growth

