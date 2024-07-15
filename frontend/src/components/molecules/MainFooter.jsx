import React from "react";

const MainFooter = () => {
  return (
    <div className="w-full flex flex-col text-searchbar-text text-[16px] mt-[100px]">
      <div className="flex flex-row justify-around">
        <a href="/about">About</a>
        <a href="/employers">For Employers</a>
        <a href="/vlog">Vlog</a>
        <a href="/techblog">Tech Blog</a>
      </div>
      <div className="flex flex-row w-full justify-around mt-[24px]">
        <span>2024 iJobs</span>
      </div>
    </div>
  );
};

export default MainFooter;
