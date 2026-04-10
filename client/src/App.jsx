import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import AnimatedBackground from "./components/AnimatedBackground";
import Layout from "./components/Layout";
import Loader from "./components/Loader";
import { useAppStore } from "./store/useAppStore";
import { Toaster } from "react-hot-toast";
import { auth } from "./firebase";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const user = useAppStore((s) => s.user);
  const setAuthUser = useAppStore((s) => s.setAuthUser);
  const logout = useAppStore((s) => s.logout);
  const bootstrapUserSession = useAppStore((s) => s.bootstrapUserSession);
  const isAuthed = Boolean(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setAuthUser]);

  useEffect(() => {
    if (!user?.uid) return;
    bootstrapUserSession(user);
  }, [user, bootstrapUserSession]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white/90">
      {location.pathname === "/login" || location.pathname === "/signup" ? <AnimatedBackground /> : null}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2600,
          style: {
            background: "rgba(2,6,23,0.92)",
            color: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            backdropFilter: "blur(8px)",
          },
        }}
      />

      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />}
        />

        <Route
          path="/login"
          element={
            isAuthed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Suspense fallback={<Loader show label="Loading page…" />}>
                <AuthPage
                  initialMode="login"
                  onAuthSuccess={() => navigate("/dashboard", { replace: true })}
                />
              </Suspense>
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Suspense fallback={<Loader show label="Loading page…" />}>
                <AuthPage
                  initialMode="signup"
                  onAuthSuccess={() => navigate("/dashboard", { replace: true })}
                />
              </Suspense>
            )
          }
        />

        <Route
          element={
            isAuthed ? (
              <Layout
                onLogout={() => {
                  logout().finally(() => {
                    navigate("/login", { replace: true });
                  });
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<Loader show label="Loading…" />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/expenses"
            element={
              <Suspense fallback={<Loader show label="Loading…" />}>
                <ExpensesPage />
              </Suspense>
            }
          />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<Loader show label="Loading…" />}>
                <AnalyticsPage />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<Loader show label="Loading…" />}>
                <ProfilePage />
              </Suspense>
            }
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </div>
  );
}
