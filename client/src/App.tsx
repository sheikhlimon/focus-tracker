import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function DashboardPlaceholder() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Dashboard coming soon</p>
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
              <DashboardPlaceholder />
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
