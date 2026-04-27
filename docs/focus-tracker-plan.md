# FocusTracker Full-Stack Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the client-only daily tasks app into a full-stack focus session tracker with calendar, timers, drag-and-drop, and multi-user auth.

**Architecture:** pnpm monorepo with `client/` (React/Vite) and `server/` (Express/Prisma). PostgreSQL for persistence. React Query for server state. TDD throughout.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Express.js, Prisma, PostgreSQL, React Query, @dnd-kit, React Router, Zod, JWT, Vitest

**Working Rules:** EXPLAIN FIRST. ONE FILE AT A TIME. COMMIT AFTER EACH FEATURE. TDD RED-GREEN CYCLE. No anti-patterns (see CLAUDE.md).

**Design Spec:** `docs/superpowers/specs/2026-04-24-focus-tracker-design.md`

---

## Phase 1: Monorepo Setup

### Task 1.1: Initialize pnpm workspaces

- [ ] Install pnpm via corepack, create `pnpm-workspace.yaml` with `client` and `server` packages
- [ ] Move current `src/`, `public/`, `index.html`, and all config files into `client/` using `git mv`
- [ ] Create `client/package.json` (current deps moved from root), root `package.json` (workspace config with `husky || true`), `server/package.json` (Express, Prisma, bcryptjs, cors, jsonwebtoken, zod, supertest)
- [ ] Create `server/tsconfig.json` targeting ES2022 with bundler module resolution
- [ ] Run `pnpm install`, verify client tests still pass
- [ ] Commit: `chore: restructure as pnpm monorepo with client and server workspaces`

---

## Phase 2: Server Core & Database

### Task 2.1: Prisma schema and database setup

**Files:** `server/prisma/schema.prisma`, `server/.env`, `server/.env.example`, `server/src/db.ts`, `server/src/index.ts`

**Schema:** User (email, name, password) → Settings (1:1) + Day[] (date, unique per user) → Task[] (title, position, status: queued/active/completed) → Session[] (startTime, endTime, durationSeconds, status: running/paused/completed, pauses as JSON)

- [ ] Create Prisma schema with User, Settings, Day, Task, Session models (see design spec for full schema)
- [ ] Create `.env` with DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT=3001, NODE_ENV=development. Add `.env` to `.gitignore`. Create `.env.example` without secrets.
- [ ] Create `server/src/db.ts` — exports PrismaClient singleton
- [ ] Create `server/src/index.ts` — Express app with cors, json parser, `/api/health` endpoint, listens on PORT
- [ ] Create `server/vitest.config.ts` for node environment
- [ ] Write test: `GET /api/health` returns `{ status: "ok" }`
- [ ] Run `npx prisma migrate dev --name init`, verify migration creates all tables
- [ ] Commit: `feat: scaffold Express server with Prisma schema and health endpoint`

### Task 2.2: Server middleware

**Files:** `server/src/middleware/auth.ts`, `server/src/middleware/validation.ts`, `server/src/middleware/errorHandler.ts`, `server/src/utils/tokens.ts`

- [ ] Create `tokens.ts` — generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken using jsonwebtoken
- [ ] Write test for authMiddleware: rejects without token, rejects invalid, allows valid
- [ ] Create `auth.ts` middleware — extracts Bearer token, verifies, sets `req.userId`
- [ ] Create `validation.ts` — takes Zod schema, validates `req.body`, returns 400 with error messages
- [ ] Create `errorHandler.ts` — logs stack, returns 500
- [ ] Commit: `feat: add auth, validation, and error handler middleware`

---

## Phase 3: Auth API

### Task 3.1: Signup and login routes

**Files:** `server/src/routes/auth.ts`, `server/src/services/auth.ts`

- [ ] Write tests: signup creates user + returns tokens, rejects duplicate email, rejects invalid input; login returns tokens for correct creds, rejects wrong password, rejects non-existent user
- [ ] Create `services/auth.ts` — signup (hashes password, creates user + settings, generates tokens), login (verifies password, generates tokens)
- [ ] Create `routes/auth.ts` — POST /signup with Zod validation, POST /login with Zod validation. Register in index.ts
- [ ] Commit: `feat: add auth signup and login routes with JWT tokens`

### Task 3.2: Refresh token route

- [ ] Write test: returns new access token with valid refresh token, rejects invalid
- [ ] Add POST /refresh to auth routes — verifyRefreshToken, generateAccessToken
- [ ] Commit: `feat: add refresh token route`

---

## Phase 4: Days & Tasks API

### Task 4.1: Days routes

**Files:** `server/src/routes/days.ts`, `server/src/services/days.ts`

- [ ] Write tests: GET /days?month= returns days for month, GET /days/:date returns day with tasks, POST /days/:date creates future day
- [ ] Create `services/days.ts` — getDaysByMonth (includes task counts + time stats), getDayByDate (upsert — creates if not exists), createDay
- [ ] Create `routes/days.ts` — GET / (with month query validation), GET /:date, POST /:date. Register in index.ts behind authMiddleware
- [ ] Commit: `feat: add days CRUD routes with month overview`

### Task 4.2: Tasks routes

**Files:** `server/src/routes/tasks.ts`, `server/src/services/tasks.ts`

- [ ] Write tests: POST adds task with auto-incrementing position, PATCH updates title, DELETE removes task, PATCH /reorder updates positions via transaction
- [ ] Create `services/tasks.ts` — addTask (auto-position), updateTask, deleteTask, reorderTasks ($transaction with position updates)
- [ ] Create `routes/tasks.ts` — POST /, PATCH /reorder, PATCH /:taskId, DELETE /:taskId. Mount as nested under `/api/days/:date/tasks`
- [ ] Commit: `feat: add tasks CRUD routes with reorder support`

---

## Phase 5: Sessions (Timer) API

### Task 5.1: Session routes

**Files:** `server/src/routes/sessions.ts`, `server/src/services/sessions.ts`

- [ ] Write tests: POST starts session + sets task to active, PATCH pauses + tracks duration, PATCH /complete stops + marks task completed + logs duration
- [ ] Create `services/sessions.ts` — startSession, pauseSession (calculates elapsed, appends to pauses array), resumeSession, completeSession (final duration, updates task status to completed)
- [ ] Create `routes/sessions.ts` — POST /, PATCH /:sessionId (action: pause|resume), PATCH /:sessionId/complete
- [ ] Commit: `feat: add session routes for timer start, pause, resume, complete`

---

## Phase 6: Settings API

### Task 6.1: Settings routes

**Files:** `server/src/routes/settings.ts`

- [ ] Write tests: GET returns defaults (focusInterval: 25, notifications: true, taskOverflow: "keep"), PATCH updates settings
- [ ] Create routes — GET /, PATCH / with Zod validation for all settings fields
- [ ] Commit: `feat: add settings routes with validation`

---

## Phase 7: Frontend Foundation

### Task 7.1: Install deps, API client, React Query, routing

**Files:** `client/src/api/client.ts`, `client/src/api/queries.ts`, `client/src/main.tsx`

- [ ] Install: react-router-dom, @tanstack/react-query, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- [ ] Create `api/client.ts` — fetch wrapper with auth header, 401 handling, error parsing
- [ ] Create `api/queries.ts` — useMonth, useDay, useAddTask, useSettings hooks
- [ ] Update `main.tsx` — wrap with BrowserRouter + QueryClientProvider
- [ ] Update existing tests with new providers in renderWithTheme helper
- [ ] Commit: `feat: add React Query, React Router, API client, and query hooks`

---

## Phase 8: Auth Frontend

### Task 8.1: Auth context, login, signup

**Files:** `client/src/context/AuthContext.tsx`, `client/src/components/auth/LoginForm.tsx`, `client/src/components/auth/SignupForm.tsx`, `client/src/pages/LoginPage.tsx`, `client/src/pages/SignupPage.tsx`

- [ ] Write test: LoginForm renders inputs, calls onSubmit with credentials
- [ ] Create AuthContext — manages user state, login/signup/logout functions, token persistence in localStorage
- [ ] Create LoginForm — email + password inputs, submit button. iOS-style styling.
- [ ] Create SignupForm — same + name field
- [ ] Create LoginPage, SignupPage — wrap forms with layout, error display, nav links
- [ ] Add auth routes to App.tsx
- [ ] Commit: `feat: add auth context, login and signup pages`

---

## Phase 9: Calendar & Sidebar Layout

### Task 9.1: Main layout with sidebar and responsive behavior

**Files:** `client/src/components/layout/MainLayout.tsx`, `client/src/components/layout/Sidebar.tsx`, `client/src/components/calendar/CalendarView.tsx`, `client/src/components/calendar/DateCard.tsx`, `client/src/hooks/useCalendar.ts`

- [ ] Create `useCalendar.ts` — manages currentMonth, generates calendar day grid, prev/next month navigation
- [ ] Write test: CalendarView renders days, clicking navigates to route
- [ ] Create DateCard — compact card with date, task count, time stats, click handler
- [ ] Create Sidebar — DateCards grouped by Today/Upcoming/Past, fetches via useMonth
- [ ] Create CalendarView — month grid with clickable day cells, month nav arrows
- [ ] Create MainLayout — desktop: sidebar left + main right; mobile: full-screen based on route
- [ ] Update App.tsx routes: / → CalendarView, /day/:date → PlaylistView, /settings → SettingsPage
- [ ] Commit: `feat: add calendar view, sidebar, and responsive main layout`

---

## Phase 10: Playlist View & Drag-and-Drop

### Task 10.1: Playlist view with task list and dnd-kit

**Files:** `client/src/components/playlist/PlaylistView.tsx`, `client/src/components/playlist/TaskItem.tsx`, `client/src/components/playlist/AddTaskInput.tsx`, `client/src/components/playlist/PlaylistHeader.tsx`

- [ ] Write test: PlaylistView renders tasks from useDay mock, shows titles
- [ ] Create AddTaskInput — input + button, calls useAddTask mutation
- [ ] Create TaskItem — drag handle, title, timer display, action buttons (Start/Pause/Done/Delete)
- [ ] Create PlaylistHeader — date display, back-to-calendar button, global timer
- [ ] Create PlaylistView — DndContext + SortableContext wrapping TaskItem array, handleDragEnd calls reorder API, separates active/completed tasks
- [ ] Commit: `feat: add playlist view with drag-and-drop task reordering`

---

## Phase 11: Timer UI

### Task 11.1: useTimer hook and Pomodoro notifications

**Files:** `client/src/hooks/useTimer.ts`, `client/src/hooks/useNotification.ts`

- [ ] Write test: useTimer starts + counts seconds, pauses + resumes correctly, stop returns elapsed
- [ ] Create `useTimer.ts` — manages start/pause/resume/stop via setInterval, tracks elapsed seconds
- [ ] Create `useNotification.ts` — requestNotificationPermission, sendFocusNotification using browser Notification API
- [ ] Update TaskItem — wire timer controls to useTimer + session API calls, show progress bar based on settings.focusInterval
- [ ] Commit: `feat: add timer hook with Pomodoro notifications and task controls`

---

## Phase 12: Settings Page

### Task 12.1: Settings page with auto-save

**Files:** `client/src/pages/SettingsPage.tsx`

- [ ] Write test: renders settings form, updates on change
- [ ] Create SettingsPage — focus interval (number input + quick-pick chips), notifications toggle, task overflow radio, theme selector, week starts radio. Debounced auto-save via PATCH.
- [ ] Commit: `feat: add settings page with auto-save`

---

## Phase 13: iOS Design Polish

### Task 13.1: Design tokens and iOS styling

**Files:** `client/src/index.css`, update all components

- [ ] Define CSS custom properties in index.css: iOS colors (whites/blacks/grays), accent (#007AFF), radii (16px cards, 8px buttons, 4px inputs)
- [ ] Update components to use tokens — no hardcoded colors, mixed border radii
- [ ] Add micro-interactions: 200ms transitions, hover states, skeleton loaders
- [ ] Commit: `feat: apply iOS-inspired design system with CSS tokens and micro-interactions`

---

## Phase 14: Render Deployment

### Task 14.1: Deploy configuration

**Files:** `render.yaml`

- [ ] Create render.yaml — web service, build command, start command, env vars (NODE_ENV=development, DATABASE_URL, JWT secrets)
- [ ] Verify `cd server && pnpm build` compiles to dist/
- [ ] Commit: `chore: add Render deployment configuration`

---

## Plan Notes

- **TDD:** Every task follows RED (write failing test) → GREEN (minimal implementation) → REFACTOR → COMMIT
- **One file at a time:** Never implement multiple files in one step
- **Explain first:** Before writing code, explain WHAT and WHY per project rules
- **iOS design:** Applied in Phase 13 but keep in mind during all phases — no anti-patterns
- **Future:** Redux Toolkit + RTK Query upgrade (see design spec)
