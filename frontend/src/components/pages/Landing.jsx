import React from "react";
import Navbar from "../molecules/Navbar";
import SearchBox from "../molecules/SearchBox";
import JobCard from "../molecules/JobCard";

const Landing = () => {
  return (
    <div>
      <div className="font-sans flex flex-col">
        <Navbar></Navbar>
        <div className="flex flex-col mx-[160px] my-[20px]">
          <h1 className="text-[32px] font-bold ml-[16px] mb-[16px]">
            Find Jobs Near You
          </h1>
          <SearchBox></SearchBox>
          <JobCard
            title="Cleaner"
            imgSrc="https://images.pexels.com/photos/313715/pexels-photo-313715.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            minSalary={1000}
            maxSalary={2000}
          ></JobCard>
        </div>
      </div>
    </div>
  );
};

export default Landing;
