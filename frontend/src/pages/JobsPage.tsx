import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import httpClient from "../httpClient";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, MapPin, Briefcase, Clock, DollarSign, Filter, ChevronDown, ChevronUp, Bookmark } from "lucide-react";
import SearchHistory from "../components/molecules/SearchHistory";
import SearchSuggestions from "../components/molecules/SearchSuggestions";
import SavedSearches from "../components/molecules/SavedSearches";
import ProfileCompleteness from "../components/molecules/ProfileCompleteness";
import JobApplicationTracker from "../components/molecules/JobApplicationTracker";
import { useNavigate } from "react-router-dom";
import NoResumeAlert from "../components/molecules/NoResumeAlert";
import { useZodForm } from "../hooks/useZodForm";
import { jobSearchSchema } from "../lib/validations/forms";
import useSearchHistoryStore from "../stores/useSearchHistoryStore";
import useSavedSearchesStore from "../stores/useSavedSearchesStore";
import useJobApplicationStore from "../stores/useJobApplicationStore";

// Utility function to format location consistently
const formatLocation = (location: string | { city: string; state: string }) => {
  if (!location) return '';
  
  if (typeof location === 'object') {
    if (location.city && location.state) {
      return `${location.city}, ${location.state}`;
    }
    if (location.city) {
      return location.city;
    }
    // If it's an object but missing expected properties, return empty string
    return '';
  }
  
  return String(location);
};

// Utility function to safely render job description
const formatDescription = (description: string | { introduction: string; responsibilities: string[]; requirements: string[] }) => {
  if (!description) return 'No description available';
  
  if (typeof description === 'object') {
    // If description is an object with structured data, return the introduction
    if (description.introduction) {
      return description.introduction;
    }
    // If it's an object but missing introduction, try to create a summary
    const parts = [];
    if (description.responsibilities && description.responsibilities.length > 0) {
      parts.push(description.responsibilities[0]);
    }
    if (description.requirements && description.requirements.length > 0) {
      parts.push(description.requirements[0]);
    }
    return parts.length > 0 ? parts.join(' ') : 'View job details for more information';
  }
  
  // If it's a string, return it as is
  return String(description);
};

export default function JobsPage() {
  const navigate = useNavigate();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showSaveSearchDialog, setShowSaveSearchDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [user, setUser] = useState(null);
  
  const { addSearch } = useSearchHistoryStore();
  const { addSavedSearch } = useSavedSearchesStore();
  const { addApplication } = useJobApplicationStore();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { isSubmitting },
  } = useZodForm({
    schema: jobSearchSchema,
    defaultValues: {
      title: "",
      location: "",
      categories: [],
      salary: { min: undefined, max: undefined },
      jobType: "all",
      experienceLevel: "all",
      datePosted: "all",
      workArrangement: "all"
    },
  });

  const watchedTitle = watch("title");
  const watchedLocation = watch("location");
  

  const fetchUser = async () => {
    try {
      const resp = await httpClient.get("/auth/@me");
      setUser(resp.data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Close any open suggestions
      setShowTitleSuggestions(false);
      setShowLocationSuggestions(false);

      const endpoint = new URL("/jobs/get", httpClient.defaults.baseURL);
      
      if (data.title) endpoint.searchParams.append("title", data.title);
      if (data.location) endpoint.searchParams.append("location", formatLocation(data.location));
      if (data.categories?.length) {
        endpoint.searchParams.append("categories", data.categories.join(","));
      }
      if (data.salary?.min) endpoint.searchParams.append("salaryMin", data.salary.min.toString());
      if (data.salary?.max) endpoint.searchParams.append("salaryMax", data.salary.max.toString());
      if (data.jobType && data.jobType !== "all") endpoint.searchParams.append("jobType", data.jobType);
      if (data.experienceLevel && data.experienceLevel !== "all") endpoint.searchParams.append("experienceLevel", data.experienceLevel);
      if (data.datePosted && data.datePosted !== "all") endpoint.searchParams.append("datePosted", data.datePosted);
      if (data.workArrangement && data.workArrangement !== "all") endpoint.searchParams.append("workArrangement", data.workArrangement);

      const resp = await httpClient.get(endpoint.toString());
      setJobs(resp.data);

      // Add to search history if there's a meaningful search
      if (data.title || data.location) {
        addSearch({
          query: data.title || "",
          location: formatLocation(data.location) || "",
          resultsCount: resp.data.length,
        });
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const [cities, setCities] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchCities = async () => {
    try {
      const resp = await httpClient.get("/cities/get_main");
      // Ensure cities is always an array
      setCities(Array.isArray(resp.data) ? resp.data : []);
    } catch (error) {
      console.error("Error trying to get cities: ", error);
      setCities([]); // Set empty array on error
    }
  };

  useEffect(() => {
    fetchUser();
    fetchCities();
    onSubmit({}); // Initial job fetch with empty params
  }, []);

  const handleViewJobClick = (job: any) => {
    navigate(`/job-details/${job.slug || job._id}`);
  };

  const handleApplyClick = (job: any) => {
    // Add application to tracker
    addApplication({
      jobTitle: job.title,
      company: job.firm || 'Company',
      location: formatLocation(job.location),
      salary: job.remuneration_amount ? {
        min: job.remuneration_amount,
        max: job.remuneration_amount,
        currency: 'AUD'
      } : undefined,
      jobUrl: `${window.location.origin}/job-details/${job.slug || job._id}`,
    });
    
    // Show success message or redirect
    alert('Application tracked successfully!');
  };

  const handleSearchHistorySelect = (query: string, location: string) => {
    setValue("title", query);
    if (location) setValue("location", formatLocation(location));
    // Trigger search with the selected history item
    onSubmit({ title: query, location: formatLocation(location) || "" });
  };

  const handleTitleSuggestionSelect = (suggestion: string) => {
    setValue("title", suggestion);
    setShowTitleSuggestions(false);
  };

  const handleLocationSuggestionSelect = (suggestion: string) =>   {
    setValue("location", suggestion);
    setShowLocationSuggestions(false);
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return;
    
    const currentFilters = getValues();
    addSavedSearch({
      name: saveSearchName.trim(),
      filters: currentFilters,
      alertsEnabled: false,
    });
    
    setSaveSearchName("");
    setShowSaveSearchDialog(false);
  };

  const handleLoadSavedSearch = (filters: any) => {
    // Set all form values based on the saved search
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        // Special handling for location to ensure it's always a string
        if (key === 'location') {
          setValue(key, formatLocation(filters[key]));
        } else {
          setValue(key, filters[key]);
        }
      }
    });
    
    // Ensure location is formatted for search submission
    const formattedFilters = {
      ...filters,
      location: formatLocation(filters.location)
    };
    
    // Trigger the search
    onSubmit(formattedFilters);
  };

  const handleProfileAction = (action: string) => {
    // Navigate to different profile editing sections based on action
    switch (action) {
      case 'upload-resume':
        navigate('/resume');
        break;
      case 'edit-profile':
        navigate('/profile/edit');
        break;
      case 'add-experience':
        navigate('/profile/experience');
        break;
      case 'add-education':
        navigate('/profile/education');
        break;
      case 'add-skills':
        navigate('/profile/skills');
        break;
      case 'add-contact':
        navigate('/profile/contact');
        break;
      case 'add-bio':
        navigate('/profile/summary');
        break;
      case 'add-location':
        navigate('/profile/location');
        break;
      case 'set-preferences':
        navigate('/profile/preferences');
        break;
      case 'add-links':
        navigate('/profile/links');
        break;
      default:
        navigate('/profile');
        break;
    }
  };

  const handleAddApplication = () => {
    // For now, just show an alert. In a real app, this would open a form
    alert('Add Application form would open here');
  };

  const hasActiveFilters = () => {
    const values = getValues();
    return values.title || 
           values.location || 
           (values.salary?.min || values.salary?.max) ||
           (values.jobType && values.jobType !== "all") ||
           (values.experienceLevel && values.experienceLevel !== "all") ||
           (values.datePosted && values.datePosted !== "all") ||
           (values.workArrangement && values.workArrangement !== "all");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NoResumeAlert />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Find Your Next Job</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Job Title Input with Suggestions */}
              <div className="relative flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-500" />
                <div className="relative flex-1">
                  <Input
                    placeholder="Job title or keyword"
                    {...register("title")}
                    onFocus={() => setShowTitleSuggestions(true)}
                    onChange={(e: any) => {
                      register("title").onChange(e);
                      setShowTitleSuggestions(true);
                    }}
                  />
                  {showTitleSuggestions && (
                    <SearchSuggestions
                      query={watchedTitle || ""}
                      onSuggestionSelect={handleTitleSuggestionSelect}
                      onClose={() => setShowTitleSuggestions(false)}
                      type="title"
                    />
                  )}
                </div>
              </div>

              {/* Location Input with Suggestions */}
              <div className="relative flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div className="relative flex-1">
                  <Select
                    onValueChange={(value) => {
                      setValue("location", value);
                      setShowLocationSuggestions(false);
                    }}
                    value={formatLocation(watch("location") || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city: any) => {
                        // Handle both string and object city formats
                        const cityKey = typeof city === 'object' ? city._id : city;
                        const cityValue = typeof city === 'object' ? `${city.city}, ${city.state}` : city;
                        const cityDisplay = typeof city === 'object' ? `${city.city}, ${city.state}` : city;
                        
                        return (
                          <SelectItem key={cityKey} value={cityValue}>
                            {cityDisplay}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Advanced Filters</span>
                {showAdvancedFilters ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? "Searching..." : "Search Jobs"}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Advanced Filters</h3>
                  {hasActiveFilters() && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSaveSearchDialog(!showSaveSearchDialog)}
                      className="flex items-center space-x-2"
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>Save Search</span>
                    </Button>
                  )}
                </div>

                {/* Save Search Dialog */}
                {showSaveSearchDialog && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Enter search name..."
                        value={saveSearchName}
                        onChange={(e) => setSaveSearchName(e.target.value)}
                        onKeyPress={(e: any) => e.key === 'Enter' && handleSaveSearch()}
                      />
                      <Button
                        type="button"
                        onClick={handleSaveSearch}
                        disabled={!saveSearchName.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowSaveSearchDialog(false);
                          setSaveSearchName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Salary Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Salary Range (AUD)</label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        {...register("salary.min", { valueAsNumber: true })}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        {...register("salary.max", { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Type</label>
                    <Select
                      onValueChange={(value) => setValue("jobType", value)}
                      value={watch("jobType")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experience Level */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Experience Level</label>
                    <Select
                      onValueChange={(value) => setValue("experienceLevel", value)}
                      value={watch("experienceLevel")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Posted */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Posted</label>
                    <Select
                      onValueChange={(value) => setValue("datePosted", value)}
                      value={watch("datePosted")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="last3days">Last 3 Days</SelectItem>
                        <SelectItem value="lastWeek">Last Week</SelectItem>
                        <SelectItem value="lastMonth">Last Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Work Arrangement */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Arrangement</label>
                    <Select
                      onValueChange={(value) => setValue("workArrangement", value)}
                      value={watch("workArrangement")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select arrangement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Arrangements</SelectItem>
                        <SelectItem value="on-site">On-site</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                  
                    type="button"
                    
                    variant="outline"
                    
                    onClick={() => {
                      setValue("salary", { min: undefined, max: undefined });
                      setValue("jobType", "all");
                      setValue("experienceLevel", "all");
                      setValue("datePosted", "all");
                      setValue("workArrangement", "all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Profile Completeness */}
          <ProfileCompleteness
            user={user}
            onActionClick={handleProfileAction}
            className="lg:col-span-1"
          />
          
          {/* Search History */}
          <SearchHistory
            onSearchSelect={handleSearchHistorySelect}
            className="lg:col-span-1"
          />
          
          {/* Saved Searches */}
          <SavedSearches
            onSearchLoad={handleLoadSavedSearch}
            className="lg:col-span-1"
          />
        </div>

        {/* Job Application Tracker */}
        <div className="mb-6">
          <JobApplicationTracker
            onAddApplication={handleAddApplication}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: any) => (
            <Card key={job._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{job.title}</CardTitle>
                <div className="flex items-center text-gray-500 text-sm space-x-4">
                  <span className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {job.jobtype}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {formatLocation(job.location)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {formatDescription(job.description)}
                </p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently posted'}
                  </span>
                  <span className="flex items-center font-semibold text-green-600">
                    <DollarSign className="w-4 h-4" />
                    {job.remuneration_amount ? `${job.remuneration_amount}/${job.remuneration_period}` : 'Competitive'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewJobClick(job)}
                  >
                    View Details
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleApplyClick(job)}
                  >
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
