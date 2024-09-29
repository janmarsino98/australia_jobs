import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import httpClient from "../../httpClient";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Search, MapPin, Briefcase, Clock, DollarSign } from "lucide-react";
import MainHeader from "../molecules/MainHeader";
import { useNavigate } from "react-router-dom";
import NoResumeAlert from "../molecules/NoResumeAlert";

export default function JobsPage() {
  const [cities, setCities] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchParams, setSearchParams] = useState({
    title: "",
    location: "",
  });

  const navigate = useNavigate();

  const fetchCities = async () => {
    try {
      const resp = await httpClient.get(
        "http://localhost:5000/cities/get_main"
      );
      setCities(resp.data);
    } catch (error) {
      console.error("Error trying to get cities: ", error);
    }
  };

  const fetchJobs = async (title = "", location = "") => {
    try {
      let endpoint = "http://localhost:5000/jobs/get";

      if (title || location) {
        endpoint += `?title=${title}&location=${location}`;
      }

      const resp = await httpClient.get(endpoint);
      setJobs(resp.data);
    } catch (error) {
      console.error("Error trying to fetch last jobs: ", error);
    }
  };

  useEffect(() => {
    fetchCities();
    fetchJobs();
  }, []);

  const handleSearch = () => {
    fetchJobs(searchParams.title, searchParams.location);
    console.log(`The current params are: ${searchParams}`);
  };

  const handleViewJobClick = (link) => {
    navigate(`/job/${link}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <MainHeader />

      <main className="flex-1 p-6 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-gray-800">
              Find Your Next{" "}
              <span className="text-blue-500">Career Opportunity</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Explore thousands of job listings across Australia and find the
              perfect match for your skills and aspirations.
            </p>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Job title or keywords"
                className="md:col-span-2"
                value={searchParams.title}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, title: e.target.value })
                }
              />
              <Select
                onValueChange={(value) =>
                  setSearchParams({ ...searchParams, location: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city, index) => (
                    <SelectItem value={city.city} key={index}>
                      {city.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSearch}
              >
                <Search className="mr-2 h-4 w-4" /> Search Jobs
              </Button>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Featured Job Listings
            </h2>
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      {job.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-600">
                        <Briefcase className="mr-2 h-4 w-4" />
                        {job.firm}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="mr-2 h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="mr-2 h-4 w-4" />
                        {job.shift}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="mr-2 h-4 w-4" />
                        {job.remuneration_amount} / {job.remuneration_period}
                      </div>
                    </div>
                    <Button
                      className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => handleViewJobClick(job.slug)}
                    >
                      View Job
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-gray-600 mb-6">
              Set up job alerts and be the first to know when your dream job
              becomes available.
            </p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Create Job Alert
            </Button>
          </section>
        </div>
        <NoResumeAlert />
      </main>

      <footer className="bg-gray-800 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm mb-4 sm:mb-0">
            © 2024 AusJobs. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-sm hover:text-blue-300">
              Privacy
            </a>
            <a href="#" className="text-sm hover:text-blue-300">
              Terms
            </a>
            <a href="#" className="text-sm hover:text-blue-300">
              Cookies
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
