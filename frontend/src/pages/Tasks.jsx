import { useMemo, useState } from "react";
import TaskForm from "../components/tasks/TaskForm.jsx";
import TaskTable from "../components/tasks/TaskTable.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { getSelectedCourses, getTasksWithCourses } from "../utils/schedule.js";

const FILTERS = {
  all: () => true,
  assignment: (task) => task.type === "assignment",
  quiz: (task) => task.type === "quiz",
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
  ];

  const visibleTasks = tasks.filter(FILTERS[filter]);

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
        title="Assignments and quizzes"
        description="Add deadlines by hand. Each one appears on your calendar with a reminder."
      >
        <Tabs label="Filter items" tabs={tabs} value={filter} onChange={setFilter} />
      </PageHeader>

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
