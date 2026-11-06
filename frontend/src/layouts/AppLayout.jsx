import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/app/Sidebar.jsx";
import Icon from "../components/ui/Icon.jsx";
import Logo from "../components/ui/Logo.jsx";
import "../styles/app.css";

const SIDEBAR_ID = "app-sidebar";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="app-topbar">
        <Logo to="/app" />
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls={SIDEBAR_ID}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={18} />
        </button>
      </header>
      <Sidebar id={SIDEBAR_ID} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="app-overlay" aria-hidden="true" onClick={() => setMenuOpen(false)} />}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
