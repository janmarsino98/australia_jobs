import React from "react";
import { useNavigate } from "react-router-dom";
import NavIconImg from "../atoms/NavIconImg";
import NavFirmName from "../atoms/NavFirmName";
import NavTextOption from "../atoms/NavTextOption";
import NavProfileIcon from "../atoms/NavProfileIcon";
import main_logo from "../../imgs/logo.png";

interface NavbarProps {
  user?: {
    name: string;
    profileImage?: string;
  };
}

const Navbar = ({ user }: NavbarProps): JSX.Element => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleLogoClick();
    }
  };

  return (
    <div 
      className="px-[40px] py-[12px] w-full bg-main-white-bg flex flex-row border border-b-dark-white items-center"
      role="banner"
    >
      <div
        className="p-2 cursor-pointer"
        onClick={handleLogoClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Go to homepage"
      >
        <div className="flex flex-row gap-[16px] h-full items-center">
          <NavIconImg img_url={main_logo} alt="AustralianJobs logo" />
          <NavFirmName name="AustralianJobs" />
        </div>
      </div>
      <nav 
        className="w-full justify-end flex flex-row items-center gap-[36px]"
        role="navigation"
        aria-label="Main navigation"
      >
        <NavTextOption text="Find Jobs" path="/jobs" />
        <NavTextOption text="Company Reviews" path="/reviews" />
        <NavTextOption text="Find Salaries" path="/salaries" />
      </nav>
      <div 
        className="flex flex-row gap-[32px] ml-[32px]"
        role="complementary"
        aria-label="User profile"
      >
        <NavProfileIcon
          profImg={user?.profileImage || "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"}
          alt={`${user?.name || 'User'} profile picture`}
        />
      </div>
    </div>
  );
};

export default Navbar; 