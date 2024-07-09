import React from "react";
import Navbar_option from "../atoms/Navbar_option";
import MainButton from "../atoms/MainButton";

const Navbar = ({ navbar_options }) => {
  return (
    <div className="w-full border border-black flex justify-between py-3 mb-6 px-2 bg-white">
      <div className="w-[40px]">
        <img
          src="https://www.bigbasket.com/media/uploads/p/xxl/40233064_1-kleeno-by-cello-swachh-grass-broom-high-quality-easy-to-use-blue.jpg"
          alt=""
        />
      </div>
      <div className="flex flex-row w-max justify-end gap-28 mr-5">
        {navbar_options.map((navbar_option, index) => (
          <Navbar_option
            text={navbar_option.text}
            link={navbar_option.link}
            isActive={navbar_option.isActive}
            key={index}
          />
        ))}
      </div>
      <div className="flex flex-row w-max gap-5">
        <MainButton text="Search Jobs" type="blue"></MainButton>
        <MainButton text="Log In / Join" type="white"></MainButton>
      </div>
    </div>
  );
};

export default Navbar;
