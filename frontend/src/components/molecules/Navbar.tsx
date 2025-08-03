import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavIconImg from "../atoms/NavIconImg";
import NavTextOption from "../atoms/NavTextOption";
import NavProfileIcon from "../atoms/NavProfileIcon";
import { NotificationBell } from "./NotificationBell";
import { useNotificationStore } from "../../stores/useNotificationStore";
import main_logo from "../../imgs/logo.svg";
import config from "../../config";
import useAuthStore from "../../stores/useAuthStore";
import { Menu, X, Search, User, Settings, LogOut, Home, Briefcase, Info, DollarSign, Bell } from "lucide-react";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const logout = useAuthStore(state => state.logout);
  const { unreadCount } = useNotificationStore();

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleLogoClick();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setShowDropdown(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Function to get the profile image with proxy support for LinkedIn images
  const getProfileImageUrl = (profileImage?: string, profilePicture?: string) => {
    const imageUrl = profileImage || profilePicture;
    const fallbackImage = "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
    
    if (!imageUrl) {
      return fallbackImage;
    }
    
    // Check if it's a local profile image (MongoDB ObjectId)
    if (imageUrl.match(/^[0-9a-fA-F]{24}$/)) {
      return `${config.apiBaseUrl}/users/profile/image/${imageUrl}`;
    }
    
    // Check if it's a LinkedIn image URL
    if (imageUrl.includes('media.licdn.com') || imageUrl.includes('linkedin.com')) {
      // Use our image proxy for LinkedIn images
      return `${config.apiBaseUrl}/auth/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    }
    
    return imageUrl;
  };

  // Close dropdown and mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest('.profile-dropdown')) {
        setShowDropdown(false);
      }
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-trigger')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown, isMobileMenuOpen]);

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowMobileSearch(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
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

            {/* Desktop Navigation Section */}
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

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle search"
              >
                <Search size={20} />
              </button>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-menu-trigger p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Desktop Profile Section */}
            <div 
              className="hidden md:flex items-center relative"
              role="region"
              aria-label="User profile"
            >
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-searchbar-text hidden lg:inline">
                    Welcome, {user.profile?.first_name || user.name}
                  </span>
                  <div className="h-6 w-px bg-navbar-border hidden lg:block" />
                  <NotificationBell className="mr-2" />
                  <div className="relative profile-dropdown">
                    <NavProfileIcon
                      profImg={getProfileImageUrl(user.profileImage, user.profile?.profile_picture)}
                      alt={`${user.profile?.first_name || user.name} profile picture`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(!showDropdown);
                      }}
                      aria-expanded={showDropdown}
                      aria-haspopup={true}
                    />
                    
                    {/* Desktop Dropdown Menu */}
                    {showDropdown && (
                      <div 
                        className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu"
                      >
                        <div className="py-1" role="none">
                          <a
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                            onClick={() => setShowDropdown(false)}
                          >
                            Your Profile
                          </a>
                          <a
                            href="/notifications"
                            className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                            onClick={() => setShowDropdown(false)}
                          >
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px]">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </a>
                          <a
                            href="/settings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                            onClick={() => setShowDropdown(false)}
                          >
                            Settings
                          </a>
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search jobs, companies..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 top-16 z-40 bg-black bg-opacity-25"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div 
        className={`mobile-menu md:hidden fixed top-16 right-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile User Section */}
          {user ? (
            <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center space-x-3">
                <img
                  src={getProfileImageUrl(user.profileImage, user.profile?.profile_picture)}
                  alt={`${user.profile?.first_name || user.name} profile picture`}
                  className="w-12 h-12 rounded-full border-2 border-white"
                />
                <div>
                  <h3 className="font-semibold text-lg">
                    {user.profile?.first_name || user.name}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {user.profile?.last_name && `${user.profile.first_name} ${user.profile.last_name}`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome to AustralianJobs</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleMobileNavigation('/login')}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleMobileNavigation('/signup')}
                  className="w-full border border-blue-500 text-blue-500 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-1">
              <button
                onClick={() => handleMobileNavigation('/')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home size={20} />
                <span className="font-medium">Home</span>
              </button>

              <button
                onClick={() => handleMobileNavigation('/jobs')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  location.pathname === '/jobs' || location.pathname.startsWith('/job')
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Briefcase size={20} />
                <span className="font-medium">Find Jobs</span>
              </button>

              <button
                onClick={() => handleMobileNavigation('/about')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  location.pathname === '/about'
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Info size={20} />
                <span className="font-medium">About</span>
              </button>

              <button
                onClick={() => handleMobileNavigation('/pricing')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  location.pathname === '/pricing'
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <DollarSign size={20} />
                <span className="font-medium">Pricing</span>
              </button>

              {user && (
                <>
                  <div className="h-px bg-gray-200 my-4" />
                  
                  <button
                    onClick={() => handleMobileNavigation('/profile')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      location.pathname === '/profile'
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User size={20} />
                    <span className="font-medium">Your Profile</span>
                  </button>

                  <button
                    onClick={() => handleMobileNavigation('/notifications')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                      location.pathname === '/notifications'
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Bell size={20} />
                      <span className="font-medium">Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleMobileNavigation('/settings')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      location.pathname === '/settings'
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Logout Button */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar; 