export const COURSE_COLORS = ["#2f5f98", "#9a6b2f", "#3d7a74", "#5b6672", "#7b8fa6", "#1f3a5c", "#9aa5b1"];

const slot = (day, start, end) => ({ day, start, end });

export const SAMPLE_CATALOG = {
  fileName: "Timetable Fall 2026 v3.xlsx",
  fileSize: 219136,
  uploadedAt: "2026-11-02T10:12:00.000Z",
  totalSections: 112,
  courses: [
    {
      code: "CS4032",
      name: "Web Programming",
      shortName: "Web Prog",
      color: COURSE_COLORS[0],
      sections: {
        A: { instructor: "Dr. Ahmed", room: "CS-3", slots: [slot(1, "08:30", "09:50"), slot(4, "08:30", "09:50")] },
        B: { instructor: "Ms. Ayesha", room: "CS-4", slots: [slot(2, "13:00", "14:20"), slot(5, "10:00", "11:20")] },
      },
    },
    {
      code: "AI2002",
      name: "Artificial Intelligence",
      shortName: "AI",
      color: COURSE_COLORS[1],
      sections: {
        A: { instructor: "Dr. Imran", room: "E-12", slots: [slot(1, "13:00", "14:20"), slot(3, "13:00", "14:20")] },
        B: { instructor: "Ms. Fatima", room: "E-14", slots: [slot(2, "08:30", "09:50"), slot(3, "08:30", "09:50")] },
      },
    },
    {
      code: "CS4031",
      name: "Compiler Construction",
      shortName: "Compiler",
      color: COURSE_COLORS[2],
      sections: {
        A: { instructor: "Dr. Usman", room: "CS-5", slots: [slot(1, "10:00", "11:20"), slot(4, "10:00", "11:20")] },
        B: { instructor: "Mr. Hamza", room: "CS-6", slots: [slot(2, "11:30", "12:50"), slot(5, "08:30", "09:50")] },
      },
    },
    {
      code: "CY3001",
      name: "Information Security",
      shortName: "Info Sec",
      color: COURSE_COLORS[3],
      sections: {
        A: { instructor: "Ms. Zainab", room: "B-1", slots: [slot(2, "14:30", "15:50"), slot(4, "14:30", "15:50")] },
        B: { instructor: "Mr. Bilal", room: "B-2", slots: [slot(1, "11:30", "12:50"), slot(3, "11:30", "12:50")] },
      },
    },
    {
      code: "AI4009",
      name: "Deep Learning",
      shortName: "Deep Learn",
      color: COURSE_COLORS[4],
      sections: {
        A: { instructor: "Dr. Sana", room: "E-7", slots: [slot(2, "10:00", "11:20"), slot(3, "11:30", "12:50")] },
        B: { instructor: "Dr. Faisal", room: "E-8", slots: [slot(1, "14:30", "15:50"), slot(4, "13:00", "14:20")] },
      },
    },
    {
      code: "SE4002",
      name: "Software Project Management",
      shortName: "SPM",
      color: COURSE_COLORS[5],
      sections: {
        A: { instructor: "Ms. Hira", room: "CS-1", slots: [slot(2, "13:00", "14:20"), slot(4, "13:00", "14:20")] },
        B: { instructor: "Mr. Danish", room: "CS-2", slots: [slot(3, "14:30", "15:50"), slot(5, "14:30", "15:50")] },
      },
    },
    {
      code: "CS3006",
      name: "Numerical Computing",
      shortName: "Numerical",
      color: COURSE_COLORS[6],
      sections: {
        A: { instructor: "Dr. Kamran", room: "C-3", slots: [slot(1, "08:30", "09:50"), slot(3, "10:00", "11:20")] },
        B: { instructor: "Ms. Rabia", room: "C-4", slots: [slot(4, "11:30", "12:50"), slot(5, "13:00", "14:20")] },
      },
    },
  ],
};

export const SAMPLE_SELECTIONS = [
  { code: "CS4032", section: "A" },
  { code: "AI2002", section: "B" },
  { code: "CS4031", section: "A" },
  { code: "CY3001", section: "B" },
  { code: "AI4009", section: "A" },
  { code: "SE4002", section: "A" },
];

export const SAMPLE_DATE_SHEETS = {
  midterm: {
    fileName: "Midterm Date Sheet Fall 2026.xlsx",
    totalPapers: 214,
    exams: [
      { code: "CS4031", date: "2026-11-19", start: "09:00", end: "10:30", venue: "Exam Hall A" },
      { code: "CS4032", date: "2026-11-20", start: "09:00", end: "10:30", venue: "CS-3" },
      { code: "AI2002", date: "2026-11-21", start: "11:30", end: "13:00", venue: "Exam Hall B" },
      { code: "CY3001", date: "2026-11-23", start: "09:00", end: "10:30", venue: "B-2" },
      { code: "AI4009", date: "2026-11-24", start: "14:00", end: "15:30", venue: "E-7" },
      { code: "SE4002", date: "2026-11-25", start: "11:30", end: "13:00", venue: "Exam Hall A" },
      { code: "CS3006", date: "2026-11-26", start: "09:00", end: "10:30", venue: "C-3" },
    ],
  },
  final: {
    fileName: "Final Date Sheet Fall 2026.xlsx",
    totalPapers: 228,
    exams: [
      { code: "CS4032", date: "2027-01-04", start: "09:00", end: "12:00", venue: "Exam Hall A" },
      { code: "CS4031", date: "2027-01-06", start: "09:00", end: "12:00", venue: "Exam Hall B" },
      { code: "AI2002", date: "2027-01-08", start: "13:00", end: "16:00", venue: "Exam Hall A" },
      { code: "AI4009", date: "2027-01-11", start: "09:00", end: "12:00", venue: "Exam Hall C" },
      { code: "CY3001", date: "2027-01-13", start: "13:00", end: "16:00", venue: "Exam Hall B" },
      { code: "SE4002", date: "2027-01-15", start: "09:00", end: "12:00", venue: "Exam Hall A" },
      { code: "CS3006", date: "2027-01-18", start: "09:00", end: "12:00", venue: "Exam Hall C" },
    ],
  },
};

export const SAMPLE_TASKS = [
  {
    id: "task-1",
    title: "Lab task 6",
    courseCode: "CS4031",
    type: "assignment",
    due: "2026-11-08T23:59",
    reminder: "1d",
    done: false,
  },
  {
    id: "task-2",
    title: "Quiz 3",
    courseCode: "AI2002",
    type: "quiz",
    due: "2026-11-11T08:30",
    reminder: "1d",
    done: false,
  },
  {
    id: "task-3",
    title: "Assignment 4",
    courseCode: "CS4032",
    type: "assignment",
    due: "2026-11-13T23:59",
    reminder: "1d",
    done: false,
  },
  {
    id: "task-4",
    title: "Project proposal",
    courseCode: "SE4002",
    type: "assignment",
    due: "2026-11-16T17:00",
    reminder: "1d",
    done: false,
  },
  {
    id: "task-5",
    title: "Quiz 2",
    courseCode: "CY3001",
    type: "quiz",
    due: "2026-11-05T11:30",
    reminder: "3h",
    done: true,
  },
  {
    id: "task-6",
    title: "Assignment 3",
    courseCode: "CS4032",
    type: "assignment",
    due: "2026-10-30T23:59",
    reminder: "1d",
    done: true,
  },
];

export const SAMPLE_ATTENDANCE_BASELINE = {
  CS4032: { held: 15, attended: 14 },
  AI2002: { held: 16, attended: 15 },
  CS4031: { held: 15, attended: 13 },
  CY3001: { held: 15, attended: 12 },
  AI4009: { held: 16, attended: 14 },
  SE4002: { held: 15, attended: 15 },
};

export const SHARED_SCHEDULES = {
  "B3TR-9WLD": {
    owner: "Ali Hassan",
    section: "BCS-7A",
    selections: [
      { code: "CS4032", section: "A" },
      { code: "AI2002", section: "B" },
      { code: "CS4031", section: "A" },
      { code: "AI4009", section: "B" },
      { code: "SE4002", section: "A" },
    ],
  },
};
