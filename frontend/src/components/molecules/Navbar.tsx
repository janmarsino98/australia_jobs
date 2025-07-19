import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavIconImg from "../atoms/NavIconImg";
import NavTextOption from "../atoms/NavTextOption";
import NavProfileIcon from "../atoms/NavProfileIcon";
import main_logo from "../../imgs/logo.svg";
import config from "../../config";

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

  // Function to get the profile image with proxy support for LinkedIn images
  const getProfileImageUrl = (profileImage?: string, profilePicture?: string) => {
    const imageUrl = profileImage || profilePicture;
    const fallbackImage = "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
    
    if (!imageUrl) {
      return fallbackImage;
    }
    
    // Check if it's a LinkedIn image URL
    if (imageUrl.includes('media.licdn.com') || imageUrl.includes('linkedin.com')) {
      // Use our image proxy for LinkedIn images
      return `${config.apiBaseUrl}/auth/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    }
    
    return imageUrl;
  };

  return (
    <>
      {/* Spacer to prevent content jump when navbar becomes fixed */}
      <div className="h-16" />
      
      {/* Fixed Navbar */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-main-white-bg/95 backdrop-blur-sm border-b border-navbar-border shadow-sm"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Section */}
            <div
              className="flex items-center cursor-pointer group"
              onClick={handleLogoClick}
              onKeyDown={handleKeyDown}
              role="button"
              tabIndex={0}
              aria-label="Go to homepage"
            >
              <NavIconImg img_url={main_logo} alt="AustralianJobs logo" />
              <span className="ml-3 text-xl font-semibold text-main-text hidden sm:inline">
                AustralianJobs
              </span>
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
                text="About" 
                path="/about" 
                isActive={location.pathname === "/about"}
              />
              <NavTextOption 
                text="Pricing" 
                path="/pricing" 
                isActive={location.pathname === "/pricing"}
              />
            </nav>

            {/* Profile Section */}
            <div 
              className="flex items-center"
              role="region"
              aria-label="User profile"
            >
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-searchbar-text hidden lg:inline">
                    Welcome, {user.profile?.first_name || user.name}
                  </span>
                  <div className="h-6 w-px bg-navbar-border hidden lg:block" />
                  <NavProfileIcon
                    profImg={getProfileImageUrl(user.profileImage, user.profile?.profile_picture)}
                    alt={`${user.profile?.first_name || user.name} profile picture`}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <NavTextOption text="Sign In" path="/login" />
                  <div className="h-6 w-px bg-navbar-border" />
                  <NavTextOption text="Sign Up" path="/signup" isPrimary />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar; 