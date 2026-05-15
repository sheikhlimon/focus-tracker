# Focus Timer with Break Cycling

## Problem

Tasks have a `durationMin` field and a timer that counts up, but there's no visible countdown and no break system. The current timer auto-pauses at the target duration — functional but easy to ignore.

## Solution

Flip the timer to countdown mode, add a dedicated timer page with a round Pomodoro clock, a floating indicator for quick navigation, and automatic break cycling between tasks.

## What Changes

### 1. Countdown instead of count-up

`useTimer` gets a countdown mode. You set a target duration in seconds; the hook returns `remaining = duration - elapsed`. It still tracks elapsed internally for session storage, but all displays show remaining time. The notification fires when remaining hits zero, then auto-pauses the task.

### 2. Timer page (route: `/timer`)

A dedicated full-page view inside the main content area. The entire page is centered around the Pomodoro clock. This is where you go when you want to focus — the clock dominates the view.

**Route:** `/timer` — added to App.tsx alongside existing `/day/:date` and `/settings` routes.

**Page layout — vertically centered in the main content area:**

- The round Pomodoro clock, large and prominent (~260px diameter)
- Task title (or "Break") below the clock
- Duration preset pills below the title
- Session summary at bottom (tasks completed this session, total focus time)

**Clock visual structure:**

The clock is a circle. The ring border acts as a progress ring — it depletes as time passes, using `stroke-dashoffset` on an SVG circle. Inside the ring: the countdown in large tabular figures, with control buttons below the time.

```
          ┌───────────────────┐
         ╱                     ╲        ← progress ring (SVG circle, depletes clockwise)
        │                       │
        │       23:45           │       ← large countdown, tabular-nums, Geist font
        │                       │
        │     ⏸   ✓   ⏭       │       ← pause / complete / skip buttons
         ╲                     ╱
          └───────────────────┘
          Design review                  ← task title, muted text
      25  30  45  60  90  120           ← duration preset pills, tiny rounded chips
```

**States:**
- Idle (no task selected) — shows "Select a task" prompt, or if arrived from a running timer, shows that timer
- Task running — task title, countdown depleting, pause/complete buttons active
- Break running — "Break" label, countdown, ring color shifts to softer tone (teal/green), skip button
- Timer complete — ring fully depleted, gentle pulse animation, auto-pauses

**Styling details:**
- Ring: 4px stroke, primary/20 track, primary fill. Break mode uses a teal/green tone.
- Time display: text-3xl, font-semibold, tabular-nums, tracking-tight
- Buttons: small icon-only, rounded-full, muted on idle, primary on hover
- Entry/exit: fade + slight scale animation on the whole page
- Overall: vertically centered, generous negative space, iOS-clean feel matching the rest of the app

### 3. Floating timer indicator

A small floating pill in the bottom-right corner, only visible when a timer is running (task or break) and the user is on a different page. Clicking it navigates to `/timer`.

**Not the full clock** — just a compact indicator:
- Shows countdown in mm:ss, a tiny progress dot or bar, and the task title truncated
- `fixed bottom-6 right-6`, rounded-full pill shape, subtle shadow
- Fades in/out with a slight slide-up animation
- On the `/timer` page itself, this indicator is hidden (the full clock is visible instead)

### 4. Break cycling

When a task timer completes:
1. Task auto-pauses (current behavior)
2. Clock switches to break mode — ring color changes, label says "Break"
3. Break countdown starts (configurable duration, default 1 min)
4. When break ends, next queued task auto-starts
5. If no queued tasks remain, clock shows idle state

Break can be skipped at any time via the skip button inside the clock.

New setting: "Break duration" — number input, default 1 min, stored as `breakDuration` in the Settings model. Shown on the settings page alongside the existing "Default task duration" field.

### 5. Preset duration chips

Update the quick-select chips in both AddTaskInput and Settings to: 25, 30, 45, 60, 90, 120 minutes. The custom number input stays for non-preset values. These same chips appear below the timer clock on the timer page.

### 6. Timer state sharing

Since the timer page and playlist view both need to know about the active timer, the timer state (activeTaskId, elapsed, isRunning, break mode) should be lifted to a shared context or kept in PlaylistView and passed via URL params/context. The simplest approach: a lightweight `TimerContext` that PlaylistView writes to and the timer page reads from.

## Data Model Changes

Settings model gets a new field:
- `breakDuration` — Int, default 1 (minutes)

No schema changes to Task or Session.

## Files to Modify

- `client/src/hooks/useTimer.ts` — add countdown mode, return `remaining`
- `client/src/App.tsx` — add `/timer` route
- `client/src/components/playlist/PlaylistView.tsx` — wire up break cycling, write timer state to context
- `client/src/components/playlist/AddTaskInput.tsx` — update duration chips
- `client/src/pages/SettingsPage.tsx` — add break duration setting, update focus interval chips
- `client/src/components/playlist/TaskItem.tsx` — show remaining time instead of elapsed on active tasks

## New Files

- `client/src/pages/TimerPage.tsx` — dedicated timer page with the round Pomodoro clock
- `client/src/components/timer/PomodoroClock.tsx` — the round clock component (SVG ring + countdown + controls)
- `client/src/components/timer/FloatingTimerIndicator.tsx` — small floating pill that navigates to `/timer`
- `client/src/context/TimerContext.tsx` — shared timer state between playlist and timer page
- `server/prisma/migrations/...` — add `breakDuration` column to Settings

## Out of Scope

- Break duration per task (uses global setting)
- Long breaks after N tasks (keep it simple)
- Sound effects for timer completion
- Timer persistence across page refreshes
