import { useState } from "react";

const Category_Pill = ({ name, handleClick, value }) => {
  const [hover, setHover] = useState(null);

  return (
    <button
      className="w-max h-max bg-pill-bg text-pill-text px-[20px] py-[10px] rounded-full hover:border-red-500 hover:border relative"
      onClick={handleClick}
      value={value}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && (
        <div className="absolute right-0 top-0 font-bold text-[10px] flex border border-red-700 text-red-500 bg-red-300 rounded-full w-4 h-4 p-1 items-center justify-ceter">
          X
        </div>
      )}
      <span>{name}</span>
    </button>
  );
};

export default Category_Pill;
