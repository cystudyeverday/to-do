# API Documentation

Comprehensive documentation for the My Todo application API.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Items](#items)
  - [Projects](#projects)
  - [Statistics](#statistics)
  - [Health & Schema](#health--schema)

## Overview

The My Todo API follows RESTful principles and uses JSON for request and response payloads. All endpoints are prefixed with `/api`.

**Base URL:** `http://localhost:3000/api` (or your deployment URL)

## Architecture

The API is built using a modern, layered architecture:

```
┌─────────────────────────────────────────┐
│         API Routes Layer                │
│  (Next.js Route Handlers)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Controllers Layer               │
│  (Request validation, response format)  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Services Layer                  │
│  (Business logic, validation)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Repositories Layer              │
│  (Data access, GraphQL queries)         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Layer                      │
│  (Hasura GraphQL, PostgreSQL)          │
└─────────────────────────────────────────┘
```

### Key Components

- **DTOs (Data Transfer Objects)**: Request and response data structures
- **Validation**: Request validation using schema-based validation
- **Error Handling**: Standardized error responses
- **Controllers**: Handle HTTP requests and coordinate service calls
- **Services**: Implement business logic and rules
- **Repositories**: Manage data access and GraphQL operations

## Response Format

All API responses follow a standardized format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## Error Handling

The API uses standardized HTTP status codes and error codes:

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `500 Internal Server Error` - Server error

### Error Codes

- `BAD_REQUEST` - Invalid request parameters
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed

## Endpoints

### Items

Manage todo items (tasks).

#### Get All Items

```http
GET /api/items
```

**Query Parameters:**

| Parameter   | Type     | Description                    |
|------------|----------|--------------------------------|
| projectId  | number   | Filter by project ID           |
| status     | string   | Filter by status               |
| type       | string   | Filter by type (Feature/Issue) |
| module     | string   | Filter by module               |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Task title",
      "description": "Task description",
      "type": "Feature",
      "status": "On progress",
      "projectId": 1,
      "module": "Frontend",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "completedAt": null
    }
  ]
}
```

#### Get Item by ID

```http
GET /api/items/:id
```

**Path Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Item ID     |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Task title",
    // ... other fields
  }
}
```

#### Create Item

```http
POST /api/items
```

**Request Body:**

```json
{
  "title": "Task title",
  "description": "Task description",
  "type": "Feature",
  "status": "Not start",
  "projectId": 1,
  "module": "Frontend"
}
```

**Validation Rules:**

- `title`: Required, 1-200 characters
- `description`: Optional, max 2000 characters
- `type`: Required, must be "Feature" or "Issue"
- `status`: Required, one of: "Not start", "On progress", "Pending", "Completed", "Archive"
- `projectId`: Required, valid project ID
- `module`: Optional, max 100 characters

**Response:** `201 Created`

#### Batch Create Items

```http
POST /api/items
```

**Request Body:**

```json
{
  "items": [
    {
      "title": "Task 1",
      "type": "Feature",
      "status": "Not start",
      "projectId": 1
    },
    {
      "title": "Task 2",
      "type": "Issue",
      "status": "Not start",
      "projectId": 1
    }
  ]
}
```

**Response:** `201 Created`

#### Update Item

```http
PUT /api/items/:id
```

**Path Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Item ID     |

**Request Body:**

```json
{
  "title": "Updated title",
  "status": "Completed",
  "completedAt": "2024-01-01T00:00:00.000Z"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Response:** `200 OK`

#### Delete Item

```http
DELETE /api/items/:id
```

**Path Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Item ID     |

**Response:** `204 No Content`

---

### Projects

Manage projects.

#### Get All Projects

```http
GET /api/projects
```

**Query Parameters:**

| Parameter     | Type    | Description                          |
|--------------|---------|--------------------------------------|
| includeStats | boolean | Include statistics for each project  |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Project name",
      "description": "Project description",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "stats": {
        "total": 10,
        "completed": 5,
        "inProgress": 3,
        "notStarted": 2,
        "completionRate": 50
      }
    }
  ]
}
```

#### Get Project by ID

```http
GET /api/projects/:id
```

**Path Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Project ID  |

**Query Parameters:**

| Parameter     | Type    | Description                    |
|--------------|---------|--------------------------------|
| includeStats | boolean | Include project statistics     |

**Response:** `200 OK`

#### Create Project

```http
POST /api/projects
```

**Request Body:**

```json
{
  "name": "Project name",
  "description": "Project description"
}
```

**Query Parameters:**

| Parameter          | Type    | Default | Description                     |
|-------------------|---------|---------|---------------------------------|
| createDefaultTasks | boolean | true    | Create default planning tasks   |

**Validation Rules:**

- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters

**Response:** `201 Created`

#### Update Project

```http
PUT /api/projects/:id
```

**Path Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Project ID  |

**Request Body:**

```json
{
  "name": "Updated name",
  "description": "Updated description"
}
```

**Response:** `200 OK`

#### Delete Project

```http
DELETE /api/projects/:id
```

**Path Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Project ID  |

**Query Parameters:**

| Parameter | Type    | Default | Description                                |
|-----------|---------|---------|-------------------------------------------|
| cascade   | boolean | false   | Delete all items in the project as well   |

**Response:** `204 No Content`

**Error:** Returns `400 Bad Request` if project has items and `cascade=false`

#### Archive Project

```http
POST /api/projects/:id/archive
```

**Path Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Project ID  |

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "项目已成功归档，共归档 10 个任务"
  }
}
```

**Error:** Returns error if project has uncompleted items

#### Get Project Items

```http
GET /api/projects/:id/items
```

**Path Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Project ID  |

**Response:** Same format as "Get All Items"

---

### Statistics

Get analytics and statistics.

#### Get Overall Statistics

```http
GET /api/statistics
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalItems": 100,
    "completedItems": 50,
    "inProgressItems": 30,
    "notStartedItems": 20,
    "weeklyNewItems": 10,
    "weeklyCompletedItems": 15,
    "averageCompletionTime": 5.5,
    "projectEfficiency": [
      {
        "projectId": 1,
        "projectName": "Project 1",
        "completionRate": 80,
        "totalItems": 10,
        "completedItems": 8
      }
    ],
    "typeDistribution": [
      {
        "type": "Feature",
        "count": 60,
        "percentage": 60
      },
      {
        "type": "Issue",
        "count": 40,
        "percentage": 40
      }
    ],
    "dailyCompletions": [
      {
        "date": "2024-01-01",
        "completedItems": 5,
        "features": 3,
        "issues": 2
      }
    ],
    "totalProjects": 5
  }
}
```

#### Get Trend Data

```http
GET /api/statistics/trends
```

**Query Parameters:**

| Parameter | Type   | Default | Description                        |
|-----------|--------|---------|------------------------------------|
| days      | number | 30      | Number of days to retrieve (1-365) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "completedItems": 5,
      "features": 3,
      "issues": 2
    }
  ]
}
```

---

### Health & Schema

Utility endpoints.

#### Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "services": {
      "api": "healthy",
      "graphql": "healthy"
    }
  }
}
```

#### Get Database Schema

```http
GET /api/schema
```

Returns comprehensive database schema information including table definitions, field types, constraints, and relationships.

**Response:** `200 OK` with detailed schema information

---

## Examples

### Create a Project with Items

```javascript
// 1. Create project
const projectResponse = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My New Project',
    description: 'Project description'
  })
});
const { data: project } = await projectResponse.json();

// 2. Create items
const itemsResponse = await fetch('/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      {
        title: 'Setup project',
        type: 'Feature',
        status: 'Not start',
        projectId: project.id,
        module: 'Planning'
      },
      {
        title: 'Design UI',
        type: 'Feature',
        status: 'Not start',
        projectId: project.id,
        module: 'Frontend'
      }
    ]
  })
});
```

### Update Item Status to Completed

```javascript
const response = await fetch('/api/items/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'Completed',
    completedAt: new Date().toISOString()
  })
});
```

### Get Project Statistics

```javascript
const response = await fetch('/api/projects/1?includeStats=true');
const { data: project } = await response.json();
console.log(project.stats.completionRate); // 75
```

---

## Best Practices

1. **Error Handling**: Always check the `success` field in responses
2. **Validation**: Validate data before sending requests
3. **Status Codes**: Use appropriate HTTP status codes
4. **Timestamps**: Use ISO 8601 format for dates
5. **IDs**: All IDs are numeric integers

## Rate Limiting

Currently, there is no rate limiting implemented. However, please be respectful with API usage.

## Support

For issues or questions, please refer to the main documentation or create an issue in the repository.

