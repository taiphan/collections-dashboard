---
inclusion: manual
---

# Five-Axis Code Review Framework

> "Approve a change when it definitely improves overall code health, even if it isn't perfect."

## Axis 1: Correctness

- Does implementation match requirements?
- Edge cases handled?
- Error paths covered?
- Potential runtime issues (off-by-one, race conditions, null access)?
- Tests verify claimed behavior?

## Axis 2: Readability & Simplicity

- Can another engineer understand without explanation?
- Names clear and descriptive?
- Control flow straightforward?
- Deep nesting (> 3 levels)? Long functions (> 30 lines)?

## Axis 3: Architecture

- Follows existing patterns?
- Module boundaries respected?
- Appropriate abstraction level?
- Dependencies flow correctly?

## Axis 4: Security

- Input validated and sanitized?
- Queries parameterized?
- Auth checks in place?
- No secrets in code?

## Axis 5: Performance

- N+1 query patterns?
- Unbounded operations?
- Missing pagination?
- Unnecessary re-renders (React)?

## Comment Severity

| Prefix | Meaning |
|--------|---------|
| (none) | Required change |
| `Critical:` | Merge blocker |
| `Nit:` | Minor/style, optional |
| `Optional:` | Suggestion |
| `FYI:` | Informational |

## Review Output

```markdown
## Review Summary

**Overall**: APPROVE / REQUEST CHANGES / NEEDS DISCUSSION

### Critical Issues
### Important
### Suggestions
### Positives
```
