import { createBrowserRouter } from "react-router-dom";
import AuthGuard from "./components/molecules/AuthGuard";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import DashboardPage from "./pages/DashboardPage";
import JobPage from "./pages/JobPage";
import JobsPage from "./pages/JobsPage";
import MainLanding from "./pages/MainLand";
import EmployersPage from "./pages/EmployersPage";
import JobSeekersPage from "./pages/JobSeekersPage";
import AboutPage from "./pages/AboutPage";
import ResumeUpload from "./pages/ResumeUpload";
import PricingInformationPage from "./pages/PricingInformationPage";
import PayingPage from "./pages/PayingPage";
import Landing from "./pages/Landing";
import Job from "./pages/Job";
import { Outlet } from "react-router-dom";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainLanding />,
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
    path: "/jobseekers",
    element: <JobSeekersPage />,
  },
  {
    path: "/employers",
    element: <EmployersPage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "/resume-upload",
    element: <ResumeUpload />,
  },
  {
    path: "/pricing",
    element: <PricingInformationPage />,
  },
  {
    path: "/payment",
    element: <PayingPage />,
  },
  {
    path: "/landing",
    element: <Landing />,
  },
  {
    path: "/job/:id",
    element: <Job />,
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