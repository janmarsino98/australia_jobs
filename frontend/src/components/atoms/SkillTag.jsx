import React from "react";

const SkillTag = ({ text }) => {
  return (
    <div className="rounded-full bg-skill-tag-bg text-skill-tag-text font-bold py-[5px] px-[10px] text-[13px]">
      {text}
    </div>
  );
};

export default SkillTag;
