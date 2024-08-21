import React, { useEffect, useState } from "react";
import NavTextOption from "../atoms/NavtextOption";
import NavIconImg from "../atoms/NavIconImg";
import NavFirmName from "../atoms/NavFirmName";
import NavProfileIcon from "../atoms/NavProfileIcon";
import logo from "../../imgs/AJ_Logo.png";

const Navbar = ({ user }) => {
  const defaultAvatar =
    "https://www.testhouse.net/wp-content/uploads/2021/11/default-avatar.jpg";

  const [profileImg, setProfileImg] = useState(defaultAvatar);

  useEffect(() => {
    setProfileImg(user?.avatar || defaultAvatar);
    console.log("Profile image updated!");
    console.log(user);
  }, [user]);

  return (
    <div className="px-[40px] py-[12px] w-full bg-main-white-bg flex flex-row border border-b-dark-white items-center">
      <div className="flex flex-row gap-[16px] h-full items-center">
        <NavIconImg img_url={logo} />
        <NavFirmName name="iJob" />
      </div>
      <div className="w-full justify-end flex flex-row items-center gap-[36px]">
        <NavTextOption text="Find Jobs" />
        <NavTextOption text="Company Reviews" />
        <NavTextOption text="Find Salaries" />
      </div>
      <div className="flex flex-row gap-[32px] ml-[32px]">
        <NavProfileIcon profImg={profileImg}></NavProfileIcon>
      </div>
    </div>
  );
};

export default Navbar;
