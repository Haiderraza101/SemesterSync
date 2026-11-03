import Button from "../components/ui/Button.jsx";
import Logo from "../components/ui/Logo.jsx";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/pages/auth.css";

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="auth-card-page">
      <Logo />
      <div className="auth-card">
        <div className="auth-form__header">
          <span className="text-muted">Error 404</span>
          <h1>Page not found</h1>
          <p className="auth-card__text">The page you are looking for does not exist or has been moved.</p>
        </div>
        <Button to={isAuthenticated ? "/app" : "/"} variant="primary" size="lg" block>
          {isAuthenticated ? "Back to dashboard" : "Go to home page"}
        </Button>
      </div>
    </main>
  );
}
