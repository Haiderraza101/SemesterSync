import Badge from "../ui/Badge.jsx";
import Checkbox from "../ui/Checkbox.jsx";
import CourseMarker from "../ui/CourseMarker.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Icon from "../ui/Icon.jsx";
import { cx } from "../../utils/cx.js";
import { formatShortDate, formatTime, toTimeKey } from "../../utils/date.js";

function getStatus(task, now) {
  if (task.done) return { label: "Completed", variant: "muted" };
  if (task.dueAt < now) return { label: "Overdue", variant: "warning" };
  return { label: "Pending", variant: "neutral" };
}

export default function TaskTable({ tasks, now, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
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
          {tasks.map((task) => {
            const status = getStatus(task, now);
            return (
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
                  <div className="course-cell__text">
                    <span className={cx("course-cell__name", task.done && "task-table__title--done")}>
                      {task.title}
                    </span>
                    <span className="task-table__course">
                      {task.course && <CourseMarker color={task.course.color} size={7} />}
                      {task.course?.name || "General"}
                    </span>
                  </div>
                </td>
                <td>{task.type === "quiz" ? "Quiz" : "Assignment"}</td>
                <td className="cell-nowrap">
                  {formatShortDate(task.dueAt)}, {formatTime(toTimeKey(task.dueAt))}
                </td>
                <td>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="cell-action">
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon"
                    aria-label={`Delete ${task.title}`}
                    onClick={() => onDelete(task)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
