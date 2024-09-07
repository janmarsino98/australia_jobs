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
} from "lucide-react";
import MainHeader from "../molecules/MainHeader";

export default function JobDetailsPage() {
  // This would typically come from a database or API
  const job = {
    title: "Senior Software Engineer",
    company: "TechCorp Australia",
    location: "Sydney, NSW",
    type: "Full-time",
    salary: "$120,000 - $150,000",
    posted: "2 weeks ago",
    description:
      "We are seeking a talented and experienced Senior Software Engineer to join our innovative team...",
    responsibilities: [
      "Design and implement scalable software solutions",
      "Collaborate with cross-functional teams to define and develop new features",
      "Mentor junior developers and conduct code reviews",
      "Optimize application performance and improve code quality",
    ],
    requirements: [
      "5+ years of experience in software development",
      "Strong proficiency in JavaScript, TypeScript, and React",
      "Experience with cloud platforms (AWS, Azure, or GCP)",
      "Excellent problem-solving and communication skills",
    ],
    benefits: [
      "Competitive salary and equity options",
      "Flexible working hours and remote work options",
      "Professional development opportunities",
      "Health and wellness programs",
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <MainHeader />

      <main className="flex-1 p-6 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-4xl mx-auto space-y-8">
          <section>
            <h1 className="text-4xl font-bold tracking-tighter text-gray-800 mb-4">
              {job.title}
            </h1>
            <div className="flex flex-wrap gap-4 mb-6">
              <Badge variant="secondary" className="flex items-center">
                <Building className="mr-1 h-4 w-4" />
                {job.company}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <MapPin className="mr-1 h-4 w-4" />
                {job.location}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <Briefcase className="mr-1 h-4 w-4" />
                {job.type}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <DollarSign className="mr-1 h-4 w-4" />
                {job.salary}
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
              <p className="text-gray-600">{job.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {job.responsibilities.map((responsibility, index) => (
                  <li key={index} className="text-gray-600">
                    {responsibility}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="text-gray-600">
                    {requirement}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {job.benefits.map((benefit, index) => (
                  <li key={index} className="text-gray-600">
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <section className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Ready to Take the Next Step?
            </h2>
            <p className="text-gray-600 mb-6">
              Join TechCorp Australia and be part of an innovative team shaping
              the future of technology.
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
