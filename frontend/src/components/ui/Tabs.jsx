import { cx } from "../../utils/cx.js";

export default function Tabs({ tabs, value, onChange, label, className }) {
  return (
    <div role="tablist" aria-label={label} className={cx("tabs", className)}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cx("tabs__tab", selected && "tabs__tab--active")}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
            {typeof tab.count === "number" && <span className="tabs__count">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
