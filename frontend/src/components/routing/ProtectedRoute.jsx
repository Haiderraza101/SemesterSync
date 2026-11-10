import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ScheduleProvider } from "../../context/ScheduleContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import PageLoader from "../ui/PageLoader.jsx";

export default function ProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return (
    <ScheduleProvider key={user.id} userId={user.id}>
      <Outlet />
    </ScheduleProvider>
  );
}
