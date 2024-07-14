import React from "react";

const NavTextOption = ({ text, path }) => {
  return (
    <div className=" text-main-text text-[14px] font-medium">
      <a href={path}>{text}</a>
    </div>
  );
};

export default NavTextOption;
