import Icon from "../ui/Icon.jsx";

export default function FileSummary({ name, meta, action }) {
  return (
    <div className="file-summary">
      <span className="file-summary__icon" aria-hidden="true">
        <Icon name="spreadsheet" size={18} />
      </span>
      <div className="file-summary__text">
        <span className="file-summary__name">{name}</span>
        {meta && <span className="file-summary__meta">{meta}</span>}
      </div>
      {action}
    </div>
  );
}
