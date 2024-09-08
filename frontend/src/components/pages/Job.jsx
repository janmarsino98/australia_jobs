import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  Building,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainHeader from "../molecules/MainHeader";
import httpClient from "../../httpClient";
import ReactMarkdown from "react-markdown";
import Markdown from "react-markdown";

export default function JobDetailsPage() {
  const { slug } = useParams();
  const [job, setJob] = useState(null);
  const navigate = useNavigate();

  const fetchJob = async () => {
    try {
      const resp = await httpClient.get(`http://localhost:5000/jobs/${slug}`);
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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <MainHeader />

      {job && (
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
            <section>
              <h1 className="text-4xl font-bold tracking-tighter text-gray-800 mb-4">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-4 mb-6">
                <Badge variant="secondary" className="flex items-center">
                  <Building className="mr-1 h-4 w-4" />
                  {job.firm}
                </Badge>
                <Badge variant="secondary" className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  {job.location}
                </Badge>
                <Badge variant="secondary" className="flex items-center">
                  <Briefcase className="mr-1 h-4 w-4" />
                  {job.jobtype}
                </Badge>
                <Badge variant="secondary" className="flex items-center">
                  <DollarSign className="mr-1 h-4 w-4" />
                  {job.remuneration_amount + " / " + job.remuneration_period}
                </Badge>
                <Badge variant="secondary" className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  Posted {job.posted}
                </Badge>
              </div>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white"
              >
                Apply Now
              </Button>
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                {job && (
                  <div className="flex flex-col gap-3">
                    <p>{job.description.introduction}</p>
                    <h3>Requirements:</h3>

                    <ul className="list-disc pl-5">
                      {job.description.requirements.map((req, req_idx) => (
                        <li key={req_idx}>{req}</li>
                      ))}
                    </ul>

                    <h3>Responsibilities:</h3>
                    <ul className="list-disc pl-5">
                      {job.description.responsibilities.map((res, res_idx) => (
                        <li key={res_idx}>{res}</li>
                      ))}
                    </ul>

                    <h3>Benefits:</h3>

                    <ul className="list-disc pl-5">
                      {job.description.benefits.map((ben, ben_idx) => (
                        <li key={ben_idx}>{ben}</li>
                      ))}
                    </ul>
                    <p>{job.description.closingStatement}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <section className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Ready to Take the Next Step?
              </h2>
              <p className="text-gray-600 mb-6">
                Join KickStart and be part of an innovative team shaping the
                future of technology.
              </p>
              <Button
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Apply for This Position
              </Button>
            </section>
          </div>
        </main>
      )}

      <footer className="bg-gray-800 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm mb-4 sm:mb-0">
            © 2024 KickStart. All rights reserved.
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
