---
inclusion: fileMatch
fileMatchPattern: "**/*.route*.ts,**/*.controller*.ts,**/routes/**,**/controllers/**,**/api/**"
---

# API Conventions

## REST Design Standards

- URL paths: kebab-case, plural nouns, versioned (`/api/v1/users`)
- Nest related resources: `/api/v1/users/:id/orders`

## HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Read (idempotent) |
| POST | Create new resource |
| PUT | Replace entire resource |
| PATCH | Partial update |
| DELETE | Remove resource |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — GET/PUT/PATCH success |
| 201 | Created — POST success |
| 204 | No Content — DELETE success |
| 400 | Bad Request — Invalid input |
| 401 | Unauthorized — Not authenticated |
| 403 | Forbidden — No permission |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity — Validation failed |
| 500 | Internal Server Error |

## Response Envelope

```typescript
// Success
{ success: true, data: { ... } }
{ success: true, data: [...], pagination: { page, limit, total, totalPages } }

// Error
{ success: false, error: { code: 'VALIDATION_ERROR', message: '...' } }
```

## Input Validation

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
});

// Validate in middleware, throw AppError on failure
```

## Pagination & Filtering

```
GET /api/users?page=1&limit=20&sortBy=createdAt&order=desc
```

## Documentation

- Every endpoint MUST have OpenAPI/Swagger annotations
- Mount docs at `/api-docs`
