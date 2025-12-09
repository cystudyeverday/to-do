# API Folder Structure

This document describes the modern, business-oriented structure of the API layer.

## Directory Structure

```
src/
├── app/api/                      # Next.js API Routes (thin layer)
│   ├── items/                    # Item endpoints
│   │   ├── route.ts             # GET /api/items, POST /api/items
│   │   └── [id]/
│   │       └── route.ts         # GET/PUT/DELETE /api/items/:id
│   │
│   ├── projects/                # Project endpoints
│   │   ├── route.ts             # GET /api/projects, POST /api/projects
│   │   └── [id]/
│   │       ├── route.ts         # GET/PUT/DELETE /api/projects/:id
│   │       └── items/
│   │           └── route.ts     # GET /api/projects/:id/items
│   │
│   ├── statistics/              # Statistics endpoints
│   │   └── route.ts             # GET /api/statistics
│   │
│   ├── health/                  # Health check
│   │   └── route.ts             # GET /api/health
│   │
│   └── schema/                  # Database schema info
│       └── route.ts             # GET /api/schema
│
└── lib/                          # Core library code
    ├── api/                      # API utilities and infrastructure
    │   ├── types.ts             # API response types
    │   ├── errors.ts            # Custom error classes
    │   ├── response.ts          # Response formatters
    │   ├── validation.ts        # Request validation utilities
    │   ├── index.ts             # Barrel export
    │   │
    │   ├── dto/                 # Data Transfer Objects
    │   │   ├── item.dto.ts     # Item DTOs and schemas
    │   │   ├── project.dto.ts  # Project DTOs and schemas
    │   │   └── index.ts
    │   │
    │   └── controllers/         # Controllers (business orchestration)
    │       ├── item.controller.ts
    │       ├── project.controller.ts
    │       ├── statistics.controller.ts
    │       └── index.ts
    │
    ├── services/                # Business logic layer
    │   ├── item.service.ts     # Item business logic
    │   ├── project.service.ts  # Project business logic
    │   ├── statistics.service.ts # Statistics business logic
    │   └── index.ts
    │
    └── repositories/            # Data access layer
        ├── item.repository.ts  # Item data access
        ├── project.repository.ts # Project data access
        └── index.ts
```

## Architecture Layers

### 1. API Routes (`app/api/`)

**Purpose:** Thin routing layer that delegates to controllers

**Responsibilities:**
- Define HTTP route handlers (GET, POST, PUT, DELETE)
- Minimal logic - just call controllers
- Use `asyncHandler` for error handling

**Example:**

```typescript
import { asyncHandler } from '@/lib/api';
import { getAllItems, createItem } from '@/lib/api/controllers';

export const GET = asyncHandler(async (request) => {
  return getAllItems(request);
});

export const POST = asyncHandler(async (request) => {
  return createItem(request);
});
```

### 2. Controllers (`lib/api/controllers/`)

**Purpose:** Handle HTTP requests and orchestrate business logic

**Responsibilities:**
- Parse and validate request data
- Call service layer for business logic
- Format responses using response utilities
- Handle errors and return appropriate HTTP status codes

**Example:**

```typescript
export async function createItem(request: NextRequest) {
  const body = await request.json();
  validateRequestBody(body, createItemSchema);
  
  const dto = body as CreateItemDto;
  const itemData = fromCreateItemDto(dto);
  const item = await createItemService(itemData);
  
  return createdResponse(toItemResponseDto(item));
}
```

### 3. DTOs (`lib/api/dto/`)

**Purpose:** Define request/response data structures

**Responsibilities:**
- Request DTOs (CreateItemDto, UpdateItemDto, etc.)
- Response DTOs (ItemResponseDto, etc.)
- Validation schemas
- Transformation functions (to/from domain models)

**Example:**

```typescript
export interface CreateItemDto {
  title: string;
  description?: string;
  type: 'Feature' | 'Issue';
  status: TodoItem['status'];
  projectId: number;
  module?: string;
}

export const createItemSchema: ValidationSchema = {
  title: { required: true, type: 'string', minLength: 1, maxLength: 200 },
  // ... more validations
};
```

### 4. Services (`lib/services/`)

**Purpose:** Implement business logic and rules

**Responsibilities:**
- Business validations
- Complex operations spanning multiple repositories
- Business rule enforcement
- Transactions and data consistency

**Example:**

```typescript
export async function createItem(
  itemData: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TodoItem> {
  validateItemData(itemData);
  
  const project = await ProjectRepository.getById(itemData.projectId);
  if (!project) throw new Error('Project not found');
  
  if (!itemData.module || itemData.module === 'Other') {
    itemData.module = autoClassifyModule(itemData.title);
  }
  
  return ItemRepository.create(itemData);
}
```

### 5. Repositories (`lib/repositories/`)

**Purpose:** Data access and GraphQL operations

**Responsibilities:**
- Execute GraphQL queries and mutations
- Transform GraphQL responses to domain models
- Handle data access errors
- Provide clean data access API

**Example:**

```typescript
export class ItemRepository {
  static async create(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    const { data } = await apolloClient.mutate<CreateItemResponse>({
      mutation: CREATE_ITEM,
      variables: buildItemCreateInput(item),
    });
    
    if (!data?.insert_items_one) {
      throw new Error('Failed to create item');
    }
    
    return transformItem(data.insert_items_one);
  }
}
```

## API Utilities

### Response Utilities (`lib/api/response.ts`)

Standardized response formatting:

```typescript
// Success response
return successResponse(data);

// Created response (201)
return createdResponse(data);

// No content (204)
return noContentResponse();

// Error response
return errorResponse(error);

// Async error handler wrapper
export const GET = asyncHandler(async (request) => {
  // ... handler logic
  // Errors are automatically caught and formatted
});
```

### Error Classes (`lib/api/errors.ts`)

Custom error classes with HTTP status codes:

```typescript
throw new NotFoundError('Item not found');
throw new ValidationError('Invalid data', validationErrors);
throw new BadRequestError('Missing required field');
throw new UnauthorizedError('Authentication required');
```

### Validation (`lib/api/validation.ts`)

Schema-based request validation:

```typescript
validateRequestBody(body, createItemSchema);

const itemId = parseIntParam(params.id, 'Item ID');

const { page, pageSize } = parseQueryParams(searchParams);
```

## Data Flow

### Request Flow

```
HTTP Request
  ↓
API Route (route.ts)
  ↓
Controller
  ↓ (validates request)
  ↓ (calls service)
Service
  ↓ (business logic)
  ↓ (calls repository)
Repository
  ↓ (GraphQL query)
Database
```

### Response Flow

```
Database
  ↓ (GraphQL response)
Repository
  ↓ (transforms to domain model)
Service
  ↓ (returns processed data)
Controller
  ↓ (transforms to DTO)
  ↓ (formats response)
API Route
  ↓
HTTP Response
```

## Benefits of This Structure

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Testability**: Easy to test each layer in isolation
3. **Maintainability**: Changes are localized and predictable
4. **Scalability**: Easy to add new features following established patterns
5. **Type Safety**: Full TypeScript coverage with DTOs and domain models
6. **Code Reusability**: Services and repositories can be reused across endpoints
7. **Consistent API**: Standardized response format and error handling

## Adding New Endpoints

To add a new endpoint, follow these steps:

1. **Create DTO** (`lib/api/dto/`)
   - Define request/response types
   - Create validation schemas
   - Add transformation functions

2. **Create Service** (if needed, `lib/services/`)
   - Implement business logic
   - Add validation rules

3. **Create Controller** (`lib/api/controllers/`)
   - Parse requests
   - Call services
   - Format responses

4. **Create Route** (`app/api/`)
   - Define HTTP handlers
   - Use asyncHandler wrapper

## Testing Strategy

- **Unit Tests**: Test services and utilities with mocked repositories
- **Integration Tests**: Test controllers with real services and mocked repositories
- **E2E Tests**: Test full API endpoints with test database

## Best Practices

1. **Keep routes thin**: Just delegate to controllers
2. **Validate early**: Validate requests in controllers
3. **Use DTOs**: Always transform between layers
4. **Handle errors**: Use custom error classes
5. **Log appropriately**: Log errors and important events
6. **Document**: Keep API documentation up to date
7. **Type everything**: Use TypeScript to its fullest

## Migration Notes

The old API structure mixed concerns - routes handled validation, business logic, and data access. The new structure separates these concerns for better maintainability and scalability.

**Old pattern:**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validation logic here
  // Business logic here
  // GraphQL query here
  // Response formatting here
}
```

**New pattern:**
```typescript
// Route (thin)
export const POST = asyncHandler(createItem);

// Controller (orchestration)
export async function createItem(request: NextRequest) {
  const body = await request.json();
  validateRequestBody(body, createItemSchema);
  const dto = body as CreateItemDto;
  const item = await createItemService(fromCreateItemDto(dto));
  return createdResponse(toItemResponseDto(item));
}

// Service (business logic)
export async function createItemService(itemData) {
  validateItemData(itemData);
  // Business logic
  return ItemRepository.create(itemData);
}

// Repository (data access)
static async create(item) {
  // GraphQL query
  return transformItem(data);
}
```

