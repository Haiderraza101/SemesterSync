export default function SettingRow({ label, description, htmlFor, children }) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className="setting-row">
      <div className="setting-row__text">
        <Label className="setting-row__label" htmlFor={htmlFor}>
          {label}
        </Label>
        {description && <span className="setting-row__description">{description}</span>}
      </div>
      <div className="setting-row__control">{children}</div>
    </div>
  );
}
