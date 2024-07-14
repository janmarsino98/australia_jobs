import React from "react";

const NavProfileIcon = ({ profImg }) => {
  return (
    <div className="w-[40px]">
      <img src={profImg} alt="profile picture" className="rounded-full" />
    </div>
  );
};

export default NavProfileIcon;
