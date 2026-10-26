import { cx } from "../../utils/cx.js";

export default function Badge({ variant = "neutral", className, children }) {
  return <span className={cx("badge", `badge--${variant}`, className)}>{children}</span>;
}
