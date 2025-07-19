import { useEffect, useState } from "react";
import Navbar from "../components/molecules/Navbar";
import SearchBox from "../components/molecules/SearchBox";
import JobRow from "../components/organisms/JobRow";
import LocationDisplayer from "../components/molecules/LocationDisplayer";
import MainFooter from "../components/molecules/MainFooter";
import httpClient from "../httpClient";
import { User, JobCard } from "../types";
import useAuthStore from "../stores/useAuthStore";

const Landing = (): JSX.Element => {
  const { user, isAuthenticated } = useAuthStore();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);

  useEffect(() => {
    // Fetch job cards or other data as needed
    // User data is now managed by the auth store
  }, []);

  // Prepare user data for Navbar component
  const navbarUser = user ? {
    name: user.name,
    profile: user.profile,
    profileImage: user.profileImage
  } : undefined;

  const handleSearch = (searchTerm: string) => {
    // Handle search functionality
    console.log('Search term:', searchTerm);
  };

  return (
    <div>
      <div className="font-sans flex flex-col items-center">
        <Navbar user={navbarUser} />
        <div className="flex flex-col max-w-[960px] my-[20px]">
          <h1 className="text-[32px] font-bold ml-[16px] mb-[16px]">
            {user && user.profile?.first_name 
              ? `${user.profile.first_name}, Find Jobs Near You`
              : user?.name 
                ? `${user.name}, Find Jobs Near You`
                : "Find Jobs Near You"
            }
          </h1>
          <div className="pl-[16px]">
            <SearchBox onSearch={handleSearch} />
            <LocationDisplayer />
            <JobRow jobCards={jobCards} />
            <MainFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing; 