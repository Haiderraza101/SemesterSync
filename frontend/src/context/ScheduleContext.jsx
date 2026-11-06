import { createContext, useEffect, useMemo, useReducer } from "react";
import { STORAGE_KEYS, USE_MOCK_API } from "../config.js";
import { readJson, writeJson } from "../utils/storage.js";
import {
  DEFAULT_SETTINGS,
  SCHEDULE_VERSION,
  createDemoSchedule,
  createEmptySchedule,
  scheduleReducer,
} from "./scheduleState.js";

export const ScheduleContext = createContext(null);

function getStorageKey(userId) {
  return `${STORAGE_KEYS.schedule}.${userId}`;
}

function initSchedule(userId) {
  const stored = readJson(getStorageKey(userId));
  if (stored?.version === SCHEDULE_VERSION) {
    return { ...stored, settings: { ...DEFAULT_SETTINGS, ...stored.settings } };
  }
  return USE_MOCK_API ? createDemoSchedule() : createEmptySchedule();
}

export function ScheduleProvider({ userId, children }) {
  const [schedule, dispatch] = useReducer(scheduleReducer, userId, initSchedule);

  useEffect(() => {
    writeJson(getStorageKey(userId), schedule);
  }, [userId, schedule]);

  const actions = useMemo(
    () => ({
      setCatalog: (catalog) => dispatch({ type: "catalog/set", catalog }),
      setSelections: (selections) => dispatch({ type: "selections/set", selections }),
      importSchedule: (selections, mode) => dispatch({ type: "schedule/import", selections, mode }),
      toggleCancelled: (id) => dispatch({ type: "class/toggleCancel", id }),
      addMakeup: (makeup) => dispatch({ type: "makeup/add", makeup }),
      removeMakeup: (id) => dispatch({ type: "makeup/remove", id }),
      setDateSheet: (term, sheet) => dispatch({ type: "dateSheet/set", term, sheet }),
      addTask: (task) => dispatch({ type: "task/add", task }),
      toggleTask: (id) => dispatch({ type: "task/toggle", id }),
      removeTask: (id) => dispatch({ type: "task/remove", id }),
      markAttendance: (id, status) => dispatch({ type: "attendance/mark", id, status }),
      setShareCode: (code) => dispatch({ type: "shareCode/set", code }),
      updateSettings: (settings) => dispatch({ type: "settings/update", settings }),
      resetSchedule: () => dispatch({ type: "schedule/reset" }),
    }),
    []
  );

  const value = useMemo(() => ({ schedule, ...actions }), [schedule, actions]);

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}
