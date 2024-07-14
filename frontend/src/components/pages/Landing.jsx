import React from "react";
import Navbar from "../molecules/Navbar";
import SearchBox from "../molecules/SearchBox";
import JobCard from "../molecules/JobCard";
import JobRow from "../organisms/JobRow";
import LocationDisplayer from "../molecules/LocationDisplayer";

const Landing = () => {
  return (
    <div>
      <div className="font-sans flex flex-col items-center">
        <Navbar></Navbar>
        <div className="flex flex-col max-w-[960px] my-[20px]">
          <h1 className="text-[32px] font-bold ml-[16px] mb-[16px]">
            Find Jobs Near You
          </h1>
          <div className="pl-[16px]">
            <SearchBox></SearchBox>
            <LocationDisplayer></LocationDisplayer>
            <JobRow
              jobCards={[
                {
                  title: "cleaner",
                  imgSrc:
                    "https://images.pexels.com/photos/4239130/pexels-photo-4239130.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                  minSalary: 1000,
                  maxSalary: 2000,
                },
                {
                  title: "waiter",
                  imgSrc:
                    "https://images.pexels.com/photos/4350219/pexels-photo-4350219.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                  minSalary: 1500,
                  maxSalary: 2300,
                },
                {
                  title: "Babysitter",
                  imgSrc:
                    "https://images.pexels.com/photos/459976/pexels-photo-459976.jpeg?auto=compress&cs=tinysrgb&w=600",
                  minSalary: 1000,
                  maxSalary: 2000,
                },
                {
                  title: "Receptionist",
                  imgSrc:
                    "https://images.pexels.com/photos/3771811/pexels-photo-3771811.jpeg?auto=compress&cs=tinysrgb&w=600",
                  minSalary: 1000,
                  maxSalary: 2000,
                },
                {
                  title: "Construction",
                  imgSrc:
                    "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=600",
                  minSalary: 1000,
                  maxSalary: 2000,
                },
                {
                  title: "Gardener",
                  imgSrc:
                    "https://images.pexels.com/photos/5231143/pexels-photo-5231143.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                  minSalary: 1000,
                  maxSalary: 2000,
                },
                {
                  title: "Packer",
                  imgSrc:
                    "https://images.pexels.com/photos/4246109/pexels-photo-4246109.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                  minSalary: 1000,
                  maxSalary: 2000,
                },
                {
                  title: "Kitchen Assistant",
                  imgSrc:
                    "https://images.pexels.com/photos/66639/pexels-photo-66639.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                  minSalary: 1000,
                  maxSalary: 2000,
                },
              ]}
            ></JobRow>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
