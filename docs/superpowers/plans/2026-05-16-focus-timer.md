# Focus Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the up-counting timer with a countdown system, add a dedicated `/timer` page with a round Pomodoro clock, floating nav indicator, and automatic break cycling between tasks.

**Architecture:** Timer state (activeTaskId, elapsed, isRunning, breakMode) is lifted into a `TimerContext` shared between PlaylistView and the new TimerPage. The `useTimer` hook gains countdown support. Break cycling lives in the context so both pages trigger it consistently. A floating pill indicator provides navigation to `/timer` from any other page.

**Tech Stack:** React 19, TypeScript, React Router, React Context, SVG (progress ring), Vitest, React Testing Library, Prisma, Express, Zod

---

## File Map

**New files:**
- `client/src/context/TimerContext.tsx` — shared timer state provider (active task, break mode, countdown)
- `client/src/pages/TimerPage.tsx` — the `/timer` route, centered Pomodoro clock layout
- `client/src/components/timer/PomodoroClock.tsx` — round SVG ring + countdown + controls
- `client/src/components/timer/FloatingTimerIndicator.tsx` — bottom-right pill, navigates to `/timer`
- `client/src/components/timer/DurationPills.tsx` — reusable preset chip row (25/30/45/60/90/120)
- `client/src/__tests__/PomodoroClock.test.tsx` — clock component tests
- `client/src/__tests__/TimerContext.test.tsx` — context logic tests

**Modified files:**
- `client/src/hooks/useTimer.ts` — add `targetSeconds` param, return `remaining`
- `client/src/App.tsx` — add `/timer` route, render FloatingTimerIndicator, wrap with TimerProvider
- `client/src/components/playlist/PlaylistView.tsx` — consume TimerContext instead of local timer state, wire break cycling
- `client/src/components/playlist/TaskItem.tsx` — show remaining time instead of elapsed
- `client/src/components/playlist/AddTaskInput.tsx` — update duration chips to match new presets
- `client/src/pages/SettingsPage.tsx` — update chips, add break duration setting
- `client/src/api/queries.ts` — add `breakDuration` to SettingsData interface
- `server/prisma/schema.prisma` — add `breakDuration` field to Settings model
- `server/src/routes/settings.ts` — add `breakDuration` to Zod validation schema
- `server/src/__tests__/settings.test.ts` — test breakDuration field

---

## Task 1: Add `breakDuration` to database and API

**Files:**
- Modify: `server/prisma/schema.prisma:29` (Settings model)
- Modify: `server/src/routes/settings.ts` (Zod schema)
- Modify: `server/src/__tests__/settings.test.ts`
- Modify: `client/src/api/queries.ts:37` (SettingsData interface)

- [ ] **Step 1: Add `breakDuration` to Prisma schema**

Add `breakDuration Int @default(1) @map("break_duration")` to the Settings model, after `autoPopulate`.

- [ ] **Step 2: Run migration**

Run: `cd server && npx prisma migrate dev --name add-break-duration`
Expected: migration created and applied.

- [ ] **Step 3: Update Zod validation in settings route**

Add `breakDuration: z.number().int().min(1).max(60)` to the update schema in the settings route handler.

- [ ] **Step 4: Write failing test for breakDuration**

Add test to `settings.test.ts`:

```ts
it("should update break duration", async () => {
  const res = await request(app)
    .patch("/api/settings")
    .set("Authorization", authHeader())
    .send({ breakDuration: 5 });
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ breakDuration: 5 });
});
```

- [ ] **Step 5: Run test**

Run: `pnpm test -- --filter server`
Expected: PASS (Zod + Prisma handle it automatically since schema and validation are updated).

- [ ] **Step 6: Update SettingsData interface on client**

Add `breakDuration: number` to the `SettingsData` interface in `queries.ts`.

- [ ] **Step 7: Commit**

```
feat: add break duration to settings model and API
```

---

## Task 2: Add countdown support to `useTimer` hook

**Files:**
- Modify: `client/src/hooks/useTimer.ts`
- Modify: `client/src/__tests__/useTimer.test.ts` (create if not exists)

- [ ] **Step 1: Write failing tests for countdown mode**

Create `client/src/__tests__/useTimer.test.tsx`:

Test cases:
- `start(0, 1500)` — starts with 1500 target seconds, `remaining` is 1500, `elapsed` is 0
- after 1 tick — `remaining` is 1499, `elapsed` is 1
- `pause()` — `remaining` freezes, `isRunning` is false
- `resume()` — `remaining` continues depleting
- `reset()` — `remaining` is 0, `isRunning` is false, `elapsed` is 0

Use `@testing-library/react` `renderHook` and `act` with `vi.useFakeTimers()`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- client/src/__tests__/useTimer.test.tsx`
Expected: FAIL — hook doesn't accept `targetSeconds` or return `remaining`.

- [ ] **Step 3: Update useTimer to support countdown**

Add optional `targetSeconds` parameter to `start()`. Track it in a ref. Add `remaining` to the return value: `targetSeconds > 0 ? targetSeconds - elapsed : elapsed`. This way: if `targetSeconds` is provided, the hook counts down (returns remaining); if not, it counts up (returns elapsed as remaining, backward compatible).

Return shape: `{ elapsed, remaining, isRunning, start, pause, resume, reset }`

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- client/src/__tests__/useTimer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```
feat: add countdown mode to useTimer hook
```

---

## Task 3: Create TimerContext

**Files:**
- Create: `client/src/context/TimerContext.tsx`
- Create: `client/src/__tests__/TimerContext.test.tsx`

- [ ] **Step 1: Write failing tests for TimerContext**

Test cases for the context:
- `startTask(taskId, durationSeconds)` — sets activeTaskId, starts timer in countdown mode, breakMode is false
- `pauseTask()` — pauses timer, clears activeTaskId
- `completeTask()` — resets timer, clears activeTaskId, transitions to break if breakDuration > 0
- `startBreak(durationSeconds)` — sets breakMode true, starts timer in countdown mode
- `skipBreak()` — ends break, resets timer
- `tickPastZero()` — when remaining hits 0 during a task, calls onComplete callback
- `breakEnds()` — when remaining hits 0 during break, calls onBreakEnd callback

Use `renderHook` with a wrapper that provides the context.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- client/src/__tests__/TimerContext.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement TimerContext**

The context holds:
- `activeTaskId: string | null`
- `breakMode: boolean`
- Timer instance from `useTimer` (internal)
- `startTask(taskId, durationSec)` — sets activeTaskId, calls `timer.start(0, durationSec)`
- `pauseTask()` — pauses timer, clears activeTaskId
- `completeTask()` — resets timer, clears activeTaskId
- `startBreak(durationSec)` — sets breakMode true, calls `timer.start(0, durationSec)`
- `skipBreak()` — resets timer, sets breakMode false
- Exposes: `activeTaskId`, `breakMode`, `remaining`, `isRunning`, plus all action functions

The context does NOT own task mutation logic (that stays in PlaylistView). It only owns timer state. PlaylistView passes callbacks for what happens when timer hits zero.

- [ ] **Step 4: Run tests**

Run: `pnpm test -- client/src/__tests__/TimerContext.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```
feat: add TimerContext for shared timer state
```

---

## Task 4: Wire TimerContext into App and PlaylistView

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/playlist/PlaylistView.tsx`

- [ ] **Step 1: Wrap App with TimerProvider**

In App.tsx, import `TimerProvider` from the new context file. Wrap the `AppShell` component (inside the `SignedIn` block) with `<TimerProvider>`. Add the `<FloatingTimerIndicator />` component (created in Task 6) inside `AppShell` — it reads from TimerContext and only shows when a timer is active and the current route is not `/timer`.

For now, skip rendering FloatingTimerIndicator — just wire the provider. We'll add the indicator after building it.

- [ ] **Step 2: Refactor PlaylistView to use TimerContext**

Replace local `useTimer()` and `activeTaskId` state with values from `useTimerContext()`. Map the existing handlers:
- `handleStart` → calls `context.startTask(taskId, durationMin * 60)` instead of local `timer.start()`
- `handlePause` → calls `context.pauseTask()` instead of local `timer.pause()`
- `handleComplete` → calls `context.completeTask()` instead of local `timer.reset()` + `setActiveTaskId(null)`

Keep the task mutation calls (`updateTask.mutate`) — those stay in PlaylistView. The context only manages timer state.

Remove the local `useTimer()` import and the `activeTaskId` state.

- [ ] **Step 3: Verify existing playlist tests still pass**

Run: `pnpm test`
Expected: All existing tests PASS. PlaylistView behavior unchanged from user perspective.

- [ ] **Step 4: Commit**

```
refactor: lift timer state into TimerContext
```

---

## Task 5: Build the PomodoroClock component

**Files:**
- Create: `client/src/components/timer/PomodoroClock.tsx`
- Create: `client/src/components/timer/DurationPills.tsx`
- Create: `client/src/__tests__/PomodoroClock.test.tsx`

- [ ] **Step 1: Write failing tests for PomodoroClock**

Test cases:
- Renders the countdown time formatted as mm:ss
- Renders the task title when a task is active
- Renders "Break" when in break mode
- Shows pause button when running
- Shows play button when paused
- Shows skip button during break
- Calls onPause when pause button clicked
- Calls onComplete when complete button clicked
- Calls onSkipBreak when skip button clicked during break
- Progress ring stroke-dashoffset changes based on remaining/total ratio

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- client/src/__tests__/PomodoroClock.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement DurationPills component**

A reusable row of duration preset chips: 25, 30, 45, 60, 90, 120 minutes. Props: `selected: number`, `onSelect: (min: number) => void`. Each chip is a small `rounded-full` button, primary when selected, muted otherwise. Matches the chip pattern in SettingsPage.

- [ ] **Step 4: Implement PomodoroClock component**

Props:
- `remaining: number` — seconds left
- `total: number` — total duration in seconds
- `isRunning: boolean`
- `breakMode: boolean`
- `taskTitle: string | null`
- `onPause`, `onResume`, `onComplete`, `onSkipBreak` — callbacks

Structure:
- Outer wrapper: centered flex container
- SVG circle: two concentric circles — background track (primary/10) and progress ring (primary, or teal during break). Use `stroke-dasharray` = circumference, `stroke-dashoffset` = circumference * (1 - progress). Rotate -90deg so depletion starts from top.
- Inside the SVG overlay (absolute positioned): time display `mm:ss` in large tabular-nums, control buttons row below it
- Below the circle: task title text (muted) and DurationPills row

Size: ~260px diameter. Ring stroke: 4px.

- [ ] **Step 5: Run tests**

Run: `pnpm test -- client/src/__tests__/PomodoroClock.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```
feat: add PomodoroClock and DurationPills components
```

---

## Task 6: Build TimerPage and floating indicator

**Files:**
- Create: `client/src/pages/TimerPage.tsx`
- Create: `client/src/components/timer/FloatingTimerIndicator.tsx`
- Modify: `client/src/App.tsx` — add route + render indicator

- [ ] **Step 1: Implement FloatingTimerIndicator**

A small pill fixed to bottom-right. Reads from TimerContext. Shows when `isRunning` is true AND current route is not `/timer`. Displays: `mm:ss` countdown + truncated task title (or "Break"). Clicking navigates to `/timer`.

Styling: `fixed bottom-6 right-6`, `rounded-full`, `bg-card shadow-lg ring-1 ring-border/50`, `px-4 py-2`, small text. Uses `useNavigate` from React Router and `useLocation` to check current path.

- [ ] **Step 2: Implement TimerPage**

Reads from TimerContext. Renders PomodoroClock centered in the main content area.

Layout:
- `flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]` to vertically center
- PomodoroClock receives `remaining`, `total`, `isRunning`, `breakMode`, `taskTitle` from context
- Passes control callbacks that call context actions + PlaylistView mutations (task status updates)

The page needs access to the current day's tasks to find the active task's title and duration. It reads from the URL param `date` (query param or last visited day stored in context). For now, use the current date.

Break cycling logic: when `remaining` hits 0 and it's a task (not break), the context fires `onTaskComplete`. The page then: auto-pauses the task, starts break via `context.startBreak(breakDuration * 60)`. When break remaining hits 0, the page finds the next queued task and auto-starts it via `context.startTask`.

- [ ] **Step 3: Add `/timer` route to App.tsx**

Add `<Route path="timer" element={<TimerPage />} />` to the AppShell routes. Also render `<FloatingTimerIndicator />` inside AppShell (not inside main, so it floats over the sidebar too).

- [ ] **Step 4: Verify manually**

Run: `pnpm dev` and navigate to `/day/<today>`, start a task timer. Verify floating indicator appears. Click it to go to `/timer`. Verify PomodoroClock shows countdown. Pause/complete/skip should work.

- [ ] **Step 5: Commit**

```
feat: add TimerPage with Pomodoro clock and floating indicator
```

---

## Task 7: Update settings and AddTaskInput for new presets and break duration

**Files:**
- Modify: `client/src/pages/SettingsPage.tsx`
- Modify: `client/src/components/playlist/AddTaskInput.tsx`

- [ ] **Step 1: Update SettingsPage**

Change `INTERVAL_CHIPS` from `[10, 25, 45]` to `[25, 30, 45, 60, 90, 120]`. Increase the `max` on the number input from 120 to 480 (8 hours).

Add a new "Break duration" section below "Default task duration" — same pattern: number input + label, no chips (breaks are short). Saves to `breakDuration` via `updateSettings.mutate({ breakDuration: value })`.

- [ ] **Step 2: Update AddTaskInput**

Change the default duration pills (if any) or add them matching the new preset values. The `defaultDuration` prop still comes from `focusInterval` in settings.

- [ ] **Step 3: Verify settings page renders correctly**

Run: `pnpm dev`, navigate to settings. Verify new chips show, break duration input appears, values save correctly.

- [ ] **Step 4: Commit**

```
feat: update duration presets and add break duration setting
```

---

## Task 8: Update TaskItem to show remaining time

**Files:**
- Modify: `client/src/components/playlist/TaskItem.tsx`

- [ ] **Step 1: Update TaskItem display**

The `elapsed` prop from PlaylistView will now be `remaining` seconds from the context. Update `formatTime` call and the progress calculation. Instead of `(elapsed / intervalSeconds) * 100`, use `((intervalSeconds - remaining) / intervalSeconds) * 100` — progress fills up as time passes.

Rename the prop from `elapsed` to `remaining` in `TaskItemProps` for clarity.

- [ ] **Step 2: Verify TaskItem displays correctly**

Run: `pnpm dev`, start a task. Verify the inline timer shows countdown (decreasing) instead of count-up.

- [ ] **Step 3: Commit**

```
fix: show remaining time in TaskItem instead of elapsed
```

---

## Task 9: Wire break cycling in PlaylistView

**Files:**
- Modify: `client/src/components/playlist/PlaylistView.tsx`

- [ ] **Step 1: Add break cycling logic**

In PlaylistView, add a `useEffect` that watches `context.remaining`. When it hits 0 and `context.activeTaskId` is set (task timer ended, not break):
1. Call `updateTask.mutate({ taskId: activeTaskId, body: { status: "completed" } })`
2. Get `breakDuration` from settings
3. Call `context.startBreak(breakDuration * 60)`

When `context.remaining` hits 0 and `context.breakMode` is true:
1. Find the next queued task in the current day
2. If found: call `updateTask.mutate({ taskId: nextTask.id, body: { status: "active" } })` then `context.startTask(nextTask.id, nextTask.durationMin * 60)`
3. If not found: call `context.skipBreak()` (resets to idle)

- [ ] **Step 2: Verify full Pomodoro cycle**

Run: `pnpm dev`, add 2-3 tasks with short durations (1 min for testing). Start the first task. Verify:
1. Timer counts down
2. When it hits 0, notification fires, task auto-completes
3. Break timer starts, floating indicator updates
4. When break ends, next task auto-starts
5. Cycle repeats until no tasks remain

- [ ] **Step 3: Commit**

```
feat: wire break cycling with auto-start next task
```
