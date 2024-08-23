import React from "react";

const Category_Pill = ({ name, handleClick, value }) => {
  return (
    <button
      className="w-max h-max bg-pill-bg text-pill-text px-[20px] py-[10px] rounded-full"
      onClick={handleClick}
      value={value}
    >
      <span>{name}</span>
    </button>
  );
};

export default Category_Pill;
