const ITEMS = [
  { variant: "makeup", label: "Makeup class" },
  { variant: "cancelled", label: "Cancelled" },
  { variant: "clash", label: "Time clash" },
  { variant: "exam", label: "Exam" },
  { variant: "task", label: "Deadline" },
];

export default function CalendarLegend() {
  return (
    <ul className="panel calendar-legend" aria-label="Legend">
      {ITEMS.map((item) => (
        <li key={item.variant} className="calendar-legend__item">
          <span className={`calendar-legend__swatch calendar-legend__swatch--${item.variant}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
