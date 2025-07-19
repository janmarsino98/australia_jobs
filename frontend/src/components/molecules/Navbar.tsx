import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavIconImg from "../atoms/NavIconImg";
import NavTextOption from "../atoms/NavTextOption";
import NavProfileIcon from "../atoms/NavProfileIcon";
import main_logo from "../../imgs/logo.svg";

interface NavbarProps {
  user?: {
    name: string;
    profile?: {
      first_name?: string;
      last_name?: string;
      profile_picture?: string;
    };
    profileImage?: string;
  };
}

const Navbar = ({ user }: NavbarProps): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleLogoClick();
    }
  };

  return (
    <>
      {/* Spacer to prevent content jump when navbar becomes fixed */}
      <div className="h-[96px]" />
      
      {/* Fixed Navbar */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-main-white-bg/95 backdrop-blur-sm border-b border-navbar-border shadow-sm transition-all duration-300"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[96px] items-center justify-between">
            {/* Logo Section */}
            <div
              className="cursor-pointer group transition-all duration-200 hover:scale-105"
              onClick={handleLogoClick}
              onKeyDown={handleKeyDown}
              role="button"
              tabIndex={0}
              aria-label="Go to homepage"
            >
              <NavIconImg img_url={main_logo} alt="AustralianJobs logo" />
            </div>

            {/* Navigation Section */}
            <nav 
              className="hidden md:flex items-center space-x-1"
              role="navigation"
              aria-label="Main navigation"
            >
              <NavTextOption 
                text="Find Jobs" 
                path="/jobs" 
                isActive={location.pathname === "/jobs" || location.pathname.startsWith("/job")}
              />
              <NavTextOption 
                text="Company Reviews" 
                path="/reviews"
                isActive={location.pathname === "/reviews"}
              />
              <NavTextOption 
                text="Find Salaries" 
                path="/salaries"
                isActive={location.pathname === "/salaries"}
              />
            </nav>

            {/* Profile Section */}
            <div 
              className="flex items-center"
              role="complementary"
              aria-label="User profile"
            >
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-main-text hidden lg:inline">
                    Welcome, {user.profile?.first_name}
                  </span>
                  <div className="h-8 w-px bg-navbar-border hidden lg:block" />
                  <NavProfileIcon
                    profImg={user.profileImage || user.profile?.profile_picture || "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"}
                    alt={`${user.profile?.first_name || user.name} profile picture`}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <NavTextOption text="Sign In" path="/login" />
                  <div className="h-4 w-px bg-navbar-border" />
                  <NavTextOption 
                    text="Sign Up" 
                    path="/signup"
                    isActive={location.pathname === "/signup"}
                    isPrimary
                  />
                </div>
              )
              }
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar; 