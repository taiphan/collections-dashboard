---
inclusion: fileMatch
fileMatchPattern: "**/.gitignore,**/.github/**"
---

# Git Workflow

## Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|-----------|
| `main` | Production code | Full protection |
| `dev` | Integration | PR required |
| `feature/*` | New features | None |
| `fix/*` | Bug fixes | None |
| `hotfix/*` | Urgent fixes | Direct to main via PR |

## Commit Format (Conventional Commits)

```
<type>(<scope>): <short description>
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure |
| `test` | Adding or fixing tests |
| `chore` | Build process, dependencies |
| `perf` | Performance improvement |

## Rules

- Never commit directly to `main` or `dev`
- PR title follows conventional commit format
- Minimum 1 reviewer approval
- All CI checks must pass before merge
- Each commit = one logical change
- Never commit: `.env`, secrets, `node_modules`
- Always run tests before committing
