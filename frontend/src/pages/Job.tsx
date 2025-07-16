import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import MainHeader from "../components/molecules/MainHeader";
import httpClient from "../httpClient";
import NoResumeAlert from "../components/molecules/NoResumeAlert";
import { JobHeader } from "../components/molecules/JobHeader";
import { JobDescription } from "../components/molecules/JobDescription";

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
}

const JobDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const navigate = useNavigate();

  const fetchJob = async () => {
    try {
      const resp = await httpClient.get<JobData>(`http://localhost:5000/jobs/${slug}`);
      setJob(resp.data);
    } catch (error) {
      console.error("Error while trying to fetch job: ", error);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [slug]);

  const handleBackClick = () => {
    navigate("/jobspage");
  };

  const handleApply = () => {
    // TODO: Implement job application logic
    console.log("Applying for job:", job?.title);
  };

  if (!job) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <MainHeader />
        <main className="flex-1 p-6 bg-gradient-to-b from-white to-gray-100">
          <div className="max-w-4xl mx-auto">
            Loading...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <MainHeader />

      <main className="flex-1 p-6 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-4xl mx-auto space-y-8">
          <Button
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
          </Button>

          <JobHeader
            title={job.title}
            firm={job.firm}
            location={job.location}
            jobType={job.jobtype}
            salary={{
              amount: job.remuneration_amount,
              period: job.remuneration_period,
            }}
            postedDate={job.posted}
            onApply={handleApply}
          />

          <JobDescription description={job.description} />

          <section className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Ready to Take the Next Step?
            </h2>
            <p className="text-gray-600 mb-6">
              Join {job.firm} and be part of an innovative team shaping the
              future of technology.
            </p>
            <Button
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleApply}
            >
              Apply for This Position
            </Button>
          </section>
        </div>
        <NoResumeAlert />
      </main>
    </div>
  );
};

export default JobDetailsPage;
