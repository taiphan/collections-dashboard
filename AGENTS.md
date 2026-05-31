# AI agent instructions

This repository supports **three AI development tools** with parallel configuration trees. Keep them in sync when you change workflows or standards.

## Kiro

Kiro-oriented guidance lives in **`.kiro/`**.

- **Steering (always-on rules):** `.kiro/steering/security.md`, `code-standards.md`, `project-overview.md`
- **Steering (file-conditional):** `.kiro/steering/api-conventions.md`, `database.md`, `monitoring.md`, `frontend.md`, `testing.md`, `error-handling.md`, `git-workflow.md`
- **Steering (manual/#-include):** `.kiro/steering/system-design.md`, `deployment.md`, `performance.md`, `code-review.md`, `accessibility.md`
- **Hooks:** `.kiro/hooks/` (automated actions on file edits, tool use, and task completion)

## Cursor

Cursor-oriented guidance lives in **`.cursor/CURSOR.md`**.

- **Rules:** `.cursor/rules/` (`.mdc` files; see `cursor-overview.mdc` and `security.mdc`)
- **Command prompts:** `.cursor/commands/`
- **Agent personas:** `.cursor/agents/` (reference with `@` in Cursor)
- **Skills:** `.cursor/skills/`
- **Checklists:** `.cursor/references/`

## Claude Code

Claude Code uses the parallel **`.claude/`** tree with the same structure as Cursor.
