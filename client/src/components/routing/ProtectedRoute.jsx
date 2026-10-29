import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ScheduleProvider } from "../../context/ScheduleContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";

export default function ProtectedRoute() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return (
    <ScheduleProvider key={user.id} userId={user.id}>
      <Outlet />
    </ScheduleProvider>
  );
}
