import { NavLink, useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";
import Icon from "../ui/Icon.jsx";
import Logo from "../ui/Logo.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { cx } from "../../utils/cx.js";
import { NAV_ITEMS } from "./navigation.js";

export default function Sidebar({ id, open = false, onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside id={id} className={cx("sidebar", open && "sidebar--open")}>
      <div className="sidebar__brand">
        <Logo to="/app" />
      </div>
      <nav className="sidebar__nav" aria-label="Main">
        <span className="sidebar__section-label">Menu</span>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cx("sidebar__link", isActive && "sidebar__link--active")}
            onClick={onNavigate}
          >
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="sidebar__user">
          <Avatar name={user.name} avatar={user.avatar} size={36} className="sidebar__avatar" />
          <div className="sidebar__user-text">
            <span className="sidebar__user-name">{user.name}</span>
            <span className="sidebar__user-meta">
              {user.rollNumber} · {user.section}
            </span>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--icon sidebar__logout"
            aria-label="Log out"
            onClick={handleLogout}
          >
            <Icon name="logout" />
          </button>
        </div>
      )}
    </aside>
  );
}
