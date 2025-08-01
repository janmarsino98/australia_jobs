import React, { useState, useEffect } from "react";
import SearchBox from "../components/molecules/SearchBox";
import LocationDisplayer from "../components/molecules/LocationDisplayer";
import MiniJobCard from "../components/molecules/MiniJobCard";
import CategoryChooser from "../components/molecules/CategoryChooser";
import httpClient from "../httpClient";
import NoResumeAlert from "../components/molecules/NoResumeAlert";
import { Job } from "../types";

const JobPage = (): JSX.Element => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryChange = async (selectedCategories: string[]): Promise<void> => {
    try {
      setLoading(true);
      const categoryQuery = selectedCategories.join(",");
      const response = await httpClient.get<Job[]>(
        `/jobs/get?type=${categoryQuery}`
      );
      setJobs(response.data);
      setError(null);
    } catch (error) {
      console.error("Error while fetching jobs: ", error);
      setError("Failed to fetch jobs");
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
        <div className="flex flex-col w-full">
          <div className="mx-20 mt-[15px]">
            <SearchBox onSearch={() => {}} showAdvancedSearch={false} defaultValue={""} />
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
                  jobType={job.jobtype}
                  jobSchedule={job.remuneration_period}
                  />
              ))}
            </div>
          </div>
        </div>
        <NoResumeAlert />
      </div>
    </div>
  );
};

export default JobPage; 