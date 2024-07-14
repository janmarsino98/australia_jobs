import React from "react";
import JobCard from "../molecules/JobCard";
let count = 0;
const JobRow = ({ jobCards }) => {
  return (
    <div className="flex flex-row p-[16px]">
      {jobCards.map((card, index) => {
        return (
          <JobCard
            key={index}
            title={card.title}
            minSalary={card.minSalary}
            maxSalary={card.maxSalary}
            imgSrc={card.imgSrcw}
          ></JobCard>
        );
      })}
    </div>
  );
};

export default JobRow;
