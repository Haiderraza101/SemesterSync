import Icon from "./Icon.jsx";

export default function EmptyState({ icon = "info", title, description, action }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={20} className="empty-state__icon" />
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
