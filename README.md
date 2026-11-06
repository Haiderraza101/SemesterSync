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
│       ├── mocks/          Sample data used until the API is ready
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

The frontend runs against a mock data layer while the backend is being built. Set `VITE_USE_MOCK=false` in `frontend/.env` to call the Express API instead. In mock mode any email and a password of at least six characters will log in, and the demo schedule is stored in the browser.

## Backend API

All routes are under `/api`. Protected routes need an `Authorization: Bearer <token>` header.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Create an account and return a token |
| POST | `/auth/login` | No | Log in and return a token |
| POST | `/auth/forgot-password` | No | Email a password reset link |
| POST | `/auth/reset-password/:token` | No | Set a new password with a reset token |
| GET | `/auth/me` | Yes | Current user |
| GET, PUT, DELETE | `/users/me` | Yes | Read, update or delete the profile |
| PUT | `/users/me/password` | Yes | Change password |
| GET, PUT, DELETE | `/schedule` | Yes | Read, update or reset the saved schedule |
| POST, DELETE | `/share` | Yes | Create or disable a share code |
| GET | `/share/:code` | Yes | Look up a shared schedule |

Passwords are hashed with bcrypt, tokens are signed JWTs, auth routes are rate limited and responses use `{ message, errors }` for failures. Without SMTP settings, reset emails are printed to the server console in development.

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

Fill in `backend/.env` with your MongoDB URI and a JWT secret. Set `VITE_USE_MOCK=false` in `frontend/.env` to use the real API.

### Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health
