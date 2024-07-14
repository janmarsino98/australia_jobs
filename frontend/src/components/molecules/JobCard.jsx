import React from "react";

const JobCard = ({ title, minSalary, maxSalary, imgSrc }) => {
  return (
    <div className="flex flex-col">
      <div className="w-[223px] h-[125px] rounded-[12px]">
        <img
          src={imgSrc}
          alt="Job Card Img"
          className="h-full w-full object-cover rounded-[12px]"
        />
      </div>
      <div className="text-[16px] mt-[12px]">{title}</div>
      <div className=" text-searchbar-text">
        {`$${minSalary}-$${maxSalary}/month`}
      </div>
    </div>
  );
};

export default JobCard;
