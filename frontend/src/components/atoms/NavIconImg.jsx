import React from "react";

const NavIconImg = ({ img_url }) => {
  return (
    <div className="h-full justify-center p-0 m-0">
      <img className="h-[16px]" src={img_url} alt="firm-icon" />
    </div>
  );
};

export default NavIconImg;
