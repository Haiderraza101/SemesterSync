import Icon from "../ui/Icon.jsx";
import Select from "../ui/Select.jsx";
import { SCOPES, TYPE_OPTIONS } from "../../utils/sectionFilters.js";

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="filter-select">
      <Select aria-label={label} value={value} options={options} onChange={onChange} />
    </div>
  );
}

export default function SectionFilters({ query, onQueryChange, filters, onFiltersChange, onReset, canReset, user, batches }) {
  const scopeOptions = [
    ...(user.key ? [{ value: SCOPES.section, label: `My section (${user.label})` }] : []),
    ...(user.semesterKey ? [{ value: SCOPES.semester, label: `My semester (${user.semesterLabel})` }] : []),
    { value: SCOPES.all, label: "All sections" },
  ];
  const batchOptions = [{ value: "all", label: "All batches" }, ...batches.map((batch) => ({ value: batch, label: batch }))];
  const update = (changes) => onFiltersChange({ ...filters, ...changes });

  return (
    <div className="section-filters">
      <div className="toolbar__search">
        <Icon name="search" size={14} className="toolbar__search-icon" />
        <input
          type="search"
          className="input"
          placeholder="Search courses, sections or instructors"
          aria-label="Search courses, sections or instructors"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      <FilterSelect label="Sections" value={filters.scope} options={scopeOptions} onChange={(scope) => update({ scope })} />
      <FilterSelect label="Course type" value={filters.type} options={TYPE_OPTIONS} onChange={(type) => update({ type })} />
      {batches.length > 0 && (
        <FilterSelect label="Batch" value={filters.batch} options={batchOptions} onChange={(batch) => update({ batch })} />
      )}
      {canReset && (
        <button type="button" className="filter-reset" onClick={onReset}>
          <Icon name="close" size={14} strokeWidth={2.25} />
          Reset filters
        </button>
      )}
    </div>
  );
}
