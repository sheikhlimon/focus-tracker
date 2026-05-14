import { Routes, Route, Navigate, Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Settings } from "lucide-react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Sidebar from "./components/layout/Sidebar";
import CalendarView from "./components/calendar/CalendarView";
import PlaylistView from "./components/playlist/PlaylistView";
import SettingsPage from "./pages/SettingsPage";

function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function AppShell() {
  const month = getCurrentMonth();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          to="/"
          className="text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          FocusTracker
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="size-[18px]" />
          </Link>
          <UserButton afterSignOutUrl="/login" />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar month={month} />
        <main className="flex-1 overflow-y-auto px-10 py-8">
          <Routes>
            <Route index element={<CalendarView month={month} />} />
            <Route path="day/:date" element={<PlaylistView />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <>
            <SignedIn>
              <Navigate to="/" replace />
            </SignedIn>
            <SignedOut>
              <LoginPage />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/signup"
        element={
          <>
            <SignedIn>
              <Navigate to="/" replace />
            </SignedIn>
            <SignedOut>
              <SignupPage />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/*"
        element={
          <>
            <SignedIn>
              <AppShell />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      />
    </Routes>
  );
}
