import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Search,
  FileText,
  BookOpen,
  BriefcaseBusiness,
  TrendingUp,
} from "lucide-react";
import LandingCard from "../molecules/LandingCard";
import { IoGitMerge } from "react-icons/io5";
import logo from "../../imgs/logo.png";
import ana from "../../imgs/anna.jpg";
import jhon from "../../imgs/jhon.jpg";
import MainHeader from "../molecules/MainHeader";
import NoResumeAlert from "../molecules/NoResumeAlert";

export default function JobSeekersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <MainHeader />

      <main className="flex-1 p-6 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-6xl mx-auto space-y-12">
          <section className="text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-gray-800">
              Find Your Next{" "}
              <span className="text-blue-500">Career Opportunity</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Discover thousands of job opportunities across Australia. Let's
              find the perfect match for your skills and aspirations.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Land Your Next Job",
                icon: BriefcaseBusiness,
                description:
                  "Explore tailored job opportunities and take the next step in your career.",
                href: "/jobspage",
              },
              {
                title: "Review your resume",
                icon: FileText,
                description:
                  "Build a professional resume that stands out to employers.",
                href: "/resume",
              },
              {
                title: "Career Resources",
                icon: BookOpen,
                description:
                  "Access guides, tips, and tools to advance your career.",
                href: "/resources",
              },
            ].map((item, index) => (
              <LandingCard
                key={index}
                title={item.title}
                text={item.description}
                href={item.href}
                icon={item.icon}
              />
              //   <Card key={index} className="hover:shadow-lg transition-shadow">
              //     <CardHeader>
              //       <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              //         <item.icon className="mr-2 h-6 w-6 text-blue-500" />
              //         {item.title}
              //       </CardTitle>
              //     </CardHeader>
              //     <CardContent>
              //       <p className="text-gray-600">{item.description}</p>
              //       <Button
              //         variant="link"
              //         className="mt-4 text-blue-500 hover:text-blue-600 p-0"
              //       >
              //         Learn More →
              //       </Button>
              //     </CardContent>
              //   </Card>
            ))}
          </section>

          <section className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Job Seeker Success Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  name: "Emily R.",
                  job: "Warehouse Assistant",
                  company: "FastMove Logistics",
                  description:
                    "Thanks to AusJobs, I landed my first job in Australia without any prior experience. The AI-powered resume optimization really made a difference, and I got hired in no time!",
                  img: ana,
                },
                {
                  name: "John D.",
                  job: "Customer Service Representative",
                  company: "Retail Hub",
                  description:
                    "As someone new to the workforce, AusJobs was a game-changer. The platform helped me create a great resume, and I quickly found a job in customer service with no prior experience required.",
                  img: jhon,
                },
              ].map((story, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 object-cover overflow-hidden">
                    <img src={story.img} alt="" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {story.name}
                    </h3>
                    <p className="text-gray-600">
                      {story.job} at {story.company}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      {story.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
