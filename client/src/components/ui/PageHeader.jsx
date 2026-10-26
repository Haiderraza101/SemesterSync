import { cx } from "../../utils/cx.js";

export default function PageHeader({ title, description, eyebrow, actions, children, className }) {
  return (
    <header className={cx("page-header", children && "page-header--with-tabs", className)}>
      <div className="page-header__row">
        <div className="page-header__text">
          {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p className="page-header__description">{description}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
