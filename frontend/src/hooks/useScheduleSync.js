import { useEffect, useRef, useState } from "react";
import { scheduleService } from "../services/scheduleService.js";
import { useToast } from "./useToast.js";

export const SYNCED_FIELDS = ["catalog", "selections", "cancelled", "makeups", "dateSheets", "tasks", "attendance", "settings"];
const SAVE_DELAY_MS = 800;

function snapshot(schedule) {
  return Object.fromEntries(SYNCED_FIELDS.map((field) => [field, JSON.stringify(schedule[field] ?? null)]));
}

function pickSynced(schedule) {
  return Object.fromEntries(
    SYNCED_FIELDS.filter((field) => schedule[field] !== undefined).map((field) => [field, schedule[field]])
  );
}

function hasContent(schedule) {
  return Boolean(schedule?.catalog) || schedule?.selections?.length > 0 || schedule?.tasks?.length > 0;
}

export function useScheduleSync(schedule, dispatch) {
  const { notify } = useToast();
  const [status, setStatus] = useState("loading");
  const savedSnapshot = useRef(null);
  const baselinePending = useRef(false);
  const latestSchedule = useRef(schedule);
  const saveFailed = useRef(false);

  latestSchedule.current = schedule;

  useEffect(() => {
    let active = true;

    scheduleService
      .getSchedule()
      .then((remote) => {
        if (!active) return;
        if (hasContent(remote) || !hasContent(latestSchedule.current)) {
          dispatch({ type: "schedule/load", schedule: pickSynced(remote) });
          baselinePending.current = true;
        } else {
          savedSnapshot.current = snapshot(remote);
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setStatus("offline");
        notify("Could not load your schedule from the server. Showing the copy saved in this browser.", "danger");
      });

    return () => {
      active = false;
    };
  }, [dispatch, notify]);

  useEffect(() => {
    if (status !== "ready") return undefined;

    if (baselinePending.current) {
      savedSnapshot.current = snapshot(schedule);
      baselinePending.current = false;
      return undefined;
    }

    const current = snapshot(schedule);
    const changed = SYNCED_FIELDS.filter((field) => current[field] !== savedSnapshot.current?.[field]);
    if (changed.length === 0) return undefined;

    const timer = setTimeout(() => {
      const changes = Object.fromEntries(changed.map((field) => [field, schedule[field] ?? null]));
      scheduleService
        .saveSchedule(changes)
        .then(() => {
          const savedFields = Object.fromEntries(changed.map((field) => [field, current[field]]));
          savedSnapshot.current = { ...savedSnapshot.current, ...savedFields };
          saveFailed.current = false;
        })
        .catch(() => {
          if (saveFailed.current) return;
          saveFailed.current = true;
          notify("Your latest changes could not be saved. They will be retried with your next change.", "danger");
        });
    }, SAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [schedule, status, notify]);

  return status;
}
