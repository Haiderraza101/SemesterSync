import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import PageLoader from "../ui/PageLoader.jsx";

export default function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return <Navigate to={isAuthenticated ? "/app" : "/login"} replace />;
}
