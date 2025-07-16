import React from "react";

interface NavIconImgProps {
  img_url: string;
  alt: string;
}

const NavIconImg = ({ img_url, alt }: NavIconImgProps): JSX.Element => {
  return (
    <div className="w-[32px] h-[32px] rounded-full">
      <img src={img_url} alt={alt} className="w-full h-full object-cover rounded-full" />
    </div>
  );
};

export default NavIconImg; 