import JobCard from "../molecules/JobCard";
import PropTypes from "prop-types";

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

JobRow.propTypes = {
  jobCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      minSalary: PropTypes.number,
      maxSalary: PropTypes.number,
      imgSrc: PropTypes.string,
    })
  ).isRequired,
};

export default JobRow;
