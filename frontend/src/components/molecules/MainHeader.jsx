import logo from "../../imgs/logo.png";
import { Link, useLocation } from "react-router-dom";

const MainHeader = () => {
  const location = useLocation();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-100 h-[60px]">
      <div className="flex items-center space-x-2">
        <div className=" object-cover rounded-full h-[30px] w-[30px]">
          <img src={logo} alt="" />
        </div>
        <span className="text-xl font-semibold text-gray-800">AusJobs</span>
      </div>
      <nav className="space-x-4 flex flex-row">
        <div className="flex relative">
          <Link
            to="/main"
            className="text-sm font-medium text-gray-600 hover:text-blue-500"
          >
            Home
          </Link>
          {location.pathname === "/main" && (
            <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" />
          )}
        </div>
        <div className="flex relative">
          <Link
            to="/jobseekers"
            className="text-sm font-medium text-gray-600 hover:text-blue-500"
          >
            Job Seekers
          </Link>
          {location.pathname === "/jobseekers" && (
            <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" />
          )}
        </div>
        <div className="flex relative">
          <Link
            to="/employers"
            className="text-sm font-medium text-gray-600 hover:text-blue-500"
          >
            Employers
          </Link>
          {location.pathname === "/employers" && (
            <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" />
          )}
        </div>
        <div className="flex relative">
          <Link
            to="/about"
            className="text-sm font-medium text-gray-600 hover:text-blue-500"
          >
            About
          </Link>
          {location.pathname === "/about" && (
            <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" />
          )}
        </div>
      </nav>
    </header>
  );
};

export default MainHeader;
