import React, { useState } from "react";

interface CategoryPillProps {
  name: string;
  handleClick: (value: string) => void;
  value: string;
}

const Category_Pill = ({ name, handleClick, value }: CategoryPillProps): JSX.Element => {
  const [hover, setHover] = useState<boolean | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(value);
    }
  };

  return (
    <button
      className="w-max h-max bg-pill-bg text-pill-text px-[20px] py-[10px] rounded-full hover:border-red-500 hover:border relative focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={() => handleClick(value)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Remove ${name} category`}
    >
      {hover && (
        <span 
          className="absolute right-0 top-0 font-bold text-[10px] flex border border-red-700 text-red-500 bg-red-300 rounded-full w-4 h-4 p-1 items-center justify-center"
          aria-hidden="true"
        >
          X
        </span>
      )}
      <span>{name}</span>
    </button>
  );
};

export default Category_Pill; 