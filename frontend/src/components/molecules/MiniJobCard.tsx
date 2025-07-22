import PropTypes from "prop-types";

interface MiniJobCardProps {
  jobImg?: string;
  jobTitle: string;
  jobType: string;
  jobSchedule: string;
}

const MiniJobCard = ({ jobImg, jobTitle, jobType, jobSchedule }: MiniJobCardProps) => {
  return (
    <div className="w-max flex flex-row gap-4 h-max">
      <div className="w-[45px] h-[45px] rounded-full flex items-center justify-center bg-green-900 border-4 border-stone-600">
        <span className="">A</span>
      </div>
      <div className="flex flex-col justify-center">
        <span className="font-bold text-[16px]">{jobTitle}</span>
        <span className="text-searchbar-text text-[14px]">
          {jobType}-{jobSchedule}
        </span>
      </div>
    </div>
  );
};

MiniJobCard.propTypes = {
  jobImg: PropTypes.string,
  jobTitle: PropTypes.string.isRequired,
  jobType: PropTypes.string.isRequired,
  jobSchedule: PropTypes.string.isRequired,
};

export default MiniJobCard;
