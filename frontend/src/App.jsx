import JobPage from "./components/pages/JobPage";
import Landing from "./components/pages/Landing";
import MainLand from "./components/pages/MainLand";
import LoginPage from "./components/pages/LoginPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import JobSeekersPage from "./components/pages/JobSeekersPage";
import AboutPage from "./components/pages/AboutPage";
import JobsPage from "./components/pages/JobsPage";
import Job from "./components/pages/Job";

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
          <Route path="/job" element={<Job />}></Route>
        </Routes>
      </BrowserRouter>
    </PrimeReactProvider>
  );
}

export default App;
