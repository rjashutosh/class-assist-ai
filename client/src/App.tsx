import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Calendar from "./pages/Calendar";
import Admin from "./pages/Admin";
import Notifications from "./pages/Notifications";
import Layout from "./components/Layout";

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-pulse text-neon-cyan">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route path="dashboard" element={<PrivateRoute roles={["TEACHER", "MANAGER"]}><Dashboard /></PrivateRoute>} />
        <Route path="students" element={<PrivateRoute roles={["TEACHER", "MANAGER"]}><Students /></PrivateRoute>} />
        <Route path="calendar" element={<PrivateRoute roles={["TEACHER", "MANAGER"]}><Calendar /></PrivateRoute>} />
        <Route path="notifications" element={<PrivateRoute roles={["TEACHER", "MANAGER"]}><Notifications /></PrivateRoute>} />
        <Route path="admin" element={<PrivateRoute roles={["ADMIN"]}><Admin /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
