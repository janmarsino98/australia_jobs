import React from "react";

const NavIconImg = ({ img_url }) => {
  return (
    <div className="h-full w-max justify-center p-0 m-0">
      <img
        className="h-[40px] rounded-full w-[40px]"
        src={img_url}
        alt="firm-icon"
      />
    </div>
  );
};

export default NavIconImg;
