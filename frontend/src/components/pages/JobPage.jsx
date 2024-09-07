import { useState, useEffect } from "react";
import Navbar from "../molecules/Navbar";
import SearchBox from "../molecules/SearchBox";
import LocationDisplayer from "../molecules/LocationDisplayer";
import MiniJobCard from "../molecules/MiniJobCard";
import CategoryChooser from "../molecules/CategoryChooser";
import httpClient from "../../httpClient";
import MainHeader from "../molecules/MainHeader";

const JobPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCategoryChange = async (selectedCategories) => {
    try {
      setLoading(true);
      const categoryQuery = selectedCategories.join(",");
      const response = await httpClient.get(
        `http://localhost:5000/jobs/get?type=${categoryQuery}`
      );
      setJobs(response.data);
      setError(null);
    } catch (error) {
      console.error("Error while fetching jobs: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial job fetch (optional)
    handleCategoryChange([]);
  }, []);

  return (
    <div>
      <div className="flex flex-col min-h-screen bg-white">
        <MainHeader />
        <div className="flex flex-col w-full">
          <div className="mx-20 mt-[15px]">
            <SearchBox></SearchBox>
            <div className="flex felx-row gap-4 items-center justify-between">
              <LocationDisplayer />
              <CategoryChooser onCategoryChange={handleCategoryChange} />
            </div>
            <h1 className="text-[24px] font-bold mt-[30px]">Cleaner jobs</h1>
            <div className="flex flex-col gap-3 mt-5">
              {jobs.map((job) => (
                <MiniJobCard
                  key={job._id}
                  jobTitle={job.jobtype}
                  jobImg={job.avatar}
                  jobSchedule={job.remuneration_period}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPage;
