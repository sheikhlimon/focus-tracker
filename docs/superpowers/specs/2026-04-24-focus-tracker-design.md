# FocusTracker — Full-Stack Redesign

**Date:** 2026-04-24
**Status:** Approved

## Overview

Transform the existing client-only daily tasks app into a full-stack focus session tracker with calendar navigation, Pomodoro-style timers, drag-and-drop task reordering, and multi-user support.

**Core use case:** Sequential task playlist — queue up what to study/work on, work through them top to bottom, track time spent on each.

## Architecture

### Stack

| Layer         | Technology                                          |
| ------------- | --------------------------------------------------- |
| Frontend      | React 19 + TypeScript + Vite + Tailwind CSS         |
| Backend       | Express.js + TypeScript                             |
| Database      | PostgreSQL                                          |
| ORM           | Prisma                                              |
| Auth          | JWT (access + refresh tokens), email/password       |
| State         | React Query (server) + useState/useContext (client) |
| Drag-and-Drop | @dnd-kit/core + @dnd-kit/sortable                   |
| Package Mgr   | pnpm (workspaces for monorepo)                      |

### Data Model

```
User
  ├── email, password_hash, name
  └── Settings (1:1)
        ├── focus_interval (minutes), default 25
        ├── notifications_enabled, default true
        ├── task_overflow: "keep" | "rollover", default "keep"
        ├── theme: "light" | "dark" | "system", default "system"
        └── week_starts_on: "monday" | "sunday", default "monday"

User → has many → Day
Day (date, unique per user)
  └── has many → Task
        ├── title, position (integer, for ordering)
        ├── status: "queued" | "active" | "completed"
        └── has many → Session
              ├── start_time, end_time, duration_seconds
              ├── status: "running" | "paused" | "completed"
              └── pauses: [{ at, resumed_at }]
```

Days are lazily created — first task added to a date creates the day record.

## API Design

### Auth

```
POST   /api/auth/signup      — create account
POST   /api/auth/login       — login, returns access + refresh tokens
POST   /api/auth/refresh     — refresh access token
POST   /api/auth/logout      — invalidate refresh token
```

### Days

```
GET    /api/days?month=2026-04   — all days with task summaries for a month
GET    /api/days/:date           — single day with full task list
POST   /api/days/:date           — create/plan a future day
```

### Tasks

```
POST   /api/days/:date/tasks          — add task to a day
PATCH  /api/days/:date/tasks/:id      — update task (rename, status)
DELETE /api/days/:date/tasks/:id      — delete task
PATCH  /api/days/:date/tasks/reorder  — bulk reorder (drag-and-drop)
```

### Sessions (Timer)

```
POST   /api/tasks/:id/sessions       — start session (creates with start_time)
PATCH  /api/sessions/:id             — pause/resume (tracks pauses)
PATCH  /api/sessions/:id/complete    — stop timer, log duration, mark task done
```

### Settings

```
GET    /api/settings                 — get user settings
PATCH  /api/settings                 — update settings (auto-save, debounced)
```

## Client Architecture

### Routing (React Router)

```
/                 → Calendar view (home)
/day/:date        → Playlist view for a specific date
/settings         → Settings page
/auth/login       → Login page
/auth/signup      → Signup page
```

### State Management

**Server state (React Query):**

- `useDay(date)` — fetches tasks for a date, cached per date
- `useMonth(month)` — fetches calendar overview (task counts per day)
- `useSettings()` — user preferences
- Auto-invalidates on mutations (complete task → refresh day + month)

**Client state (useState/useContext):**

- Active timer: task ID, elapsed seconds, running/paused, interval ref
- UI: selected date, sidebar state, mobile view transitions
- Drag-and-drop: temporary reorder state during drag

**Timer:** Runs client-side via `setInterval`, syncs to server only on pause/complete.

### Component Tree

```
App
├── AuthProvider
├── Sidebar (always visible on desktop)
│   ├── SidebarHeader (logo, settings icon, avatar)
│   └── DateCard[] (grouped: Today / Upcoming / Past)
├── MainPanel (switches between views)
│   ├── CalendarView (month grid — default on desktop, home on mobile)
│   └── PlaylistView (task queue — when date selected)
│       ├── PlaylistHeader (date, global timer, back-to-calendar button)
│       ├── AddTaskInput
│       ├── TaskItem[] (drag handle, timer controls, start/pause/done/delete)
│       └── CompletedList (dimmed, shows time spent)
└── SettingsPage
```

### Responsive Behavior

**Desktop (≥768px):**

- Left sidebar with date cards always visible
- Right panel toggles: calendar grid (default) ↔ playlist (date selected)
- Clicking date in sidebar or calendar grid opens playlist in right panel
- "Calendar" button returns to grid view

**Mobile (<768px):**

- Full-page transitions
- Calendar grid + date cards as home screen
- Tap date → slides to full-page playlist
- "← Calendar" back button returns to home

## Timer & Pomodoro System

### Timer Lifecycle

```
Idle → Start → Running → Pause → Paused → Resume → Running → Complete → Done
                ↓                                          ↓
          (setInterval)                              (marks task done,
          (local counter)                             logs duration,
                                                    auto-completes)
```

### Session Storage

Sessions track focus time with break support:

- `start_time`, `end_time` — full session window
- `duration_seconds` — actual focused time (excludes pauses)
- `pauses: [{ at, resumed_at }]` — each break logged
- Server calculates net duration on complete

### Pomodoro Notifications

- User sets custom focus interval in settings (free-form number input, any minutes)
- Suggested quick-pick chips: 10, 25, 45 minutes
- When elapsed time hits interval → browser Notification API fires
- Notification text: "You've been working on {task title} for {X} minutes"
- Timer keeps running — notification is a nudge, not a pause
- Visual progress bar on active task shows interval progress

## Drag-and-Drop

- Library: `@dnd-kit/core` + `@dnd-kit/sortable`
- Scope: within a single day's task list only (no cross-day dragging)
- Visual: drag handle (⠿) on left of each task, lift animation on pickup
- On drop: bulk `PATCH /api/days/:date/tasks/reorder` with updated position array

## Settings

| Setting        | Type                          | Default  | Description                                 |
| -------------- | ----------------------------- | -------- | ------------------------------------------- |
| Focus interval | number (minutes)              | 25       | Free-form input, any value                  |
| Notifications  | boolean                       | true     | Browser notification toggle                 |
| Task overflow  | "keep" \| "rollover"          | "keep"   | Unfinished tasks stay or auto-move to today |
| Theme          | "light" \| "dark" \| "system" | "system" | Existing theme system preserved             |
| Week starts on | "monday" \| "sunday"          | "monday" | Calendar grid first column                  |

Changes auto-save via debounced PATCH to `/api/settings`.

## Design Aesthetic

iOS-inspired premium feel:

- Light mode: clean whites (#FFFFFF), off-whites (#F2F2F7), subtle gray borders
- Dark mode: true blacks (#000000), dark grays (#1C1C1E), elevated surfaces (#2C2C2E)
- Accent: system blue (#007AFF) for primary actions, not generic indigo
- Typography: Inter (web equivalent of SF Pro), crisp weight hierarchy
- Shadows: subtle, only on elevated elements (active task card, modals)
- Border radii: mixed — 16px on cards, 8px on buttons, 4px on inputs
- One gradient: subtle accent glow on active task card only
- Micro-interactions: smooth 200ms transitions between calendar ↔ playlist
- No anti-patterns: no generic blue everywhere, no gradient backgrounds, no same radius on everything

## Project Structure

```
daily-tasks-app/
├── client/                  # React frontend (current src/ moves here)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # Login, Signup forms
│   │   │   ├── calendar/    # CalendarView, DateCard
│   │   │   ├── playlist/    # PlaylistView, TaskItem, AddTaskInput
│   │   │   ├── settings/    # SettingsPage
│   │   │   └── layout/      # Sidebar, MainPanel
│   │   ├── hooks/           # useTimer, useDay, useMonth, useSettings
│   │   ├── api/             # React Query config + query hooks
│   │   ├── context/         # AuthContext, ThemeContext (existing)
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # helpers
│   └── ...
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # auth, days, tasks, sessions, settings
│   │   ├── middleware/      # auth, validation, error handling
│   │   ├── services/        # business logic
│   │   └── utils/           # helpers
│   ├── prisma/
│   │   └── migrations/      # database migrations
│   └── ...
└── pnpm-workspace.yaml      # pnpm workspace config
```

**pnpm workspaces:** Root `pnpm-workspace.yaml` defines `client/` and `server/` as workspace members. Shared dev dependencies (TypeScript, ESLint, Prettier) at root level.

```

## Testing Strategy (TDD)

- **Unit tests:** Vitest for server services, React Testing Library for components
- **Integration tests:** API route tests hitting a test PostgreSQL database
- **E2E tests:** Playwright for full flows (login → add task → start timer → complete)
- Red-green cycle for every feature

## Future Improvements

1. **Upgrade to Redux Toolkit + RTK Query** — consolidate all state management into one system
2. **Recurring tasks** — plan "every Monday" type tasks
3. **Weekly/monthly stats dashboard** — time spent per topic, streaks
4. **Export data** — CSV/JSON export of time logs
5. **Dark/light mode transitions** — animated theme switching
6. **Offline support** — service worker for offline task creation
7. **Cross-device sync** — WebSocket for real-time timer sync
```
