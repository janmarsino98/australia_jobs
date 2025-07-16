import React from "react";

interface NavProfileIconProps {
  profImg: string;
  alt: string;
}

const NavProfileIcon = ({ profImg, alt }: NavProfileIconProps): JSX.Element => {
  return (
    <button 
      className="w-[32px] h-[32px] rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Open user menu"
    >
      <img src={profImg} alt={alt} className="w-full h-full object-cover rounded-full" />
    </button>
  );
};

export default NavProfileIcon; 