import { GrSearch } from "react-icons/gr";

const SearchBox = () => {
  return (
    <div 
      className="flex flex-row rounded-lg items-center bg-dark-white shadow-lg py-[12px] px-[16px] h-[48px] my-[12px]"
      role="search"
    >
      <label htmlFor="job-search" className="sr-only">
        Search for jobs
      </label>
      <div 
        className="text-searchbar-text h-full py-[12px] flex items-center text-[20px] font-medium"
        aria-hidden="true"
      >
        <GrSearch />
      </div>
      <div className="h-full w-full">
        <input
          id="job-search"
          type="search"
          placeholder="Search for jobs by title, keyword, company, or location"
          className="text-searchbar-text text-[16px] pl-[8px] outline-none bg-dark-white w-full"
          aria-label="Search for jobs"
        />
      </div>
    </div>
  );
};

export default SearchBox;
