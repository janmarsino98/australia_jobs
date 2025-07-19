import logo from "../../imgs/logo.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";

const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  const isJobsPath = location.pathname.startsWith("/job");

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-100 h-[60px]" role="banner">
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onClick={handleLogoClick}
        role="button"
        tabIndex={0}
        aria-label="Go to homepage"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleLogoClick();
          }
        }}
      >
        <div className="object-cover rounded-full h-[30px] w-[30px]">
          <img src={logo} alt="KickStart logo" />
        </div>
        <span className="text-xl font-semibold text-gray-800">KickStart</span>
      </div>
      <nav className="space-x-4 flex flex-row" role="navigation" aria-label="Main navigation">
        <div className="flex relative">
          <Link
            to="/"
            className="text-sm font-medium text-gray-600 hover:text-blue-500"
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            Home
          </Link>
          {location.pathname === "/" && (
            <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" aria-hidden="true" />
          )}
        </div>
        <div className="flex relative">
          <Link
            to="/jobseekers"
            className="text-sm font-medium text-gray-600 hover:text-blue-500"
            aria-current={isJobsPath ? "page" : undefined}
          >
            Job Seekers
          </Link>
          {isJobsPath && (
            <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" aria-hidden="true" />
          )}
        </div>
        <div className="flex relative">
          <Link
            to="/employers"
            className="text-sm font-medium text-gray-600 hover:text-blue-500"
            aria-current={location.pathname === "/employers" ? "page" : undefined}
          >
            Employers
          </Link>
          {location.pathname === "/employers" && (
            <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" aria-hidden="true" />
          )}
        </div>
        <div className="flex relative">
          <Link
            to="/pricing"
            className="text-sm font-medium text-gray-600 hover:text-blue-500"
            aria-current={location.pathname === "/pricing" ? "page" : undefined}
          >
            Pricing
          </Link>
          {location.pathname === "/pricing" && (
            <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" aria-hidden="true" />
          )}
        </div>
        <div className="flex relative">
          <Link
            to="/about"
            className="text-sm font-medium text-gray-600 hover:text-blue-500"
            aria-current={location.pathname === "/about" ? "page" : undefined}
          >
            About
          </Link>
          {location.pathname === "/about" && (
            <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" aria-hidden="true" />
          )}
        </div>
      </nav>
    </header>
  );
};

export default MainHeader;
