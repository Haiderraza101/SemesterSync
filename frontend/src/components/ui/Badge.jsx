import { cx } from "../../utils/cx.js";
import Icon from "./Icon.jsx";

const LEGACY_VARIANTS = {
  neutral: "outline",
  muted: "secondary",
  danger: "destructive",
};

export default function Badge({ variant = "default", icon, compact = false, className, children, ...props }) {
  const resolved = LEGACY_VARIANTS[variant] || variant;
  return (
    <span className={cx("badge", `badge--${resolved}`, compact && "badge--compact", className)} {...props}>
      {icon && <Icon name={icon} size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
}
