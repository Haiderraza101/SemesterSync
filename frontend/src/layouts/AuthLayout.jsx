import { Link } from "react-router-dom";
import Logo from "../components/ui/Logo.jsx";
import { cx } from "../utils/cx.js";

export default function AuthLayout({ eyebrow, title, subtitle, switchText, switchLink, wide = false, footer, children }) {
  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--top" aria-hidden="true" />
      <div className="auth-page__glow auth-page__glow--center" aria-hidden="true" />
      <header className="auth-page__header">
        <Logo to="/login" />
        {switchLink && (
          <p className="auth-page__switch">
            {switchText} <Link to={switchLink.to}>{switchLink.label}</Link>
          </p>
        )}
      </header>
      <main className="auth-page__main">
        <section className={cx("auth-card", wide && "auth-card--wide")}>
          <div className="auth-card__intro">
            {eyebrow && <p className="auth-card__eyebrow">{eyebrow}</p>}
            <h1 className="auth-card__title">{title}</h1>
            {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="auth-card__footer">{footer}</div>}
          {switchLink && (
            <p className="auth-card__switch">
              {switchText} <Link to={switchLink.to}>{switchLink.label}</Link>
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
