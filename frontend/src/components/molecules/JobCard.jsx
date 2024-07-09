import React from "react";
import RemoteTag from "../atoms/RemoteTag";
import SkillTag from "../atoms/SkillTag";

const JobCard = ({ title, city, state, remote, description, skills, logo }) => {
  return (
    <div className="flex w-full flex-col p-3 border h-max border-light-blue bg-light-gray rounded-md my-2 bg-white ">
      <div className="flex mb-2 relative w-full">
        <p className="text-[21px]">
          <span className="font-bold">{title}</span>
          {city && state && ` in ${city}, ${state}`}
        </p>
        <div className="absolute top-0 right-0 h-[40px] w-[40px] border-red-500">
          <img src={logo} alt="" />
        </div>
      </div>
      <div className="mb-2">
        <RemoteTag text="Remote"></RemoteTag>
      </div>
      <div className="mb-2">{description}</div>
      <div className="flex flex-row gap-2">
        {skills &&
          skills.map((skill, index) => (
            <SkillTag key={index} text={skill.name}></SkillTag>
          ))}
      </div>
    </div>
  );
};

export default JobCard;
