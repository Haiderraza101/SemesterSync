import { Link } from "react-router-dom";
import { cx } from "../../utils/cx.js";

export default function Logo({ to = "/", className }) {
  return (
    <Link to={to} className={cx("logo", className)}>
      <span className="logo__mark" aria-hidden="true">
        S
      </span>
      <span className="logo__name">SemesterSync</span>
    </Link>
  );
}
