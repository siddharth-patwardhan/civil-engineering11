import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

/** Redirects authenticated users who haven't completed org setup. */
export function SetupGuard() {
  const { isAuthenticated, isLoading, needsSetup } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (isAuthenticated && needsSetup && location.pathname !== "/setup") {
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />;
  }

  if (!needsSetup && location.pathname === "/setup") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
