import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import httpClient from "../httpClient";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, MapPin, Briefcase, Clock, DollarSign } from "lucide-react";
import MainHeader from "../components/molecules/MainHeader";
import { useNavigate } from "react-router-dom";
import NoResumeAlert from "../components/molecules/NoResumeAlert";
import { useZodForm } from "../hooks/useZodForm";
import { jobSearchSchema } from "../lib/validations/forms";

export default function JobsPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useZodForm({
    schema: jobSearchSchema,
    defaultValues: {
      title: "",
      location: "",
      categories: [],
    },
  });

  const onSubmit = async (data) => {
    try {
      const endpoint = new URL("http://localhost:5000/jobs/get");
      if (data.title) endpoint.searchParams.append("title", data.title);
      if (data.location) endpoint.searchParams.append("location", data.location);
      if (data.categories?.length) {
        endpoint.searchParams.append("categories", data.categories.join(","));
      }

      const resp = await httpClient.get(endpoint.toString());
      setJobs(resp.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const [cities, setCities] = useState([]);
  const [jobs, setJobs] = useState([]);

  const fetchCities = async () => {
    try {
      const resp = await httpClient.get("http://localhost:5000/cities/get_main");
      setCities(resp.data);
    } catch (error) {
      console.error("Error trying to get cities: ", error);
    }
  };

  useEffect(() => {
    fetchCities();
    onSubmit({}); // Initial job fetch with empty params
  }, []);

  const handleViewJobClick = (link) => {
    navigate(`/job/${link}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <NoResumeAlert />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Find Your Next Job</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-500" />
                <Input
                  placeholder="Job title or keyword"
                  {...register("title")}
                />
              </div>

              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <Select
                  onValueChange={(value) => setValue("location", value)}
                  value={watch("location")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? "Searching..." : "Search Jobs"}
              </Button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{job.title}</CardTitle>
                <div className="flex items-center text-gray-500 text-sm space-x-4">
                  <span className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {job.type}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {job.location}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {job.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(job.posted_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center font-semibold text-green-600">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleViewJobClick(job.slug)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
