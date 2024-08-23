import JobCard from "./components/molecules/JobCard";
import Navbar from "./components/molecules/Navbar";
import SearchBox from "./components/molecules/SearchBox";
import JobPage from "./components/pages/JobPage";
import Landing from "./components/pages/Landing";
import LoginPage from "./components/pages/LoginPage";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Landing /> */}
        {/* <Landing /> */}
        <Route path="/" element={<Landing />}></Route>
        <Route path="/login" element={<LoginPage />}></Route>
        <Route path="/jobs" element={<JobPage />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
