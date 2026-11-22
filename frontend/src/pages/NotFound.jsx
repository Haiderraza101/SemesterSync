import Button from "../components/ui/Button.jsx";
import { useAuth } from "../hooks/useAuth.js";
import AuthLayout from "../layouts/AuthLayout.jsx";
import "../styles/pages/auth.css";

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <AuthLayout
      eyebrow="Error 404"
      title="Page not found"
      subtitle="The page you are looking for does not exist or has been moved."
    >
      <div className="auth-form">
        <Button to={isAuthenticated ? "/app" : "/login"} variant="primary" size="lg" block>
          {isAuthenticated ? "Back to dashboard" : "Go to log in"}
        </Button>
      </div>
    </AuthLayout>
  );
}
