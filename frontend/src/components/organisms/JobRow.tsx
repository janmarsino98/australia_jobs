import JobCard from "../molecules/JobCard";
interface JobCard {
  id: string | number;
  title: string;
  minSalary: number;
  maxSalary: number;
  imgSrc: string;
}

interface JobRowProps {
  jobCards: JobCard[];
}

const JobRow = ({ jobCards }: JobRowProps) => {
  return (
    <div className="flex flex-wrap pt-[16px] gap-[12px] justify-around">
      {jobCards.map((card: JobCard, index: number) => {
        return (
          <JobCard
            key={index}
            title={card.title}
            minSalary={card.minSalary}
            maxSalary={card.maxSalary}
            imgSrc={card.imgSrc}
          />
        );
      })}
    </div>
  );
};


export default JobRow;
