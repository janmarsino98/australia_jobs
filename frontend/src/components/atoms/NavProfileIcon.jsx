import React from "react";

const NavProfileIcon = ({ profImg }) => {
  return (
    <div className="w-[40px] h-[40px]">
      <img
        src={profImg}
        alt="profile picture"
        className="rounded-full w-full h-full object-cover"
      />
    </div>
  );
};

export default NavProfileIcon;
