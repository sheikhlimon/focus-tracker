# AGENTS.md - Ground Truth for Commands, Style, and Structure

This file defines the standards and conventions for this project. Treat it as authoritative for consistency.

## Project Overview

- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Express.js, Prisma, PostgreSQL, React Query, @dnd-kit
- **Package Manager**: pnpm (workspaces)
- **Methodology**: Test-Driven Development (TDD) - write tests first, then implement features
- **See CLAUDE.md** for project context, design spec, and implementation plan locations

## File Structure

```
client/              # React frontend
  src/
    components/      # UI components organized by feature (auth/, calendar/, playlist/, layout/)
    hooks/           # Custom React hooks
    api/             # React Query config + query hooks
    context/         # React contexts (Auth, Theme)
    pages/           # Page-level components
    types/           # TypeScript types
  __tests__/         # Test files

server/              # Express backend
  src/
    routes/          # API route handlers
    services/        # Business logic
    middleware/      # Auth, validation, error handling
    utils/           # Helpers (tokens, etc.)
    __tests__/       # Test files
  prisma/            # Database schema and migrations
```

## Coding Style

- Use TypeScript for all new code
- Prefer functional components with hooks
- Props interfaces: Define at top of component file
- State: React Query for server state, useState/useContext for client state
- Event handlers: Prefix with `on` (e.g., `onAddTask`)
- Accessibility: Use semantic HTML, ARIA labels where needed
- Comments explain WHY not WHAT
- No JSDoc unless public API
- Use CSS variables/tokens, no arbitrary colors
- Use cn() for conditional class merging
- No inline styles, use Tailwind classes

## Testing

- Client: Vitest with React Testing Library
- Server: Vitest with Supertest
- Test user interactions, not implementation details
- Naming: `should [describe behavior]`
- Run tests: `pnpm test`
- TDD cycle: RED (failing test) → GREEN (minimal implementation) → REFACTOR → COMMIT

## Commands

- `pnpm dev`: Start client dev server
- `pnpm dev:server`: Start server dev server
- `pnpm build`: Build for production
- `pnpm lint`: Run ESLint
- `pnpm test`: Run all tests

## Git

- Use conventional commits (e.g., `feat: add delete task`)
- One logical change per commit
- Pre-commit hooks via Husky: Lint and format code
- `prepare: "husky || true"` for CI/CD compatibility

## Anti-Patterns (Avoid AI-Generated Look)

- No generic blue/indigo everywhere
- No perfectly centered heroes with "Get Started"
- No same border radius on everything
- No default shadows on all cards
- No template nav bars
- No bland "Welcome to..." headings
- No gradient backgrounds everywhere

## Prefer Instead

- Asymmetric layouts, mixed border radii
- Dark mode support
- Micro-interactions, skeleton loaders
- Data density over whitespace
- Personality over templates
