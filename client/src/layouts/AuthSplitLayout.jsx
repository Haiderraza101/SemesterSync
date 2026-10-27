import Logo from "../components/ui/Logo.jsx";

export default function AuthSplitLayout({ aside, footer, children }) {
  return (
    <div className="auth-split">
      <aside className="auth-split__aside">
        <Logo />
        <div className="auth-split__aside-content">{aside}</div>
        {footer && <div className="auth-split__aside-footer">{footer}</div>}
      </aside>
      <main className="auth-split__main">{children}</main>
    </div>
  );
}
