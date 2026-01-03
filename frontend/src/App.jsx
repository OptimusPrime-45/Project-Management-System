import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Projects from "./pages/Projects/Projects";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Profile/Settings";
import Notifications from "./pages/Notifications/Notifications";
import MyTasks from "./pages/Tasks/MyTasks";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminDashboard";
import UserManagement from "./pages/SuperAdmin/UserManagement";
import ProjectManagement from "./pages/SuperAdmin/ProjectManagement";
import SuperAdminRoute from "./components/Guards/SuperAdminRoute";
import ProtectedRoute from "./components/Guards/ProtectedRoute";
import PublicRoute from "./components/Guards/PublicRoute";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <Routes>
      {/* Public Routes - redirect to dashboard if already logged in */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Auth utility routes */}
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected Routes - require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Super Admin Routes */}
          <Route element={<SuperAdminRoute />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/users" element={<UserManagement />} />
            <Route
              path="/super-admin/projects"
              element={<ProjectManagement />}
            />
          </Route>
        </Route>
      </Route>

      {/* Root redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
