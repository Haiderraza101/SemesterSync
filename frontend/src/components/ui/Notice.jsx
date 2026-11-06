import { cx } from "../../utils/cx.js";
import Icon from "./Icon.jsx";

const ICONS = {
  warning: "alert",
  info: "info",
  success: "check",
  danger: "alert",
};

export default function Notice({ variant = "info", title, action, className, children }) {
  const isUrgent = variant === "warning" || variant === "danger";

  return (
    <div className={cx("notice", `notice--${variant}`, className)} role={isUrgent ? "alert" : "status"}>
      <Icon name={ICONS[variant]} size={16} className="notice__icon" />
      <div className="notice__content">
        {title && <strong className="notice__title">{title}</strong>}
        {children && <div className="notice__text">{children}</div>}
      </div>
      {action && <div className="notice__action">{action}</div>}
    </div>
  );
}
