---
inclusion: always
---

# Security Rules (CRITICAL — Never Violate)

## Absolute Rules

- **Never** hardcode secrets, API keys, passwords, or tokens in source code
- **Never** commit `.env` files to version control
- **Never** log sensitive data (passwords, tokens, PII)
- **Never** use `eval()` or `Function()` with user input
- **Always** validate and sanitize all user inputs

## Authentication

- Hash passwords with bcrypt (rounds >= 12) or argon2
- JWT: 15min access token, 7d refresh token
- Rate limiting on auth endpoints (max 5-10 attempts/15min)
- Session cookies: `httpOnly`, `secure`, `sameSite: 'lax'`

## Authorization

- Every endpoint checks authentication
- Resource ownership verified (no IDOR)
- API keys scoped appropriately
- Admin functions protected

## Input Validation

- All user input validated at system boundary (use Zod)
- Allowlist validation preferred over blocklist
- String lengths constrained
- SQL queries parameterized (use Prisma, never string concat)
- File uploads restricted by type and size

## Security Headers

```javascript
// Use Helmet.js — required headers:
// Content-Security-Policy, Strict-Transport-Security,
// X-Content-Type-Options, X-Frame-Options, Permissions-Policy
```

## CORS

- Restrictive origin allowlist (no `*` in production)
- Credentials mode appropriate
- Methods and headers restricted

## Error Handling

- Generic error messages in production
- No stack traces exposed to clients
- No database details in errors
- No internal paths revealed

## Dependencies

- Run `npm audit` regularly
- No critical vulnerabilities allowed
- Keep dependencies up to date
- Lock file committed
