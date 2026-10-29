import {
  SAMPLE_ATTENDANCE_BASELINE,
  SAMPLE_CATALOG,
  SAMPLE_DATE_SHEETS,
  SAMPLE_SELECTIONS,
  SAMPLE_TASKS,
} from "../mocks/schedule.js";

export const SCHEDULE_VERSION = 1;

export const DEFAULT_SETTINGS = {
  morningSummary: true,
  summaryTime: "07:00",
  classReminder: "15m",
  examReminder: "1d",
  defaultView: "timeGridWeek",
  showSaturday: false,
  attendanceRequirement: 80,
};

export function createEmptySchedule() {
  return {
    version: SCHEDULE_VERSION,
    catalog: null,
    selections: [],
    cancelled: [],
    makeups: [],
    dateSheets: { midterm: null, final: null },
    tasks: [],
    attendance: { baseline: {}, marks: {} },
    shareCode: null,
    settings: DEFAULT_SETTINGS,
  };
}

export function createDemoSchedule() {
  const selectedCodes = new Set(SAMPLE_SELECTIONS.map((selection) => selection.code));
  const midterm = SAMPLE_DATE_SHEETS.midterm;

  return {
    ...createEmptySchedule(),
    catalog: SAMPLE_CATALOG,
    selections: SAMPLE_SELECTIONS,
    dateSheets: {
      midterm: {
        fileName: midterm.fileName,
        exams: midterm.exams.filter((exam) => selectedCodes.has(exam.code)).map((exam) => ({ ...exam, reminder: "1d" })),
      },
      final: null,
    },
    tasks: SAMPLE_TASKS,
    attendance: { baseline: SAMPLE_ATTENDANCE_BASELINE, marks: {} },
  };
}

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function mergeSelections(current, incoming) {
  const merged = new Map(current.map((selection) => [selection.code, selection]));
  incoming.forEach((selection) => merged.set(selection.code, selection));
  return [...merged.values()];
}

export function scheduleReducer(state, action) {
  switch (action.type) {
    case "catalog/set": {
      const codes = new Set(action.catalog.courses.map((course) => course.code));
      return {
        ...state,
        catalog: action.catalog,
        selections: state.selections.filter((selection) => codes.has(selection.code)),
      };
    }
    case "selections/set":
      return { ...state, selections: action.selections };
    case "schedule/import":
      return {
        ...state,
        selections: action.mode === "merge" ? mergeSelections(state.selections, action.selections) : action.selections,
      };
    case "class/toggleCancel":
      return { ...state, cancelled: toggleInList(state.cancelled, action.id) };
    case "makeup/add":
      return { ...state, makeups: [...state.makeups, action.makeup] };
    case "makeup/remove":
      return { ...state, makeups: state.makeups.filter((makeup) => makeup.id !== action.id) };
    case "dateSheet/set":
      return { ...state, dateSheets: { ...state.dateSheets, [action.term]: action.sheet } };
    case "task/add":
      return { ...state, tasks: [...state.tasks, action.task] };
    case "task/toggle":
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.id ? { ...task, done: !task.done } : task)),
      };
    case "task/remove":
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.id) };
    case "attendance/mark": {
      const marks = { ...state.attendance.marks };
      if (action.status) marks[action.id] = action.status;
      else delete marks[action.id];
      return { ...state, attendance: { ...state.attendance, marks } };
    }
    case "shareCode/set":
      return { ...state, shareCode: action.code };
    case "settings/update":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "schedule/reset":
      return createEmptySchedule();
    default:
      return state;
  }
}
