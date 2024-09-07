import LandingCard from "../molecules/LandingCard";
import MainHeader from "../molecules/MainHeader";

export default function Component() {
  let landingCards = [
    {
      title: "Job Seekers",
      text: "Discover how AusJobs can help you.",
      href: "/jobseekers",
    },
    {
      title: "Employers",
      text: "Discover how AusJobs can help you.",
      href: "/employers",
    },
    {
      title: "Career Advice",
      text: "Discover how AusJobs can help you.",
      href: "/advice",
    },
  ];
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <MainHeader />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-white to-gray-100">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-gray-800">
          Start your career in <span className="text-blue-500">Australia</span>
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-[700px]">
          No experience? No problem. AusJobs helps you find entry-level jobs and
          uses AI to perfect your resume for the Australian market.
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
          {landingCards.map((item, index) => (
            <LandingCard
              key={index}
              text={item.text}
              title={item.title}
              href={item.href}
            />
          ))}
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
