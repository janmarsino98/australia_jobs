import JobPage from "./pages/JobPage";
import Landing from "./pages/Landing";
import MainLand from "./pages/MainLand";
import LoginPage from "./pages/LoginPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import JobSeekersPage from "./pages/JobSeekersPage";
import AboutPage from "./pages/AboutPage";
import JobsPage from "./pages/JobsPage";
import Job from "./pages/Job";
import ResumeUpload from "./pages/ResumeUpload";

function App() {
  return (
    <PrimeReactProvider>
      <BrowserRouter>
        <Routes>
          {/* <Landing /> */}
          {/* <Landing /> */}
          <Route path="/" element={<Landing />}></Route>
          <Route path="/login" element={<LoginPage />}></Route>
          <Route path="/jobs" element={<JobPage />}></Route>
          <Route path="/main" element={<MainLand />}></Route>
          <Route path="/jobseekers" element={<JobSeekersPage />}></Route>
          <Route path="/about" element={<AboutPage />}></Route>
          <Route path="/jobspage" element={<JobsPage />}></Route>
          <Route path="/job/:slug" element={<Job />}></Route>
          <Route path="/resume" element={<ResumeUpload />}></Route>
        </Routes>
      </BrowserRouter>
    </PrimeReactProvider>
  );
}

export default App;
