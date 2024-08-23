import React from "react";
import Navbar from "../molecules/Navbar";
import SearchBox from "../molecules/SearchBox";
import LocationDisplayer from "../molecules/LocationDisplayer";
import MiniJobCard from "../molecules/MiniJobCard";

const JobPage = () => {
  return (
    <div>
      <div className="font-sans flex flex-col items-center">
        <Navbar></Navbar>
        <div className="flex flex-col w-full">
          <div className="mx-20 mt-[15px]">
            <SearchBox></SearchBox>
            <LocationDisplayer />
            <h1 className="text-[24px] font-bold mt-[30px]">Cleaner jobs</h1>
            <div className="flex flex-col gap-3 mt-5">
              <MiniJobCard
                jobTitle={"Waiter"}
                jobImg={
                  "https://s3.pixers.pics/pixers/160/FO/57/40/61/06/160_FO57406106_0055f01a13b952179d8bd7db61b6a0ba.jpg"
                }
                jobType={"Full Time"}
                jobSchedule={"Night"}
              ></MiniJobCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPage;
