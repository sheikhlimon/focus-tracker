# FocusTracker Desktop — Electron Local App

## Goal

Ship FocusTracker as a standalone desktop app for Windows, Mac, and Linux. No server, no login, no account — data lives locally in a SQLite file. Distributed via GitHub Releases with auto-updates.

The web version on Vercel stays as-is. This is a second build target from the same codebase.

## Architecture

IPC bridge between Electron renderer and main process. Standard Electron pattern — the React app communicates with Prisma/SQLite through IPC messages instead of HTTP fetch.

Three layers:

1. **Renderer** — the existing React app, unchanged. Same components, hooks, styles, @dnd-kit.
2. **Adapter** — ApiClientProvider detects Electron vs browser. In Electron, routes API calls through IPC. In browser, uses existing fetch.
3. **Main process** — receives IPC messages, runs Prisma queries against SQLite, returns results.

## Data Layer

SQLite via Prisma. The schema drops the User model entirely — no auth, no userId foreign keys. Models: Settings (singleton), Day, Task, Session, TaskTemplate. All top-level, no user scoping.

The SQLite file lives in the OS app data directory:
- Linux: ~/.config/focus-tracker/
- Windows: %APPDATA%/focus-tracker/
- Mac: ~/Library/Application Support/focus-tracker/

On first launch, if the DB file doesn't exist, Prisma creates it and runs migrations automatically.

## IPC Bridge

The main process exposes an API through Electron's contextBridge. The renderer receives a window.electronAPI object with methods that mirror the current REST endpoints: getDay, addTask, reorderTasks, updateSettings, etc.

The preload script defines exactly which methods are exposed. The renderer cannot access Node.js APIs or the file system directly — only the methods explicitly listed in the preload.

Each IPC method maps to a Prisma query or service function in the main process. The return types match what the React Query hooks already expect (DayData, SettingsData, etc.).

## Adapter Layer

ApiClientProvider is the single point of change. It detects whether it's running in Electron (window.electronAPI exists) or in a browser.

In Electron mode, the API client calls window.electronAPI methods instead of fetch. Same interface — get, post, patch, delete — different transport.

In browser mode, existing fetch-based client. No changes.

All React Query hooks in queries.ts remain untouched. They call api.get(), api.post(), etc. and don't know what's underneath.

## Schema Changes from Web Version

- Remove User model
- Remove userId from Settings (becomes a singleton — one row)
- Remove userId from Day
- Remove userId from TaskTemplate
- Drop @@unique([date, userId]) on Day (no user scoping needed)
- Drop user relation fields from all models

The Task, Session, and Template models keep the same fields otherwise.

## Build & Distribution

electron-builder packages the app for each platform. The React frontend builds with Vite as normal, then electron-builder wraps it with the Electron shell.

A GitHub Actions workflow runs on three OS runners (windows-latest, macos-latest, ubuntu-latest). It builds the app, creates a GitHub Release with installers (.exe, .dmg, .AppImage), and publishes.

Auto-updates via electron-updater. On launch, the app checks GitHub Releases for a newer version. If found, it downloads and installs in the background. Prompts the user to restart.

## New Files

- electron/main.ts — Electron main process. Opens the browser window, loads the React app, sets up IPC handlers, initializes Prisma.
- electron/preload.ts — Exposes the IPC API to the renderer via contextBridge.
- electron/ipc-handlers.ts — Maps IPC message names to Prisma queries/service functions.
- electron/database.ts — Initializes Prisma client with SQLite, runs migrations on first launch.
- electron-builder.yml — Build configuration for packaging and distribution.
- .github/workflows/release.yml — CI workflow for building and releasing on all platforms.

## What Does NOT Change

- All React components in client/src/components/
- All hooks (useTimer, useCalendar, useNotification)
- React Query hooks in queries.ts
- Tailwind config, CSS, theming
- @dnd-kit setup
- The web deployment on Vercel

## What Changes

- client/src/api/ApiClientProvider.tsx — detects Electron vs browser, swaps transport
- server/prisma/schema.prisma — stripped User model for the Electron build (separate copy or conditional)
- New electron/ directory with main process, preload, IPC handlers
- New build and CI configuration
