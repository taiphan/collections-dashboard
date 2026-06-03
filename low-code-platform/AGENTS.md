<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Confirmed Next.js 16 facts that matter for this app:

- Middleware is renamed to **`proxy.ts`** (project root).
- `next build` no longer runs the linter automatically.
- Route handlers can use `RouteContext<'/path'>` for typed params.
- Turbopack is the default bundler.

<!-- END:nextjs-agent-rules -->

# Low-Code Platform — agent rules

## Architectural rules

- **All persistence goes through `src/lib/db/repositories/`**. Services and route handlers MUST NOT import `drizzle-orm` or `pg` directly.
- **Tenant scoping lives in the repository layer.** Use `withTenant(tenantId)` to obtain a tenant-scoped query API. Never write a query without it.
- **Definitions are validated by Zod at every boundary** — both at the route handler entry and inside services before persistence.
- **Audit emission happens in services**, not in route handlers. Every design-time mutation and every case transition records an audit entry (Property 3, Requirement 10).

## Spec source of truth

The full requirements, design, and tasks live at:
- `../.kiro/specs/low-code-platform/requirements.md`
- `../.kiro/specs/low-code-platform/design.md`
- `../.kiro/specs/low-code-platform/tasks.md`

When any architectural choice is unclear, defer to the design doc, not to general patterns.

## Out of scope (do not build, even speculatively)

- Visual BPMN process designer
- Decision tables / rule engine surface beyond expression-AST conditions
- Integration connectors (REST/SOAP/DB)
- Native mobile apps
- AI-assisted design
- General-purpose BI / report builder
