# GraphQL Module

This module contains all GraphQL-related code for interacting with the Hasura backend.

## Structure

```
graphql/
├── README.md           # This file
├── types.ts            # GraphQL response type definitions
├── transformers.ts     # Data transformation functions
├── utils.ts            # Utility functions
├── queries.ts          # GraphQL query definitions
└── mutations.ts        # GraphQL mutation definitions
```

## Files

### types.ts
Defines TypeScript types for GraphQL responses from Hasura.

**Exports:**
- `GraphQLProject` - Project response type
- `GraphQLItem` - Item response type
- Query response types (`GetProjectsResponse`, etc.)
- Mutation response types (`CreateProjectResponse`, etc.)

### transformers.ts
Functions to transform data between GraphQL and domain models.

**Exports:**
- `transformProject()` - GraphQL → Domain
- `transformItem()` - GraphQL → Domain
- `buildProjectCreateInput()` - Domain → GraphQL
- `buildItemUpdateSet()` - Domain → GraphQL
- And more...

### utils.ts
Utility functions for working with GraphQL data.

**Exports:**
- `normalizeId()` - Normalize string/number IDs
- `formatTimestamp()` - Format Date to timestamp string
- `parseTimestamp()` - Parse timestamp to Date
- And more...

### queries.ts
GraphQL query definitions using `gql` tag.

**Exports:**
- `GET_PROJECTS`
- `GET_PROJECT_BY_ID`
- `GET_ITEMS`
- `GET_ITEMS_BY_PROJECT`
- `GET_ITEM_BY_ID`

### mutations.ts
GraphQL mutation definitions using `gql` tag.

**Exports:**
- `CREATE_PROJECT`
- `UPDATE_PROJECT`
- `DELETE_PROJECT`
- `CREATE_ITEM`
- `UPDATE_ITEM`
- `DELETE_ITEM`
- `CREATE_ITEMS`

## Usage Example

```typescript
import { transformProject } from '@/lib/graphql/transformers';
import { normalizeId, formatTimestamp } from '@/lib/graphql/utils';
import { GraphQLProject } from '@/lib/graphql/types';

// Transform GraphQL response to domain model
const project = transformProject(graphqlProject);

// Normalize ID
const id = normalizeId('123'); // Returns 123 as number

// Format timestamp
const timestamp = formatTimestamp(new Date());
```

## Design Principles

1. **Separation of Concerns** - Each file has a single responsibility
2. **Type Safety** - All GraphQL responses are strongly typed
3. **Reusability** - Utilities and transformers are reusable across the codebase
4. **Maintainability** - Easy to find and update specific functionality
5. **Testability** - Pure functions make testing straightforward

