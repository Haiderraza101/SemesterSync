import Button from "../ui/Button.jsx";
import Notice from "../ui/Notice.jsx";
import { useSchedule } from "../../hooks/useSchedule.js";
import { hasSemesterDates } from "../../utils/schedule.js";

export default function SemesterNotice() {
  const { schedule } = useSchedule();
  if (schedule.selections.length === 0 || hasSemesterDates(schedule)) return null;

  return (
    <Notice
      variant="warning"
      title="Set your semester dates"
      action={
        <Button size="sm" to="/app/settings">
          Open settings
        </Button>
      }
    >
      Add the first and last teaching day so classes stop at the end of the semester and attendance can count the
      classes left.
    </Notice>
  );
}
