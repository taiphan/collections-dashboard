---
inclusion: fileMatch
fileMatchPattern: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/tests/**,**/vitest.config*,**/playwright.config*"
---

# Testing Standards

## Test Pyramid

| Level | % | Speed | Scope |
|-------|---|-------|-------|
| Unit | 80% | ms | Single function, no I/O |
| Integration | 15% | seconds | API + DB interactions |
| E2E | 5% | minutes | Critical user flows |

## Coverage Threshold: 80% minimum

## TDD Cycle: RED → GREEN → REFACTOR

1. Write failing test describing expected behavior
2. Write minimal code to pass
3. Refactor while keeping tests green

## Bug Fix Pattern (Prove-It)

1. Write test reproducing the bug (must FAIL)
2. Fix the bug
3. Verify test passes
4. Run full suite (no regressions)

## Test Structure (AAA)

```typescript
it('should [expected behavior] when [condition]', () => {
  // Arrange — Setup
  const user = createTestUser({ role: 'admin' });

  // Act — Execute
  const result = checkPermission(user, 'delete');

  // Assert — Verify
  expect(result).toBe(true);
});
```

## Naming: `should [expected] when [condition]`

## Test Doubles (preference order)

1. Real implementations (best)
2. In-memory fakes
3. Stubs (canned responses)
4. Mocks (verify interactions — use sparingly)

## Anti-Patterns to Avoid

- Testing implementation details (test behavior instead)
- Shared mutable state between tests
- Flaky tests (use deterministic data)
- Over-mocking (prefer real implementations)
- No assertions in tests
- Magic numbers (use named constants)

## Commands

```bash
npm test                  # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # Coverage report
npm run test:e2e          # E2E tests (Playwright)
```
