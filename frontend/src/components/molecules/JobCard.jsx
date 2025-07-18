import PropTypes from "prop-types";

const JobCard = ({ title, minSalary, maxSalary, imgSrc, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col my-[15px] animate-pulse">
        <div className="w-[223px] h-[125px] rounded-[12px] bg-gray-200" />
        <div className="h-4 w-3/4 bg-gray-200 rounded mt-[12px]" />
        <div className="h-4 w-1/2 bg-gray-200 rounded mt-2" />
      </div>
    );
  }

  return (
    <div className="flex flex-col my-[15px]">
      <div className="w-[223px] h-[125px] rounded-[12px]">
        <img
          src={imgSrc}
          alt="Job Card Img"
          className="h-full w-full object-cover rounded-[12px]"
        />
      </div>
      <div className="text-[16px] mt-[12px]">{title}</div>
      <div className="text-searchbar-text">
        {`$${minSalary}-$${maxSalary}/month`}
      </div>
    </div>
  );
};

JobCard.propTypes = {
  title: PropTypes.string.isRequired,
  minSalary: PropTypes.number.isRequired,
  maxSalary: PropTypes.number.isRequired,
  imgSrc: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
};

export default JobCard;
