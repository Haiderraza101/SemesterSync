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
├── client/          React frontend (Vite)
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       └── pages/
└── server/          Express backend
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

## Getting Started

### Prerequisites

- Node.js 18 or later
- MongoDB running locally or a MongoDB Atlas connection string

### Setup

```bash
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in `server/.env` with your MongoDB URI and a JWT secret.

### Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health
