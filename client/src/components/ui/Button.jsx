import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cx } from "../../utils/cx.js";

const Button = forwardRef(function Button(
  { variant = "secondary", size = "md", block = false, to, type = "button", className, children, ...props },
  ref
) {
  const classes = cx("btn", `btn--${variant}`, size !== "md" && `btn--${size}`, block && "btn--block", className);

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  );
});

export default Button;
