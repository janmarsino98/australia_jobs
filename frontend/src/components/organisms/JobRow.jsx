import React from "react";
import JobCard from "../molecules/JobCard";
let count = 0;
const JobRow = ({ jobCards }) => {
  return (
    <div className="flex flex-wrap pt-[16px] gap-[12px] justify-around">
      {jobCards.map((card, index) => {
        return (
          <JobCard
            key={index}
            title={card.title}
            minSalary={card.minSalary}
            maxSalary={card.maxSalary}
            imgSrc={card.imgSrc}
          ></JobCard>
        );
      })}
    </div>
  );
};

export default JobRow;
