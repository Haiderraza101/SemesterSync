import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import ProtectedRoute from "./components/routing/ProtectedRoute.jsx";
import GuestRoute from "./components/routing/GuestRoute.jsx";
import DocumentTitle from "./components/routing/DocumentTitle.jsx";
import ErrorBoundary from "./components/routing/ErrorBoundary.jsx";
import PageLoader from "./components/ui/PageLoader.jsx";

const Landing = lazy(() => import("./pages/Landing.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Calendar = lazy(() => import("./pages/Calendar.jsx"));
const Timetable = lazy(() => import("./pages/Timetable.jsx"));
const DateSheets = lazy(() => import("./pages/DateSheets.jsx"));
const Tasks = lazy(() => import("./pages/Tasks.jsx"));
const Attendance = lazy(() => import("./pages/Attendance.jsx"));
const Share = lazy(() => import("./pages/Share.jsx"));
const Export = lazy(() => import("./pages/Export.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const JoinCode = lazy(() => import("./pages/JoinCode.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  return (
    <ErrorBoundary>
      <DocumentTitle />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="datesheets" element={<DateSheets />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="share" element={<Share />} />
              <Route path="export" element={<Export />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>
          </Route>
          <Route path="/join/:code" element={<JoinCode />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
