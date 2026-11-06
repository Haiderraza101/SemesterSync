import { cx } from "../../utils/cx.js";

export default function Stepper({ steps, current }) {
  return (
    <ol className="stepper">
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={step}
            className={cx("stepper__step", `stepper__step--${state}`)}
            aria-current={state === "current" ? "step" : undefined}
          >
            {index + 1}. {step}
            {state === "done" && <span className="sr-only"> (completed)</span>}
          </li>
        );
      })}
    </ol>
  );
}
