import { createBrowserRouter } from "react-router-dom";
import AuthGuard from "./components/molecules/AuthGuard";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import DashboardPage from "./pages/DashboardPage";
import JobPage from "./pages/JobPage";
import JobsPage from "./pages/JobsPage";
import Landing from "./pages/Landing";
import EmployersPage from "./pages/EmployersPage";
import { Outlet } from "react-router-dom";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <DashboardPage />
      </AuthGuard>
    ),
  },
  {
    path: "/jobs",
    element: (
      <AuthGuard>
        <JobsPage />
      </AuthGuard>
    ),
  },
  {
    path: "/jobs/:id",
    element: (
      <AuthGuard>
        <JobPage />
      </AuthGuard>
    ),
  },
  {
    path: "/employer",
    element: (
      <AuthGuard allowedRoles={["employer"]}>
        <EmployersPage />
      </AuthGuard>
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "jobs",
        element: <JobsPage />,
      },
      {
        path: "jobs/:id",
        element: <JobPage />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <AuthGuard allowedRoles={["admin"]}>
        <Outlet />
      </AuthGuard>
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "users",
        element: <div>Users Management</div>,
      },
      {
        path: "jobs",
        element: <JobsPage />,
      },
    ],
  },
]);

export default routes; 