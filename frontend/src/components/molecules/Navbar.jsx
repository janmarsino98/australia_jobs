import React from "react";
import NavTextOption from "../atoms/NavtextOption";
import NavIconImg from "../atoms/NavIconImg";
import NavFirmName from "../atoms/NavFirmName";
import NavProfileIcon from "../atoms/NavProfileIcon";

const Navbar = () => {
  return (
    <div className="px-[40px] py-[12px] w-full bg-main-white-bg flex flex-row border border-b-dark-white items-center">
      <div className="flex flex-row gap-[16px] h-full items-center">
        <NavIconImg img_url="https://st2.depositphotos.com/1768926/7866/v/950/depositphotos_78666192-stock-illustration-a-logo-sample-logo-for.jpg" />
        <NavFirmName name="iJob" />
      </div>
      <div className="w-full justify-end flex flex-row items-center gap-[36px]">
        <NavTextOption text="Find Jobs" />
        <NavTextOption text="Company Reviews" />
        <NavTextOption text="Find Salaries" />
      </div>
      <div className="flex flex-row gap-[32px] ml-[32px]">
        <NavProfileIcon
          profImg={
            "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          }
        ></NavProfileIcon>
      </div>
    </div>
  );
};

export default Navbar;
