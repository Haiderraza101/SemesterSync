import { EXAM_TERM_KEYS } from "../utils/examTerms.js";

export const SCHEDULE_VERSION = 1;

export const DEFAULT_SETTINGS = {
  defaultView: "timeGridWeek",
  showSaturday: false,
  attendanceRequirement: 80,
  semesterName: "",
  semesterStart: "",
  semesterEnd: "",
};

export function createEmptySchedule() {
  return {
    version: SCHEDULE_VERSION,
    catalog: null,
    selections: [],
    cancelled: [],
    makeups: [],
    dateSheets: { midterm: null, midterm2: null, final: null },
    tasks: [],
    attendance: { baseline: {}, marks: {} },
    shareCode: null,
    settings: DEFAULT_SETTINGS,
  };
}

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function mergeSharedExams(dateSheets, exams = []) {
  const next = { ...dateSheets };
  EXAM_TERM_KEYS.forEach((term) => {
    const incoming = exams.filter((exam) => exam.term === term).map(({ term: examTerm, ...exam }) => exam);
    if (incoming.length === 0) return;
    const merged = new Map((next[term]?.exams || []).map((exam) => [exam.code, exam]));
    incoming.forEach((exam) => merged.set(exam.code, { ...merged.get(exam.code), ...exam }));
    next[term] = { fileName: next[term]?.fileName || "Shared schedule", exams: [...merged.values()] };
  });
  return next;
}

function mergeSharedTasks(tasks, incoming = []) {
  const existing = new Set(tasks.map((task) => `${task.title}|${task.courseCode}|${task.due}`));
  const added = incoming
    .filter((task) => !existing.has(`${task.title}|${task.courseCode}|${task.due}`))
    .map((task, index) => ({ ...task, id: `task-${Date.now()}-${index}`, done: false }));
  return [...tasks, ...added];
}

function mergeSharedMakeups(makeups, incoming = []) {
  const existing = new Set(makeups.map((makeup) => `${makeup.code}|${makeup.date}|${makeup.start}`));
  const ids = new Set(makeups.map((makeup) => makeup.id));
  const added = incoming
    .filter((makeup) => !existing.has(`${makeup.code}|${makeup.date}|${makeup.start}`))
    .map((makeup, index) => ({
      ...makeup,
      id: makeup.id && !ids.has(makeup.id) ? makeup.id : `makeup_${makeup.code}_${Date.now()}_${index}`,
    }));
  return [...makeups, ...added];
}

function mergeCancelled(cancelled, incoming = []) {
  return [...new Set([...cancelled, ...incoming])];
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
        settings: {
          ...state.settings,
          semesterName: state.settings.semesterName || action.catalog.semesterName || "",
        },
      };
    }
    case "selections/set":
      return { ...state, selections: action.selections };
    case "schedule/import":
      return {
        ...state,
        selections: action.mode === "merge" ? mergeSelections(state.selections, action.selections) : action.selections,
        dateSheets: mergeSharedExams(state.dateSheets, action.exams),
        tasks: mergeSharedTasks(state.tasks, action.tasks),
        makeups: mergeSharedMakeups(state.makeups, action.makeups),
        cancelled: mergeCancelled(state.cancelled, action.cancelled),
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
    case "schedule/load":
      return { ...state, ...action.schedule, settings: { ...DEFAULT_SETTINGS, ...action.schedule.settings } };
    default:
      return state;
  }
}
