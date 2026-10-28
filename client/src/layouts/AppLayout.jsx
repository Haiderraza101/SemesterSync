import { Outlet } from "react-router-dom";
import Sidebar from "../components/app/Sidebar.jsx";
import "../styles/app.css";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
