import { cx } from "../../utils/cx.js";
import Icon from "./Icon.jsx";

const STACK_CARDS = 6;

export default function EmptyState({ icon = "info", title, description, action, secondaryAction, variant = "page", className }) {
  if (variant === "compact") {
    return (
      <div className={cx("empty-state empty-state--compact", className)}>
        <span className="empty-state__title">{title}</span>
        {description && <span className="empty-state__description">{description}</span>}
        {action && <div className="empty-state__actions">{action}</div>}
      </div>
    );
  }

  return (
    <div className={cx("empty-state", className)}>
      <div className="empty-state__stack" aria-hidden="true">
        <div className="empty-state__stack-track">
          {Array.from({ length: STACK_CARDS }, (_, index) => (
            <div key={index} className="empty-state__card">
              <div className="empty-state__card-start">
                <Icon name={icon} size={20} strokeWidth={1.8} />
                <div className="empty-state__card-line" />
              </div>
              <Icon name="pointer" size={18} strokeWidth={2} className="empty-state__card-pointer" />
            </div>
          ))}
        </div>
      </div>
      <div className="empty-state__content">
        <h3 className="empty-state__title">{title}</h3>
        {description && <p className="empty-state__description">{description}</p>}
        {(action || secondaryAction) && (
          <div className="empty-state__actions">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
