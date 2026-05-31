---
inclusion: always
---

# Code Standards & Style

## Formatting

- Indentation: 2 spaces (no tabs)
- Max line length: 100 characters
- Single quotes for strings
- Always use semicolons
- Trailing commas in multi-line structures

## Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Variables/functions | camelCase | `getUserById` |
| Classes/interfaces | PascalCase | `UserService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Files | kebab-case | `user-service.ts` |
| Test files | `[name].test.ts` | `user-service.test.ts` |
| DB tables | snake_case plural | `user_profiles` |
| DB columns | snake_case | `created_at` |
| URLs | kebab-case plural | `/api/v1/user-profiles` |
| Env vars | UPPER_SNAKE_CASE | `DATABASE_URL` |
| Cache keys | colon-separated | `myapp:v1:user:123` |

## Functions

- 2 arguments or fewer — use object destructuring for more
- Functions should do ONE thing
- Max ~30 lines per function
- No flag parameters — split into separate functions
- Favor functional programming (filter, map, reduce)
- Use async/await over raw promises

## Clean Code Rules

- Use meaningful, pronounceable variable names
- Use searchable names (no magic numbers)
- Avoid mental mapping — be explicit
- Encapsulate conditionals into named functions
- Avoid negative conditionals
- Remove dead code immediately
- Only comment WHY, not WHAT
- Prefer composition over inheritance
- Follow SOLID principles

## Import Order

1. Node built-ins
2. External dependencies
3. Internal modules (use `@/` path aliases)

## TypeScript

- Never use `any` without justification
- Use strict mode always
- Define interfaces for all data shapes
- Use Zod for runtime validation
