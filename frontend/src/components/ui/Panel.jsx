import { cx } from "../../utils/cx.js";

export default function Panel({
  title,
  description,
  action,
  footer,
  flush = false,
  as: Element = "section",
  className,
  children,
}) {
  return (
    <Element className={cx("panel", className)}>
      {(title || action) && (
        <header className="panel__header">
          <div className="panel__heading">
            {title && <h2 className="panel__title">{title}</h2>}
            {description && <p className="panel__description">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cx("panel__body", flush && "panel__body--flush")}>{children}</div>
      {footer && <footer className="panel__footer">{footer}</footer>}
    </Element>
  );
}
