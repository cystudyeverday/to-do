# Quick Start: Using the Refactored API

## For Developers

### Adding a New Endpoint

Follow these 4 steps:

#### 1. Create DTO (`src/lib/api/dto/your-feature.dto.ts`)

```typescript
export interface CreateFeatureDto {
  name: string;
  value: number;
}

export const createFeatureSchema: ValidationSchema = {
  name: { required: true, type: 'string', minLength: 1 },
  value: { required: true, type: 'number', min: 0 },
};

export function toFeatureResponseDto(feature: Feature): FeatureResponseDto {
  return { id: feature.id, name: feature.name, value: feature.value };
}
```

#### 2. Create Controller (`src/lib/api/controllers/feature.controller.ts`)

```typescript
export async function createFeature(request: NextRequest) {
  const body = await request.json();
  validateRequestBody(body, createFeatureSchema);
  
  const feature = await FeatureService.create(body);
  return createdResponse(toFeatureResponseDto(feature));
}
```

#### 3. Create Route (`src/app/api/features/route.ts`)

```typescript
import { asyncHandler } from '@/lib/api';
import { createFeature } from '@/lib/api/controllers';

export const POST = asyncHandler(createFeature);
```

#### 4. Done! ✅

The endpoint is now available at `POST /api/features` with:
- ✅ Automatic validation
- ✅ Standardized response format
- ✅ Consistent error handling
- ✅ Type safety

## Common Patterns

### Return Success Response

```typescript
return successResponse(data);              // 200 OK
return createdResponse(data);              // 201 Created
return noContentResponse();                // 204 No Content
```

### Throw Errors

```typescript
throw new NotFoundError('Resource not found');      // 404
throw new ValidationError('Invalid data');          // 400
throw new BadRequestError('Bad request');           // 400
throw new UnauthorizedError('Auth required');       // 401
```

### Validate Requests

```typescript
// Validate body
validateRequestBody(body, createItemSchema);

// Parse ID parameter
const id = parseIntParam(params.id, 'Item ID');

// Parse query parameters
const { page, pageSize } = parseQueryParams(searchParams);
```

### Call Services

```typescript
// Simple operation
const item = await ItemRepository.create(data);

// Business logic operation
const result = await createItemService(data);

// Complex operation
const stats = await getStatistics();
```

## Testing Examples

### Unit Test (Service)

```typescript
import { createItem } from '@/lib/services';

describe('createItem', () => {
  it('should auto-classify module from title', async () => {
    const item = await createItem({
      title: 'Fix UI bug',
      type: 'Issue',
      status: 'Not start',
      projectId: 1,
    });
    
    expect(item.module).toBe('Testing');
  });
});
```

### Integration Test (Controller)

```typescript
import { createItem } from '@/lib/api/controllers';

describe('createItem controller', () => {
  it('should validate and create item', async () => {
    const mockRequest = new NextRequest('http://localhost/api/items', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', type: 'Feature', ... }),
    });
    
    const response = await createItem(mockRequest);
    expect(response.status).toBe(201);
  });
});
```

### E2E Test

```typescript
describe('POST /api/items', () => {
  it('should create item via API', async () => {
    const response = await fetch('http://localhost:3000/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test item',
        type: 'Feature',
        status: 'Not start',
        projectId: 1,
      }),
    });
    
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.title).toBe('Test item');
  });
});
```

## Response Format

All endpoints return this format:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Available Endpoints

### Items
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create item(s)
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/items` - Get project items

### Statistics
- `GET /api/statistics` - Get overall statistics
- `GET /api/statistics/trends?days=30` - Get trend data

### Utility
- `GET /api/health` - Health check
- `GET /api/schema` - Database schema

## File Locations

```
src/
├── app/api/              # Routes (thin wrappers)
├── lib/
│   ├── api/
│   │   ├── controllers/  # Request handlers
│   │   ├── dto/          # Data Transfer Objects
│   │   ├── types.ts      # Response types
│   │   ├── errors.ts     # Error classes
│   │   ├── response.ts   # Response utilities
│   │   └── validation.ts # Validation utilities
│   ├── services/         # Business logic
│   └── repositories/     # Data access
```

## Next Steps

1. **Read full documentation**: See `API_DOCUMENTATION.md`
2. **Understand architecture**: See `API_ARCHITECTURE.md`
3. **Review refactoring**: See `REFACTORING_SUMMARY.md`
4. **Start coding**: Follow the patterns above!

## Need Help?

- Check existing controllers for examples
- Read the inline comments and JSDoc
- Review test files for usage patterns
- Refer to the comprehensive documentation

Happy coding! 🚀

