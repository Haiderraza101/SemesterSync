# SemesterSync: Semester Schedule Manager

SemesterSync helps university students keep their class timetable, exam date sheets and deadlines in one place. Upload the university timetable or date sheet Excel file, select your courses and sections, and everything is placed on a calendar with reminders.

**Section:** BCS 7A
**Author:** Haider (23L-0634)

## Tech Stack

- **MongoDB** with Mongoose
- **Express.js** REST API
- **React** with Vite, React Router and FullCalendar
- **Node.js**

## Planned Features

1. User accounts
2. Calendar with day, week and month views
3. Timetable Excel upload with course and section selection
4. Date sheet upload for midterm and final exams
5. Assignments and quizzes with reminders
6. Clash detection
7. Colour coding per course with room numbers
8. Class cancellation and makeup classes
9. Share code to copy a schedule
10. Attendance tracker
11. Morning summary email
12. Export timetable as PDF or image

## Project Structure

```
.
├── frontend/               React frontend (Vite)
│   └── src/
│       ├── api/            Axios instance with auth header
│       ├── components/
│       │   ├── app/        Sidebar, tables, dropzone, stepper
│       │   ├── calendar/   FullCalendar wrapper, event details, makeup modal
│       │   ├── routing/    Route guards, error boundary, page titles
│       │   ├── settings/   Profile and password forms
│       │   ├── tasks/      Task form and table
│       │   └── ui/         Buttons, fields, panels, modal, tabs, toasts
│       ├── context/        Auth, schedule and toast providers
│       ├── hooks/          useAuth, useSchedule, useForm, useToast
│       ├── layouts/        App shell and split auth layout
│       ├── pages/          One file per route
│       ├── services/       Auth and schedule API calls
│       ├── styles/         Tokens, base, components and page styles
│       └── utils/          Dates, clashes, attendance, export, validation
└── backend/                Express backend
    └── src/
        ├── config/
        ├── controllers/
        ├── jobs/
        ├── middleware/
        ├── models/
        ├── routes/
        ├── services/
        └── utils/
```

## Frontend

| Route | Screen |
| --- | --- |
| `/` | Landing page |
| `/login`, `/register`, `/forgot-password` | Authentication |
| `/app` | Dashboard with today's classes, upcoming items and attendance |
| `/app/calendar` | Day, week and month calendar with cancel and makeup classes |
| `/app/timetable` | Timetable upload, section selection and clash check |
| `/app/datesheets` | Midterm and final date sheet upload |
| `/app/tasks` | Assignments and quizzes |
| `/app/attendance` | Attendance tracker |
| `/app/share` | Share code generation and import |
| `/app/export` | Timetable export as PDF or PNG |
| `/app/settings` | Profile, notifications, calendar and account settings |

All data comes from the Express API. There is no sample or demo data: a new account starts empty until a timetable is uploaded.

## Backend API

All routes are under `/api`. Protected routes need an `Authorization: Bearer <accessToken>` header.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Create an account and start a session |
| POST | `/auth/login` | No | Log in and start a session |
| POST | `/auth/refresh` | Cookie | Rotate the refresh token and return a new access token |
| POST | `/auth/logout` | Cookie | End the current session |
| POST | `/auth/logout-all` | Yes | End every session for the account |
| GET | `/auth/me` | Yes | Current user |
| POST | `/auth/forgot-password` | No | Email a password reset link |
| GET | `/auth/reset-password/:token` | No | Check that a reset link is still valid |
| POST | `/auth/reset-password/:token` | No | Set a new password and end every session |
| GET, PUT, DELETE | `/users/me` | Yes | Read, update or delete the profile |
| PUT | `/users/me/password` | Yes | Change password and end other sessions |
| POST | `/datesheets/parse` | Yes | Upload a date sheet Excel file (`file`, optional `term`) and get every paper with date and time |
| POST | `/timetable/parse` | Yes | Upload a timetable Excel file (`file` field) and get the parsed course catalog |
| GET, PUT, DELETE | `/schedule` | Yes | Read, update or reset the saved schedule |
| GET, POST, DELETE | `/share` | Yes | Read, create or disable your share code (with optional exams and tasks) |
| GET | `/share/:code` | Yes | Look up a shared schedule |

Failures respond with `{ message, code, errors }`, where `errors` maps field names to messages.

### Authentication

- **Access token:** a JWT that lasts 15 minutes. The frontend keeps it in memory only and sends it as a Bearer header.
- **Refresh token:** a random token in an `httpOnly` cookie scoped to `/api/auth`. Only its SHA-256 hash is stored, in the `sessions` collection. It rotates on every refresh, and reusing an old token ends the session.
- **Remember me:** keeps the session for 30 days. Without it the cookie ends with the browser and the session expires after 12 hours.
- **Login protection:** passwords are hashed with bcrypt, failed logins take the same time whether or not the email exists, and an account locks for 15 minutes after 5 failed attempts.
- **Password reset:** the forgot password response is the same for every email. Reset links are single use and expire after 30 minutes. A reset ends every session, and a confirmation email is sent.
- **Rate limits:** login, registration, password reset and session refresh each have their own limit. Cookie-based routes reject requests from origins other than `CLIENT_URL`.
- **Validation:** request bodies and params are validated with Zod, and unknown fields are removed.

Without SMTP settings, emails (including reset links) are printed to the backend console in development.

### Timetable parsing

`POST /timetable/parse` accepts an `.xlsx` or `.xls` file up to 10 MB. The file is checked by extension and file signature and is processed in memory, never written to disk. Parsing lives in `backend/src/services/timetable/`:

- `formats/` holds one module per timetable layout. Each one parses a workbook into class entries, and the layout that finds the most classes wins. `roomGridFormat` reads the FAST layout where each block has a header row of time slots, days run down the first column, rooms are rows, and each course cell has its instructor in the row below.
- Class times come from an explicit time written in the cell (for example `11:40 - 01:00`), then a time label above the cell, and otherwise from where the cell sits under the header slots.
- `courseCodes.js` reads course codes from any sheet that lists them (such as Course Allocation) and matches them to timetable names, including abbreviations like `Data Com. & Netwks.`. Courses without a match get a generated code.
- `catalogBuilder.js` groups classes into courses and sections, with a room on every slot.

The selected schedule is saved to MongoDB through `/schedule` and loads again on any device after login.

### Date sheets

`POST /datesheets/parse` reads FAST date sheets laid out as Day, Date, then repeating Code and time slot columns (for example `Code | 09:00 - 10:00 | Code | 10:30 - 11:30`). Dates such as `29-Oct-2026`, Excel date cells and `29/10/2026` are all accepted. The exam term (Midterm 1, Midterm 2 or Final) is detected from the title, and only papers for the student's selected courses are added to the calendar.

### Semester dates

The semester name is detected from the timetable title (for example "Fall 2026"). The first and last teaching day are set in Settings and saved with the schedule. Classes, attendance totals and reminders only run between those dates.

### Notifications

`backend/src/jobs/notificationScheduler.js` runs every minute in `APP_TIMEZONE` (default `Asia/Karachi`) and emails each user:

- the morning summary at their chosen time (today's classes, exams, and tasks due today or tomorrow)
- class reminders 15 or 30 minutes before each class, skipping cancelled classes and including makeup classes
- task reminders 1 day or 3 hours before the due time
- exam reminders 1 day, 2 days or 1 week before each paper

Every notification is recorded in the `notificationlogs` collection so it is sent once, and a failed email is retried on the next run. Set `NOTIFICATIONS_ENABLED=false` to turn the scheduler off.

## Getting Started

### Prerequisites

- Node.js 18 or later
- MongoDB running locally or a MongoDB Atlas connection string

### Setup

```bash
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Format the frontend code with `npx prettier --write "frontend/src/**/*.{js,jsx,css}"`.

Fill in `backend/.env` with your MongoDB URI and a JWT secret. Add SMTP settings to send real emails; without them, emails are printed to the backend console in development.

### Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5001/api/health
