import Checkbox from "../ui/Checkbox.jsx";
import CourseMarker from "../ui/CourseMarker.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Icon from "../ui/Icon.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import { cx } from "../../utils/cx.js";
import { formatShortDate, formatTime, toTimeKey } from "../../utils/date.js";

function getStatus(task, now) {
  if (task.done) return "completed";
  if (task.dueAt < now) return "overdue";
  return "pending";
}

export default function TaskTable({ tasks, now, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        variant="compact"
        icon="tasks"
        title="Nothing here yet"
        description="Add assignments and quizzes with the form to track them."
      />
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table task-table">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Done</span>
            </th>
            <th scope="col">Title</th>
            <th scope="col">Type</th>
            <th scope="col">Due</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <Checkbox
                  label={`Mark ${task.title} as done`}
                  hideLabel
                  checked={task.done}
                  onChange={() => onToggle(task.id)}
                />
              </td>
              <td>
                <div className="cell-stack">
                  <span className={cx("cell-strong", task.done && "task-table__title--done")}>{task.title}</span>
                  <span className="task-table__course">
                    {task.course && <CourseMarker color={task.course.color} size={7} />}
                    {task.course?.name || "General"}
                  </span>
                </div>
              </td>
              <td>
                <StatusBadge status={task.type === "quiz" ? "quiz" : "assignment"} />
              </td>
              <td>
                <div className="cell-stack">
                  <span className="cell-stack__main">{formatShortDate(task.dueAt)}</span>
                  <span className="cell-stack__sub">
                    {task.lectureId ? `In lecture · ${formatTime(toTimeKey(task.dueAt))}` : formatTime(toTimeKey(task.dueAt))}
                  </span>
                </div>
              </td>
              <td>
                <StatusBadge status={getStatus(task, now)} />
              </td>
              <td className="cell-action">
                <button
                  type="button"
                  className="lecture-icon-button lecture-icon-button--danger"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => onDelete(task)}
                >
                  <Icon name="trash" size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
