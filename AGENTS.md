<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-push-skill -->
# Git Push Skill — Push to GitHub & GitLab

When asked to "push code", "push to git", "push github and gitlab", or similar:

## Steps

1. Check for uncommitted changes: `git status --short`
2. If there are changes:
   - Stage all: `git add -A`
   - Commit with a descriptive conventional commit message
3. Push to GitHub: `git push origin main`
4. Push to GitLab: `git push gitlab main`
5. Report the result (commit hash, both remotes confirmed)

## Remote Configuration (los-system)

| Remote | URL |
|--------|-----|
| origin (GitHub) | `https://github.com/taiphan/los-system.git` |
| gitlab (GitLab) | `git@gitlab.com:taiphan/los-system.git` |

## Rules

- Never force push
- Never push directly to main without checking status first
- If push fails, report the error — don't retry automatically
- Keep commit messages concise (under 70 chars for title)
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Working directory: `/Users/phantuantai/MyData/Projects/project/los-system`
<!-- END:git-push-skill -->
