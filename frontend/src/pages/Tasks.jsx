import { useMemo, useState } from "react";
import TaskForm from "../components/tasks/TaskForm.jsx";
import TaskTable from "../components/tasks/TaskTable.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import KpiCard, { KpiGrid } from "../components/ui/KpiCard.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { addDays } from "../utils/date.js";
import { countByType } from "../utils/taskTypes.js";
import { getSelectedCourses, getTasksWithCourses } from "../utils/schedule.js";

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

const FILTERS = {
  all: () => true,
  assignment: (task) => task.type === "assignment",
  quiz: (task) => task.type === "quiz",
  evaluation: (task) => task.type === "evaluation",
};

export default function Tasks() {
  const { schedule, addTask, toggleTask, removeTask } = useSchedule();
  const { notify } = useToast();
  const [filter, setFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);
  const now = useMemo(() => new Date(), []);

  const courses = useMemo(() => getSelectedCourses(schedule), [schedule]);
  const tasks = useMemo(
    () =>
      getTasksWithCourses(schedule, courses).sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return a.dueAt - b.dueAt;
      }),
    [schedule, courses]
  );

  const tabs = [
    { value: "all", label: "All", count: tasks.length },
    { value: "assignment", label: "Assignments", count: tasks.filter(FILTERS.assignment).length },
    { value: "quiz", label: "Quizzes", count: tasks.filter(FILTERS.quiz).length },
    { value: "evaluation", label: "Evaluations", count: tasks.filter(FILTERS.evaluation).length },
  ];

  const visibleTasks = tasks.filter(FILTERS[filter]);
  const open = tasks.filter((task) => !task.done);
  const openCounts = countByType(open);
  const overdue = open.filter((task) => task.dueAt < now);
  const dueSoon = open.filter((task) => task.dueAt >= now && task.dueAt <= addDays(now, 7));
  const completed = tasks.length - open.length;
  const nextDue = open.filter((task) => task.dueAt >= now)[0];

  const handleAdd = (task) => {
    addTask(task);
    notify(`${task.title} added.`);
  };

  const confirmDelete = () => {
    removeTask(pendingDelete.id);
    notify(`${pendingDelete.title} deleted.`);
    setPendingDelete(null);
  };

  return (
    <>
      <PageHeader
        title="Assignments, quizzes and evaluations"
        description="Track every assignment and quiz. Each one appears on your calendar and dashboard."
      >
        <Tabs label="Filter items" tabs={tabs} value={filter} onChange={setFilter} />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Still to do"
          value={open.length}
          detail={[
            plural(openCounts.assignment, "assignment"),
            plural(openCounts.quiz, "quiz", "quizzes"),
            openCounts.evaluation ? plural(openCounts.evaluation, "evaluation") : "",
          ]
            .filter(Boolean)
            .join(", ")}
        />
        <KpiCard
          label="Due in the next 7 days"
          value={dueSoon.length}
          detail={nextDue ? `Next: ${nextDue.title}` : "Nothing due soon"}
          tone={dueSoon.length >= 3 ? "warning" : undefined}
        />
        <KpiCard
          label="Overdue"
          value={overdue.length}
          detail={overdue.length ? `Oldest: ${overdue[0].title}` : "You are all caught up"}
          tone={overdue.length ? "critical" : "success"}
        />
        <KpiCard
          label="Completed"
          value={completed}
          unit={`of ${tasks.length}`}
          progress={tasks.length ? (completed / tasks.length) * 100 : 0}
          tone="success"
          detail={tasks.length ? `${Math.round((completed / tasks.length) * 100)}% done` : "Nothing added yet"}
        />
      </KpiGrid>

      <div className="page-grid">
        <Panel className="page-grid__main" flush>
          <TaskTable tasks={visibleTasks} now={now} onToggle={toggleTask} onDelete={setPendingDelete} />
        </Panel>
        <div className="page-grid__side">
          <TaskForm courses={courses} onSubmit={handleAdd} />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this item?"
        description={pendingDelete ? `${pendingDelete.title} will be removed from your calendar.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
