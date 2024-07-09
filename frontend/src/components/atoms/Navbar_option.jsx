import React from "react";

const Navbar_option = ({ text, link, isActive }) => {
  return (
    <div className="w-max h-full text-gray-500 text-[20px] relative">
      <a
        className={
          " justify-center items-center " && isActive
            ? "text-main-blue font-bold"
            : ""
        }
        href={link}
      >
        {text}
      </a>
      {isActive && (
        <div className="absolute -bottom-3 border border-main-blue w-full"></div>
      )}
    </div>
  );
};

export default Navbar_option;
