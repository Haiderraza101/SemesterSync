import Badge from "./Badge.jsx";

export const STATUSES = {
  upcoming: { label: "Upcoming", variant: "info", icon: "clock" },
  live: { label: "In progress", variant: "success", icon: "play" },
  done: { label: "Done", variant: "secondary", icon: "check" },
  cancelled: { label: "Cancelled", variant: "destructive", icon: "close" },
  makeup: { label: "Makeup", variant: "purple", icon: "plus" },
  quiz: { label: "Quiz", variant: "indigo", icon: "tasks" },
  pending: { label: "Pending", variant: "warning", icon: "clock" },
  overdue: { label: "Overdue", variant: "destructive", icon: "alert" },
  completed: { label: "Completed", variant: "success", icon: "check" },
  safe: { label: "On track", variant: "success", icon: "check" },
  warning: { label: "At risk", variant: "warning", icon: "alert" },
  critical: { label: "Critical", variant: "destructive", icon: "alert" },
  exam: { label: "Exam", variant: "default", icon: "datesheets" },
  assignment: { label: "Assignment", variant: "teal", icon: "tasks" },
  evaluation: { label: "Evaluation", variant: "purple", icon: "shield-check" },
  elective: { label: "Elective", variant: "purple", icon: "plus" },
  repeat: { label: "Repeat", variant: "warning", icon: "alert" },
  core: { label: "Core", variant: "secondary", icon: "check" },
};

export default function StatusBadge({ status, label }) {
  const config = STATUSES[status];
  if (!config) return null;
  return (
    <Badge variant={config.variant} icon={config.icon} compact>
      {label || config.label}
    </Badge>
  );
}
