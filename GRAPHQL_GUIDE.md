# GraphQL Learning Guide

A practical guide to GraphQL syntax and concepts, with examples from this project.

## Table of Contents
1. [GraphQL Basics](#graphql-basics)
2. [Queries](#queries)
3. [Mutations](#mutations)
4. [Variables](#variables)
5. [Fragments](#fragments)
6. [Aliases](#aliases)
7. [Directives](#directives)
8. [Hasura-Specific Features](#hasura-specific-features)
9. [Best Practices](#best-practices)

---

## GraphQL Basics

### What is GraphQL?

GraphQL is a **query language** for APIs. Unlike REST, you specify exactly what data you want.

**REST API:**
```
GET /api/projects/1          → Returns everything about project 1
GET /api/projects/1/items    → Separate request for items
```

**GraphQL:**
```graphql
query {
  projects_by_pk(id: 1) {
    id
    name
    items {              # Get related items in same request!
      id
      title
    }
  }
}
```

### Core Concepts

1. **Schema** - Defines available data types and operations
2. **Query** - Read data (like GET)
3. **Mutation** - Write data (like POST/PUT/DELETE)
4. **Subscription** - Real-time updates (WebSocket)
5. **Types** - Data structure definitions

---

## Queries

Queries are for **reading data**.

### Basic Query

```graphql
# Get all projects
query {
  projects {
    id
    name
    description
  }
}
```

**Response:**
```json
{
  "data": {
    "projects": [
      { "id": 1, "name": "Project A", "description": "Description A" },
      { "id": 2, "name": "Project B", "description": "Description B" }
    ]
  }
}
```

### Query with Arguments

```graphql
# Get specific project by ID
query {
  projects_by_pk(id: 1) {
    id
    name
    description
  }
}
```

### Nested Queries (Relations)

```graphql
# Get project with its items
query {
  projects_by_pk(id: 1) {
    id
    name
    items {              # Nested relation
      id
      title
      status
    }
  }
}
```

### Where Clause (Filtering)

```graphql
# Get items with specific status
query {
  items(where: { status: { _eq: "Completed" } }) {
    id
    title
    status
  }
}
```

**Hasura Operators:**
- `_eq` - equals
- `_neq` - not equals
- `_gt` - greater than
- `_gte` - greater than or equal
- `_lt` - less than
- `_lte` - less than or equal
- `_in` - in array
- `_nin` - not in array
- `_like` - SQL LIKE
- `_ilike` - case-insensitive LIKE

### Order By (Sorting)

```graphql
query {
  items(order_by: { created_at: desc }) {
    id
    title
    created_at
  }
}
```

### Limit & Offset (Pagination)

```graphql
query {
  items(limit: 10, offset: 0) {
    id
    title
  }
}
```

### Complex Query Example

```graphql
# Get completed items from last week, sorted by completion date
query {
  items(
    where: {
      status: { _eq: "Completed" }
      completed_at: { _gte: "2024-11-28" }
    }
    order_by: { completed_at: desc }
    limit: 20
  ) {
    id
    title
    completed_at
    project {
      id
      name
    }
  }
}
```

---

## Mutations

Mutations are for **writing data** (create, update, delete).

### Insert One

```graphql
mutation {
  insert_projects_one(object: {
    name: "New Project"
    description: "Project description"
  }) {
    id
    name
    created_at
  }
}
```

**In our project:**
```graphql
mutation CreateProject($name: String!, $description: String) {
  insert_projects_one(object: {
    name: $name
    description: $description
  }) {
    id
    name
    description
    created_at
    updated_at
  }
}
```

### Insert Multiple

```graphql
mutation {
  insert_items(objects: [
    { title: "Task 1", project_id: 1, status: "Not start" }
    { title: "Task 2", project_id: 1, status: "Not start" }
  ]) {
    returning {
      id
      title
    }
  }
}
```

### Update by Primary Key

```graphql
mutation {
  update_projects_by_pk(
    pk_columns: { id: 1 }
    _set: {
      name: "Updated Name"
      description: "Updated description"
    }
  ) {
    id
    name
    updated_at
  }
}
```

**In our project:**
```graphql
mutation UpdateProject($id: Int!, $name: String, $description: String) {
  update_projects_by_pk(
    pk_columns: { id: $id }
    _set: {
      name: $name
      description: $description
    }
  ) {
    id
    name
    description
    updated_at
  }
}
```

### Update Multiple (Batch)

```graphql
mutation {
  update_items(
    where: { project_id: { _eq: 1 } }
    _set: { status: "Archive" }
  ) {
    affected_rows
    returning {
      id
      status
    }
  }
}
```

### Delete by Primary Key

```graphql
mutation {
  delete_projects_by_pk(id: 1) {
    id
    name
  }
}
```

### Delete Multiple

```graphql
mutation {
  delete_items(
    where: { 
      status: { _eq: "Archive" }
      created_at: { _lt: "2024-01-01" }
    }
  ) {
    affected_rows
  }
}
```

---

## Variables

Variables make queries reusable and safe from injection attacks.

### Without Variables (Bad)

```graphql
query {
  projects_by_pk(id: 1) {
    name
  }
}
```

### With Variables (Good)

**Query:**
```graphql
query GetProject($id: Int!) {
  projects_by_pk(id: $id) {
    id
    name
    description
  }
}
```

**Variables:**
```json
{
  "id": 1
}
```

### Variable Types

```graphql
query Example(
  $id: Int!              # Required integer
  $name: String          # Optional string
  $limit: Int = 10       # Default value
  $ids: [Int!]!          # Required array of required integers
) {
  # ...
}
```

**Type Modifiers:**
- `Type` - Optional
- `Type!` - Required (non-null)
- `[Type]` - Array of Type (optional)
- `[Type]!` - Required array
- `[Type!]!` - Required array of required items

### In TypeScript (Our Project)

```typescript
// In your component
const { data } = await apolloClient.query<GetProjectByIdResponse>({
  query: GET_PROJECT_BY_ID,
  variables: { id: projectId }
});
```

---

## Fragments

Fragments are **reusable pieces** of a query.

### Basic Fragment

```graphql
fragment ProjectFields on projects {
  id
  name
  description
  created_at
  updated_at
}

query {
  projects {
    ...ProjectFields
  }
}
```

### Nested Fragments

```graphql
fragment ItemFields on items {
  id
  title
  description
  status
  type
  module
}

fragment ProjectWithItems on projects {
  ...ProjectFields
  items {
    ...ItemFields
  }
}

query {
  projects {
    ...ProjectWithItems
  }
}
```

### When to Use Fragments

✅ **Use when:**
- Same fields appear multiple times
- Complex nested objects
- Sharing field sets across queries

❌ **Don't use when:**
- Simple queries
- Fields used only once

---

## Aliases

Aliases let you **rename fields** in the response.

### Basic Alias

```graphql
query {
  project: projects_by_pk(id: 1) {
    id
    projectName: name
    desc: description
  }
}
```

**Response:**
```json
{
  "data": {
    "project": {
      "id": 1,
      "projectName": "My Project",
      "desc": "Description"
    }
  }
}
```

### Multiple Queries with Aliases

```graphql
query {
  project1: projects_by_pk(id: 1) {
    id
    name
  }
  project2: projects_by_pk(id: 2) {
    id
    name
  }
}
```

**Response:**
```json
{
  "data": {
    "project1": { "id": 1, "name": "Project A" },
    "project2": { "id": 2, "name": "Project B" }
  }
}
```

---

## Directives

Directives add **conditional logic** to queries.

### @include Directive

```graphql
query GetProject($id: Int!, $withItems: Boolean!) {
  projects_by_pk(id: $id) {
    id
    name
    items @include(if: $withItems) {
      id
      title
    }
  }
}
```

**Variables:**
```json
{ "id": 1, "withItems": true }  // Include items
{ "id": 1, "withItems": false } // Exclude items
```

### @skip Directive

```graphql
query GetItems($skipArchived: Boolean!) {
  items {
    id
    title
    archived_data @skip(if: $skipArchived) {
      archived_at
      reason
    }
  }
}
```

### Custom Directives (Hasura)

Hasura doesn't support custom directives, but provides:
- `@cached` - Cache query results (Hasura Cloud)

---

## Hasura-Specific Features

### Aggregations

```graphql
query {
  items_aggregate {
    aggregate {
      count
      sum {
        project_id
      }
      avg {
        project_id
      }
      max {
        created_at
      }
      min {
        created_at
      }
    }
  }
}
```

### Group By (with aggregate)

```graphql
query {
  items_aggregate(
    where: { status: { _eq: "Completed" } }
  ) {
    nodes {
      project_id
      status
    }
    aggregate {
      count
    }
  }
}
```

### Upsert (Insert or Update)

```graphql
mutation {
  insert_items_one(
    object: {
      id: 1
      title: "Task"
      project_id: 1
    }
    on_conflict: {
      constraint: items_pkey
      update_columns: [title]
    }
  ) {
    id
    title
  }
}
```

### Search (Full Text)

```graphql
query {
  items(
    where: {
      _or: [
        { title: { _ilike: "%search%" } }
        { description: { _ilike: "%search%" } }
      ]
    }
  ) {
    id
    title
  }
}
```

### Relationships

```graphql
query {
  projects {
    id
    name
    # One-to-many relationship
    items {
      id
      title
    }
    # Aggregate on relationship
    items_aggregate {
      aggregate {
        count
      }
    }
  }
}
```

---

## Best Practices

### 1. Always Use Variables

❌ **Bad:**
```graphql
query {
  projects_by_pk(id: 1) { name }
}
```

✅ **Good:**
```graphql
query GetProject($id: Int!) {
  projects_by_pk(id: $id) { name }
}
```

### 2. Name Your Operations

❌ **Bad:**
```graphql
query {
  projects { id name }
}
```

✅ **Good:**
```graphql
query GetAllProjects {
  projects { id name }
}
```

### 3. Request Only What You Need

❌ **Bad:**
```graphql
query {
  projects {
    id
    name
    description
    created_at
    updated_at
    items {
      id
      title
      description
      type
      status
      # ... everything
    }
  }
}
```

✅ **Good:**
```graphql
query {
  projects {
    id
    name
    items {
      id
      title
      status
    }
  }
}
```

### 4. Use Pagination

❌ **Bad:**
```graphql
query {
  items {  # Could return millions!
    id
    title
  }
}
```

✅ **Good:**
```graphql
query GetItems($limit: Int!, $offset: Int!) {
  items(limit: $limit, offset: $offset) {
    id
    title
  }
  items_aggregate {
    aggregate {
      count  # Total count for pagination
    }
  }
}
```

### 5. Handle Errors

```typescript
try {
  const { data, errors } = await apolloClient.query({
    query: GET_PROJECTS
  });
  
  if (errors) {
    console.error('GraphQL errors:', errors);
  }
  
  return data;
} catch (error) {
  console.error('Network error:', error);
}
```

### 6. Use Fragments for Reusability

```graphql
# Define once
fragment ItemCore on items {
  id
  title
  status
  created_at
}

# Use everywhere
query GetItems {
  items { ...ItemCore }
}

query GetItemById($id: Int!) {
  items_by_pk(id: $id) { ...ItemCore }
}
```

### 7. Optimize with DataLoader (Hasura does this automatically)

Hasura automatically batches and caches database queries, but be aware:
- Don't over-nest queries
- Use `_aggregate` instead of fetching all items and counting in JS

---

## Common Patterns in Our Project

### Pattern 1: CRUD Operations

**Create:**
```graphql
mutation CreateItem($title: String!, $projectId: Int!) {
  insert_items_one(object: {
    title: $title
    project_id: $projectId
    status: "Not start"
    type: "Feature"
  }) {
    id
    title
  }
}
```

**Read:**
```graphql
query GetItems($projectId: Int) {
  items(where: { project_id: { _eq: $projectId } }) {
    id
    title
    status
  }
}
```

**Update:**
```graphql
mutation UpdateItem($id: Int!, $set: items_set_input!) {
  update_items_by_pk(
    pk_columns: { id: $id }
    _set: $set
  ) {
    id
    title
    status
  }
}
```

**Delete:**
```graphql
mutation DeleteItem($id: Int!) {
  delete_items_by_pk(id: $id) {
    id
  }
}
```

### Pattern 2: Filtering and Sorting

```graphql
query GetFilteredItems(
  $status: String!
  $projectId: Int!
) {
  items(
    where: {
      status: { _eq: $status }
      project_id: { _eq: $projectId }
    }
    order_by: { created_at: desc }
  ) {
    id
    title
    status
  }
}
```

### Pattern 3: Statistics

```graphql
query GetProjectStats($projectId: Int!) {
  completed: items_aggregate(
    where: {
      project_id: { _eq: $projectId }
      status: { _eq: "Completed" }
    }
  ) {
    aggregate { count }
  }
  
  total: items_aggregate(
    where: { project_id: { _eq: $projectId } }
  ) {
    aggregate { count }
  }
}
```

---

## Learning Resources

### Official Documentation
- [GraphQL.org](https://graphql.org/learn/) - Official GraphQL spec
- [Hasura Docs](https://hasura.io/docs/latest/graphql/core/index.html) - Hasura-specific features
- [Apollo Client Docs](https://www.apollographql.com/docs/react/) - React integration

### Interactive Learning
- [GraphQL Playground](https://www.graphqlbin.com/) - Try queries online
- Your Hasura Console: `http://localhost:8080/console` - Test with your data

### Practice Tips
1. Use Hasura Console to experiment with queries
2. Check the "Docs" tab in GraphQL Playground for schema
3. Use "Explorer" tab to build queries visually
4. Check network tab to see actual GraphQL requests

---

## Next Steps

1. ✅ Open your Hasura Console
2. ✅ Try the example queries above
3. ✅ Modify queries in the Explorer
4. ✅ Check the generated GraphQL
5. ✅ Use in your application with Apollo Client

**Happy Learning! 🚀**

