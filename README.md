# FocusTracker

Full-stack focus session tracker with calendar navigation, Pomodoro-style timers, drag-and-drop task reordering, and multi-user auth.

## Features

- Calendar view with month navigation and per-day task counts
- Day view with drag-and-drop task reordering
- Per-task timers with focus interval notifications
- Day/Night session grouping for tasks
- Task templates with auto-populate
- Settings page (focus interval, notifications, overflow behavior)
- Light/Dark mode
- Multi-user auth via Clerk
- Optimistic updates with React Query

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Query, @dnd-kit
- **Backend**: Express.js, Prisma, PostgreSQL
- **Auth**: Clerk
- **Testing**: Vitest, React Testing Library (client), Supertest (server)
- **Linting/Formatting**: oxlint, oxfmt
- **Package Manager**: pnpm workspaces
- **Deployment**: Vercel (serverless functions + static client)

## Getting Started

1. Clone the repo:

   ```bash
   git clone https://github.com/sheikhlimon/daily-tasks-app.git
   cd daily-tasks-app
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Fill in `DATABASE_URL`, `CLERK_SECRET_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY`.

4. Set up the database:

   ```bash
   cd server && npx prisma migrate dev
   ```

5. Start dev servers:

   ```bash
   pnpm dev          # client on :5173
   pnpm dev:server   # server on :3001
   ```

## Project Structure

```
client/
  src/
    components/      # calendar/, playlist/, settings/, layout/, ui/
    hooks/           # useTimer, useCalendar, useNotification
    api/             # React Query hooks + API client
    pages/           # SettingsPage, LoginPage, SignupPage
    context/         # ThemeProvider

server/
  src/
    routes/          # days, tasks, sessions, settings, templates
    services/        # business logic
    middleware/      # auth (Clerk), validation (Zod), error handling
  prisma/            # schema and migrations

api/
  index.ts           # Vercel serverless entry point
```

## Commands

- `pnpm dev` — start client dev server
- `pnpm dev:server` — start server dev server
- `pnpm build` — build for production
- `pnpm test` — run all tests
- `pnpm lint` — lint all (oxlint)
- `pnpm format` — format all (oxfmt)

## Deployment

Connected to Vercel via GitHub. Pushes to `main` auto-deploy.

Required env vars in Vercel dashboard:
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

## License

MIT
