# Daily Schedule Templates

## Problem

Users repeat the same tasks every day. Manually adding 9+ tasks each morning is tedious. The existing "rollover" setting is a no-op — it's a UI dropdown with no backend logic.

## Solution

Per-user task templates that auto-populate each day. Each template item has its own duration and optional link. Day/Night sessions are visual sections within the flat task list.

## Data Model

### New: TaskTemplate table

One row per recurring task. Fields: title, url (optional), durationMin, session ("day" or "night"), position, userId.

### Changes to Task table

Add: url (optional), durationMin (required — no more global fallback), session ("day" or "night").

### Changes to Settings table

Add: autoPopulate (boolean, default true).

### Remove from Settings

focusInterval becomes a default for new task input only, not a timer driver. Keep the field but repurpose it.

## Auto-Populate Flow

When opening a day for the first time:

1. If taskOverflow is "carry", bring yesterday's incomplete tasks to today first
2. If autoPopulate is on, create tasks from templates — skip any whose title matches a carried-over task
3. Day session tasks positioned first, Night after

Order: carried-over tasks at top, then template tasks fill in.

## Rollover Logic (actually implementing it)

When taskOverflow = "carry": on day access, find yesterday's tasks with status "queued" or "active", create copies on today with status "queued". Close any running sessions on yesterday's tasks.

When taskOverflow = "keep" or "drop": do nothing (keep = tasks stay, drop = user deletes manually).

## Template Editor

New section in Settings page — "Daily Schedule". Visual style matches the existing task list.

Grouped into Day and Night sections. Each item shows: title, duration, link icon if URL set.

Interactions: add (title + duration + optional URL + session picker), drag-to-reorder within session, inline edit title, delete on hover.

## Per-Task Timers

Every task has durationMin. The timer always uses the task's value, never falls back to a global setting. The focusInterval setting only pre-fills the duration input when manually adding a new task.

Add-task input gains a duration field: title, duration (defaults to focusInterval), add button.

## Prerequisites (existing bugs to fix)

- Drag-and-drop reorder: currently waits for server response. Needs optimistic update in onMutate.
- Add task: same issue — needs optimistic create so the task appears instantly.
- Timer persistence via sessions (already fixed in this branch).
