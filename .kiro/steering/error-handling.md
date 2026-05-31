---
inclusion: fileMatch
fileMatchPattern: "**/*.middleware*.ts,**/middleware/**,**/*.service*.ts,**/services/**,**/errors/**"
---

# Error Handling

## Core Principles

- Never swallow errors silently — always log or rethrow
- Use a centralized error handler
- Return consistent error responses
- Distinguish operational errors (expected) from programmer errors (bugs)

## Custom Error Class

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

## Async Error Handling

```typescript
// Wrap all async route handlers
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

## Global Error Handler

```typescript
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  logger.error({ err, req: { method: req.method, url: req.url } });

  if (!isOperational) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }

  res.status(statusCode).json({
    success: false,
    error: { code: err.code, message: err.message },
  });
}
```

## Rules

- Use `AppError` for known operational errors
- Never expose internal errors to clients
- Always log errors with structured JSON (Pino)
- Validate inputs with Zod and throw structured errors on failure
