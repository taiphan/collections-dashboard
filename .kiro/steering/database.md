---
inclusion: fileMatch
fileMatchPattern: "**/*.prisma,**/prisma/**,**/*.repository*.ts,**/repositories/**,**/migrations/**"
---

# Database Rules

## General

- Never write raw SQL in business logic — use Prisma ORM
- All database calls inside try/catch blocks
- Use transactions for multi-step operations
- Use connection pooling

## Query Best Practices

```typescript
// ✅ Select only needed fields
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true },
});

// ✅ Always paginate lists
const users = await db.user.findMany({
  take: limit,
  skip: (page - 1) * limit,
  orderBy: { createdAt: 'desc' },
});

// ✅ Prevent N+1 — use include/join
const users = await db.user.findMany({ include: { orders: true } });
```

## Transactions

```typescript
await db.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({
    where: { id: productId },
    data: { stock: { decrement: 1 } },
  });
  return order;
});
```

## Prisma Schema Conventions

- Primary keys: `cuid()` or `uuid()` (not auto-increment for distributed)
- Table names: `@@map("snake_case_plural")`
- Always add `@@index` on foreign keys and frequently queried columns
- Soft delete: `deletedAt DateTime?`
- Timestamps: `createdAt`, `updatedAt` on every model

## Migrations

- Always use migration files, never modify schema directly
- Migrations are version-controlled and immutable
- Run `npx prisma migrate deploy` in CI/CD before deploying
