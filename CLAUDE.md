# CLAUDE.md

## Project: FocusTracker

Full-stack focus session tracker. Calendar navigation, Pomodoro-style timers, drag-and-drop task reordering, multi-user auth.

## Current State

- Monorepo: `client/` (React 19 + Vite + Tailwind) and `server/` (Express + Prisma + PostgreSQL)
- Package manager: pnpm workspaces
- Linting: oxlint, Formatting: oxfmt (replaced ESLint + Prettier)
- Currently: monorepo scaffolded, server has no source files yet

## Key Documents

- **Design Spec:** `docs/focus-tracker-design.md` — full architecture, API design, data model, UI layout
- **Implementation Plan:** `docs/focus-tracker-plan.md` — phased task list with TDD steps
- **Project Rules:** `AGENTS.md` — coding style, testing, git conventions

## Before Starting Any Session

1. Read the implementation plan to see which phase/task is next (check git log for completed tasks)
2. Follow TDD: write failing test first, then implement, then commit
3. Follow ALL project rules in AGENTS.md

## Working Rules (Non-Negotiable)

- EXPLAIN FIRST — explain WHAT and WHY before writing any code
- TEACH — explain architecture decisions, tool choices, common mistakes
- ONE FILE AT A TIME — never implement multiple files in one response
- COMMIT AFTER EACH FEATURE — one logical unit of work per commit
- ANSWER QUESTIONS — pause and explain when asked
- TDD — red-green cycle for every feature

## Design Aesthetic

iOS-inspired premium feel. See design spec for full details.

- No anti-patterns: no generic blue/indigo, no gradient backgrounds, no same radius everywhere
- Use CSS variables/tokens, no arbitrary colors
- Use cn() for conditional class merging
- Mixed border radii, dark mode support, micro-interactions

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Query, React Router, @dnd-kit
- Backend: Express.js, Prisma, PostgreSQL, JWT, Zod
- Testing: Vitest, React Testing Library (client), Supertest (server)
- Package Manager: pnpm

## Commands

- `pnpm dev` — start client dev server
- `pnpm dev:server` — start server dev server
- `pnpm test` — run all tests
- `pnpm build` — build all
- `pnpm lint` — lint all (oxlint)
- `pnpm format` — format all (oxfmt)

## Git

- Format: `feat: one liner description`
- Pre-commit hooks via Husky: oxlint + oxfmt via lint-staged
- `prepare: "husky || true"` for CI/CD compatibility
