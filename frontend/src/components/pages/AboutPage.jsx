import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Users, BarChart, Globe, Heart } from "lucide-react";
import MainHeader from "../molecules/MainHeader";
import LandingCard from "../molecules/LandingCard";
import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();
  const handleButtonClick = () => {
    navigate("/main");
  };
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <MainHeader />

      <main className="flex-1 p-6 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-4xl mx-auto space-y-12">
          <section className="text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-gray-800">
              About <span className="text-blue-500">AusJobs</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Connecting Australian talent with opportunities. We're on a
              mission to revolutionize the job search experience.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LandingCard
              title={"Our Mission"}
              text={
                "At AusJobs, we strive to bridge the gap between talented individuals and innovative companies across Australia. Our AI-powered platform ensures precise job matches, fostering growth and success for both job seekers and employers."
              }
            ></LandingCard>
            <LandingCard
              title={"Our Vision"}
              text={
                "We envision a future where every Australian can easily find fulfilling work that aligns with their skills and passions. By leveraging cutting-edge technology, we aim to create a more efficient and equitable job market."
              }
            ></LandingCard>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Why Choose AusJobs?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "AI-Powered Matching",
                  icon: BarChart,
                  description:
                    "Our advanced algorithms ensure the best fit between candidates and job openings.",
                },
                {
                  title: "Nationwide Coverage",
                  icon: Globe,
                  description:
                    "Access opportunities from all corners of Australia, from bustling cities to regional areas.",
                },
                {
                  title: "User-Centric Approach",
                  icon: Heart,
                  description:
                    "We prioritize user experience, making job searching and hiring processes smooth and intuitive.",
                },
                {
                  title: "Community Support",
                  icon: Users,
                  description:
                    "Join a thriving community of professionals, with networking events and career resources.",
                },
              ].map((item, index) => (
                <LandingCard
                  key={index}
                  title={item.title}
                  text={item.description}
                  icon={item.icon}
                ></LandingCard>
              ))}
            </div>
          </section>

          <section className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Join Us in Shaping Australia's Job Market
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Whether you're a job seeker or an employer, we're here to help you
              succeed.
            </p>
            <Button
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleButtonClick}
            >
              Get Started
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
