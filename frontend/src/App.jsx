import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect } from "react";
import "./App.css";
import MainLand from "./pages/MainLand";
import LoginPage from "./pages/LoginPage";
import JobSeekersPage from "./pages/JobSeekersPage";
import AboutPage from "./pages/AboutPage";
import JobsPage from "./pages/JobsPage";
import Job from "./pages/Job";
import JobPage from "./pages/JobPage";
import Landing from "./pages/Landing";
import PayingPage from "./pages/PayingPage";
import PricingInformationPage from "./pages/PricingInformationPage";
import ResumeUpload from "./pages/ResumeUpload";
import EmployersPage from "./pages/EmployersPage";
import DashboardPage from "./pages/DashboardPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingSpinner } from "./components/molecules/LoadingSpinner";
import useAuthStore from "./stores/useAuthStore";

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20
  },
  animate: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: 20
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <MainLand />
            </motion.div>
          }
        />
        <Route
          path="/login"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <LoginPage />
            </motion.div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <DashboardPage />
            </motion.div>
          }
        />
        <Route
          path="/jobseekers"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <JobSeekersPage />
            </motion.div>
          }
        />
        <Route
          path="/about"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <AboutPage />
            </motion.div>
          }
        />
        <Route
          path="/jobs"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <JobsPage />
            </motion.div>
          }
        />
        <Route
          path="/job/:id"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Job />
            </motion.div>
          }
        />
        <Route
          path="/jobpage"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <JobPage />
            </motion.div>
          }
        />
        <Route
          path="/landing"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Landing />
            </motion.div>
          }
        />
        <Route
          path="/paying"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <PayingPage />
            </motion.div>
          }
        />
        <Route
          path="/pricing"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <PricingInformationPage />
            </motion.div>
          }
        />
        <Route
          path="/resume"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <ResumeUpload />
            </motion.div>
          }
        />
        <Route
          path="/employers"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <EmployersPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  // Initialize auth store
  const { refreshAccessToken } = useAuthStore();

  useEffect(() => {
    // Check if we need to refresh the token on app load
    refreshAccessToken();
  }, [refreshAccessToken]);

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <Router>
          <AnimatedRoutes />
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
