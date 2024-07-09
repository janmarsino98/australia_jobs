import React from "react";

const MainButton = ({ type, text }) => {
  const getTypeProperties = (type) => {
    if (type === "white") {
      return " text-black bg-white hover:text-white hover:bg-main-blue ";
    } else if (type === "blue") {
      return "text-white bg-main-blue hover:bg-main-light-blue";
    }
  };
  return (
    <button
      className={`border-[2px] font-bold border-main-blue rounded-full text-[15px] h-max py-2 px-6 ${getTypeProperties(
        type
      )}`}
    >
      {text}
    </button>
  );
};

export default MainButton;
