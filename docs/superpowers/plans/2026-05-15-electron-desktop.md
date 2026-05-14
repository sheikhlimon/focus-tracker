# Electron Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship FocusTracker as a standalone desktop app for Windows, Mac, and Linux with local SQLite storage, no auth, distributed via GitHub Releases.

**Architecture:** IPC bridge between Electron main process and React renderer. Main process handles Prisma/SQLite queries. ApiClientProvider detects Electron and routes calls through IPC instead of fetch. Same React codebase, different transport layer.

**Tech Stack:** Electron, electron-builder, Prisma (SQLite), electron-updater, GitHub Actions

**Design spec:** `docs/superpowers/specs/2026-05-15-electron-desktop-design.md`

---

## File Structure

**New files:**
- `electron/main.ts` — Electron main process. Creates window, loads React app, registers IPC handlers, initializes database.
- `electron/preload.ts` — Exposes IPC methods to renderer via contextBridge.
- `electron/ipc/handlers.ts` — Maps IPC channel names to Prisma service functions.
- `electron/ipc/channels.ts` — Channel name constants shared between main and preload.
- `electron/database.ts` — Prisma client initialization, migration runner, SQLite path resolution.
- `electron/services/` — Local versions of server services (days, tasks, sessions, settings, templates). Same logic as server/src/services/ but without auth/userId.
- `electron-prisma/schema.prisma` — SQLite schema (User model stripped, no userId).
- `electron-builder.yml` — Build config for packaging and distribution.
- `.github/workflows/release.yml` — CI for building and releasing on all platforms.
- `client/src/api/electron-adapter.ts` — API client that calls window.electronAPI instead of fetch.

**Modified files:**
- `client/src/api/ApiClientProvider.tsx` — Detect Electron vs browser, use appropriate adapter.
- `package.json` — Add electron dependencies and scripts.

**Unchanged:**
- All React components, hooks, styles, @dnd-kit setup
- React Query hooks in `queries.ts`
- Web deployment on Vercel

---

### Task 1: Add Electron dependencies and project config

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Electron and build dependencies**

Run: `pnpm add -D electron electron-builder electron-updater @electron/notarize concurrently wait-on`

- [ ] **Step 2: Add Electron scripts to root package.json**

Add scripts for local Electron dev, build, and release. The dev script should concurrently run the Vite dev server and Electron, waiting for Vite to be ready before launching Electron. The build script should build the client first, then package with electron-builder.

- [ ] **Step 3: Add Electron entry point config**

Set "main" field in package.json to point to the compiled electron/main.js file.

- [ ] **Step 4: Commit**

Commit message: `chore: add Electron dependencies and scripts`

---

### Task 2: Create SQLite Prisma schema

**Files:**
- Create: `electron-prisma/schema.prisma`

- [ ] **Step 1: Create the schema file**

Copy the schema from `server/prisma/schema.prisma` and make these changes:
- Change provider from `postgresql` to `sqlite`
- Change url from `env("DATABASE_URL")` to `file:./focus-tracker.db`
- Remove the User model entirely
- Remove userId field and user relation from Settings
- Remove userId field and user relation from Day
- Remove userId field and user relation from TaskTemplate
- Remove `@@unique([date, userId])` from Day
- Keep Task, Session, TaskTemplate, Settings, Day models with all other fields intact
- Settings becomes a singleton (just one row, no userId)

- [ ] **Step 2: Generate Prisma client for SQLite**

Run: `cd electron-prisma && npx prisma generate`

The output path should be configured so the generated client is importable from the electron/ directory.

- [ ] **Step 3: Commit**

Commit message: `feat: add SQLite Prisma schema for Electron`

---

### Task 3: Create Electron main process and database setup

**Files:**
- Create: `electron/database.ts`
- Create: `electron/main.ts`

- [ ] **Step 1: Create database.ts**

This module handles:
- Resolve the SQLite file path using Electron's app.getPath("userData") API
- Create the data directory if it doesn't exist
- Initialize PrismaClient with the SQLite file path
- Run migrations on first launch by checking if the DB file exists and running prisma migrate deploy if not
- Export the initialized PrismaClient instance

- [ ] **Step 2: Create main.ts**

This is the Electron entry point. It should:
- Import database initialization
- Import IPC handlers (will be created in Task 5)
- Call app.whenReady(), then create a BrowserWindow
- Load the appropriate URL: localhost in dev mode, the built index.html in production
- Register IPC handlers after database is ready
- Handle window lifecycle (macOS dock behavior, all-windows-closed)
- Handle app quit to close Prisma connection

- [ ] **Step 3: Verify Electron launches an empty window**

Run the Electron dev script. A blank window should open. It will show nothing useful yet since the React app isn't loading. This is expected — just verify the window appears and no errors in terminal.

- [ ] **Step 4: Commit**

Commit message: `feat: add Electron main process and database setup`

---

### Task 4: Create local service functions

**Files:**
- Create: `electron/services/days.ts`
- Create: `electron/services/tasks.ts`
- Create: `electron/services/sessions.ts`
- Create: `electron/services/settings.ts`
- Create: `electron/services/templates.ts`

- [ ] **Step 1: Create settings service**

Port the logic from `server/src/services/settings.ts` but remove all userId parameters. Since there's only one user, the service always operates on the single Settings row. Use upsert for get/update — if no Settings row exists, create one with defaults.

Functions needed: getSettings, updateSettings

- [ ] **Step 2: Create days service**

Port from `server/src/services/days.ts`, remove userId. Functions: getDayByDate (returns day with tasks and sessions included), getMonthDays (returns days with task counts for a given month), createDay (upsert by date). Keep the rollover and auto-populate logic from the server version.

Functions needed: getMonthDays, getDayByDate

- [ ] **Step 3: Create tasks service**

Port from `server/src/services/tasks.ts`, remove userId. The addTask function takes dayId instead of resolving via userId. Update, delete, reorder stay the same logic.

Functions needed: addTask, updateTask, deleteTask, reorderTasks

- [ ] **Step 4: Create sessions service**

Port from `server/src/services/sessions.ts`. No changes needed beyond removing userId references (there are none in sessions).

Functions needed: startSession, stopSession, getSessionsByTask

- [ ] **Step 5: Create templates service**

Port from `server/src/services/templates.ts`, remove userId. Functions: getTemplates, addTemplate, updateTemplate, deleteTemplate, reorderTemplates.

Functions needed: getTemplates, addTemplate, updateTemplate, deleteTemplate, reorderTemplates

- [ ] **Step 6: Commit**

Commit message: `feat: add local Electron services`

---

### Task 5: Create IPC channel definitions and handlers

**Files:**
- Create: `electron/ipc/channels.ts`
- Create: `electron/ipc/handlers.ts`

- [ ] **Step 1: Create channels.ts**

Define channel name constants as a flat object. Each channel maps to one service function. The names should mirror the API endpoints: get-month, get-day, add-task, update-task, delete-task, reorder-tasks, get-settings, update-settings, get-templates, add-template, update-template, delete-template, reorder-templates. Each constant also defines its input type and return type so both main and preload stay in sync.

- [ ] **Step 2: Create handlers.ts**

Import the Prisma client from database.ts and all service functions from the services directory. Register an ipcMain.handle for each channel. Each handler receives the event and arguments, calls the corresponding service function, and returns the result. Wrap each handler in a try/catch that returns an error object on failure (matching the error shape the React app expects).

- [ ] **Step 3: Commit**

Commit message: `feat: add IPC channel definitions and handlers`

---

### Task 6: Create preload script

**Files:**
- Create: `electron/preload.ts`

- [ ] **Step 1: Create preload.ts**

Use contextBridge.exposeInWorld to expose an electronAPI object on the window. For each IPC channel defined in channels.ts, create a method that calls ipcRenderer.invoke with the channel name and arguments. The method names should match what the API adapter will call: getMonth, getDay, addTask, updateTask, deleteTask, reorderTasks, getSettings, updateSettings, getTemplates, addTemplate, updateTemplate, deleteTemplate, reorderTemplates.

The exposed object should also include an `isElectron: true` flag so the renderer can detect the environment.

- [ ] **Step 2: Configure the preload in BrowserWindow**

In main.ts, set the webPreferences.preload option to point to the compiled preload.js file. Set contextIsolation to true and nodeIntegration to false (security defaults).

- [ ] **Step 3: Commit**

Commit message: `feat: add Electron preload script`

---

### Task 7: Create Electron API adapter and update provider

**Files:**
- Create: `client/src/api/electron-adapter.ts`
- Modify: `client/src/api/ApiClientProvider.tsx`

- [ ] **Step 1: Create electron-adapter.ts**

This file creates an API client that matches the same interface as the fetch-based client (get, post, patch, delete) but routes through window.electronAPI instead. Each method maps the REST-style call to the corresponding IPC method: GET /days?month=X becomes electronAPI.getMonth(month), POST /days/:date/tasks becomes electronAPI.addTask(date, body), etc.

- [ ] **Step 2: Update ApiClientProvider.tsx**

Add environment detection: check if window.electronAPI exists. If it does, use the electron adapter instead of the fetch-based client. No need for Clerk's getToken in Electron mode. Keep the existing fetch client for browser mode unchanged.

- [ ] **Step 3: Add TypeScript types for window.electronAPI**

Declare the electronAPI type on the Window interface so TypeScript recognizes window.electronAPI. Put this in a types file or in the electron-adapter itself.

- [ ] **Step 4: Test the full flow locally**

Run the Electron dev script. The app should load, the React UI should render, and API calls should go through IPC to SQLite. Try adding a task, starting a timer, completing it. All features from the web version should work.

- [ ] **Step 5: Commit**

Commit message: `feat: add Electron API adapter and update provider`

---

### Task 8: Configure electron-builder and packaging

**Files:**
- Create: `electron-builder.yml`

- [ ] **Step 1: Create electron-builder.yml**

Configure appId, productName, directories (output to dist-electron), files to include (compiled electron/, built client/). Configure platform-specific settings: NSIS installer for Windows, DMG for macOS, AppImage for Linux. Set the Prisma SQLite binary to be included in the build. Configure publish target as GitHub releases.

- [ ] **Step 2: Add build scripts**

Add scripts to package.json: "electron:build" for building the Electron app locally, "electron:release" for publishing. The build script should run prisma generate for the Electron schema, build the React client, compile TypeScript for the electron directory, then run electron-builder.

- [ ] **Step 3: Test a local build**

Run the build script for the current platform. Verify the installer is created in dist-electron/. Install and run the built app to confirm it works outside of dev mode.

- [ ] **Step 4: Commit**

Commit message: `feat: add electron-builder configuration`

---

### Task 9: Create GitHub Actions release workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create the release workflow**

Trigger on pushing a tag matching "v*". Run three parallel jobs — one per OS (windows-latest, macos-latest, ubuntu-latest). Each job: checkout, setup Node, install pnpm, install dependencies, generate Prisma client, build, package with electron-builder, upload artifact.

Add a final release job that depends on all three build jobs. It creates a GitHub Release with the tag name and uploads all installers as release assets.

- [ ] **Step 2: Commit**

Commit message: `feat: add GitHub Actions release workflow`

---

### Task 10: Auto-updates

**Files:**
- Modify: `electron/main.ts`

- [ ] **Step 1: Add auto-updater to main process**

Import electron-updater. On app startup (after window is created), check for updates. On update available, download it in the background. On update downloaded, notify the user and offer to restart. Only check for updates in production (not dev mode).

- [ ] **Step 2: Test update flow**

Build and release a v0.1.0 tag. Then make a small change, bump to v0.1.1, build and release. Run the v0.1.0 app and verify it detects the v0.1.1 update.

- [ ] **Step 3: Commit**

Commit message: `feat: add auto-updates via electron-updater`

---

## Verification Checklist

After all tasks are complete:

- [ ] App launches on all three platforms
- [ ] Can add, reorder, start, complete, delete tasks
- [ ] Timer works correctly with notifications
- [ ] Day/Night session grouping works
- [ ] Templates can be created, edited, reordered, deleted
- [ ] Settings persist across app restarts
- [ ] Data survives app updates (SQLite file not overwritten)
- [ ] Auto-update detects new versions
- [ ] Web version on Vercel still works unchanged
- [ ] GitHub Release contains installers for all platforms
