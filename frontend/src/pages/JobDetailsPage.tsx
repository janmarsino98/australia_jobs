import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building, MapPin, Clock, DollarSign, Calendar, Users, Heart, Share2, Bookmark } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import httpClient from "../httpClient";
import NoResumeAlert from "../components/molecules/NoResumeAlert";
import JobApplicationModal from "../components/molecules/JobApplicationModal";

interface JobData {
  _id: string;
  title: string;
  firm: string;
  location: string;
  jobtype: string;
  remuneration_amount: string;
  remuneration_period: string;
  posted: string;
  description: {
    introduction: string;
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
    closingStatement: string;
  };
  company_logo?: string;
  company_description?: string;
  skills_required?: string[];
  experience_level?: string;
  employment_type?: string;
  application_deadline?: string;
}

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  const fetchJob = async () => {
    try {
      setIsLoading(true);
      const resp = await httpClient.get<JobData>(`/jobs/${id}`);
      setJob(resp.data);
    } catch (error) {
      console.error("Error while trying to fetch job: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleApply = () => {
    setIsApplicationModalOpen(true);
  };

  const handleSaveJob = () => {
    setIsSaved(!isSaved);
    // TODO: Implement save job API call
  };

  const handleShareJob = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job opportunity at ${job?.firm}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-main-white-bg">
        <main className="flex-1 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-32 bg-gray-200 rounded-lg" />
              <div className="space-y-4">
                <div className="h-12 w-3/4 bg-gray-200 rounded-lg" />
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />
                  ))}
                </div>
                <div className="h-12 w-40 bg-gray-200 rounded-lg" />
              </div>
              <div className="h-96 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col min-h-screen bg-main-white-bg">
        <main className="flex-1 px-6 py-4">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-semibold text-main-text mb-4">Job Not Found</h1>
            <p className="text-searchbar-text mb-6">The job you're looking for doesn't exist or has been removed.</p>
            <Button variant="outline" onClick={handleBackClick}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-main-white-bg">
      <main className="flex-1 px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveJob}
                className={`flex items-center ${isSaved ? 'text-red-500 border-red-500' : ''}`}
              >
                <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareJob}
                className="flex items-center"
              >
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </div>
          </div>

          {/* Job Header */}
          <Card className="rounded-lg border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    {job.company_logo && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-dark-white flex-shrink-0">
                        <img
                          src={job.company_logo}
                          alt={`${job.firm} logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h1 className="text-2xl font-semibold text-main-text mb-2">
                        {job.title}
                      </h1>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center text-searchbar-text text-sm">
                          <Building className="mr-1 h-4 w-4" />
                          {job.firm}
                        </div>
                        <div className="flex items-center text-searchbar-text text-sm">
                          <MapPin className="mr-1 h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center text-searchbar-text text-sm">
                          <Clock className="mr-1 h-4 w-4" />
                          {job.jobtype}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="secondary" className="flex items-center">
                      <DollarSign className="mr-1 h-3 w-3" />
                      {job.remuneration_amount} / {job.remuneration_period}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Posted {job.posted}
                    </Badge>
                    {job.experience_level && (
                      <Badge variant="secondary" className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {job.experience_level}
                      </Badge>
                    )}
                    {job.employment_type && (
                      <Badge variant="outline" className="">
                        {job.employment_type}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 md:w-auto w-full">
                  <Button
                    size="lg"
                    onClick={handleApply}
                    className="bg-pill-text hover:bg-pill-text/90 text-white"
                  >
                    Apply Now
                  </Button>
                  {job.application_deadline && (
                    <p className="text-xs text-searchbar-text text-center">
                      Application deadline: {job.application_deadline}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="rounded-lg border bg-card shadow-sm">
                <CardHeader className="flex flex-col space-y-1.5 p-6">
                  <CardTitle className="text-2xl font-semibold">Job Description</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-6">
                    <p className="text-main-text">{job.description.introduction}</p>
                    
                    <div>
                      <h3 className="font-semibold text-main-text mb-3">Requirements</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {job.description.requirements.map((req, index) => (
                          <li key={index} className="text-main-text">{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-main-text mb-3">Responsibilities</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {job.description.responsibilities.map((res, index) => (
                          <li key={index} className="text-main-text">{res}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-main-text mb-3">Benefits</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {job.description.benefits.map((ben, index) => (
                          <li key={index} className="text-main-text">{ben}</li>
                        ))}
                      </ul>
                    </div>

                    {job.description.closingStatement && (
                      <p className="text-main-text">{job.description.closingStatement}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Skills Required */}
              {job.skills_required && job.skills_required.length > 0 && (
                <Card className="rounded-lg border bg-card shadow-sm">
                  <CardHeader className="flex flex-col space-y-1.5 p-6">
                    <CardTitle className="text-2xl font-semibold">Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {job.skills_required.map((skill, index) => (
                        <div
                          key={index}
                          className="bg-pill-bg text-pill-text px-[20px] py-[10px] rounded-full text-sm"
                        >
                          {skill}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Company Info */}
              <Card className="rounded-lg border bg-card shadow-sm">
                <CardHeader className="flex flex-col space-y-1.5 p-6">
                  <CardTitle className="text-xl font-semibold">About {job.firm}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-sm text-searchbar-text">
                    {job.company_description || `${job.firm} is a leading company in their industry, committed to innovation and excellence.`}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Apply */}
              <Card className="rounded-lg border bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="font-semibold text-main-text">Ready to Apply?</h3>
                    <p className="text-sm text-searchbar-text">
                      Join {job.firm} and take the next step in your career.
                    </p>
                    <Button
                      onClick={handleApply}
                      className="w-full bg-pill-text hover:bg-pill-text/90 text-white"
                    >
                      <Bookmark className="mr-2 h-4 w-4" />
                      Apply for This Position
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <NoResumeAlert />
      </main>

      {/* Job Application Modal */}
      {job && (
        <JobApplicationModal
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
          job={{
            id: job._id,
            title: job.title,
            firm: job.firm,
            location: job.location,
            jobtype: job.jobtype,
          }}
        />
      )}
    </div>
  );
};

export default JobDetailsPage;