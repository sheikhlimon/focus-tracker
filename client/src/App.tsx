import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Sidebar from "./components/layout/Sidebar";
import CalendarView from "./components/calendar/CalendarView";
import PlaylistView from "./components/playlist/PlaylistView";

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
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">FocusTracker</h1>
        <UserButton afterSignOutUrl="/login" />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar month={month} />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<CalendarView month={month} />} />
            <Route path="day/:date" element={<PlaylistView />} />
            <Route path="settings" element={<div>Settings coming soon</div>} />
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
