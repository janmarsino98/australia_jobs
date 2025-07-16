import React from 'react';
import MainHeader from '../components/molecules/MainHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const EmployersPage = () => {
  const advantages = [
    {
      title: "Access Wide Talent Pool",
      description: "Connect with thousands of qualified job seekers across Australia",
      icon: "👥",
      features: ["Diverse skill sets", "All experience levels", "Australia-wide reach"]
    },
    {
      title: "Easy Job Posting",
      description: "Post jobs in minutes with our streamlined posting system",
      icon: "📝",
      features: ["Quick setup", "Multiple job types", "Instant visibility"]
    },
    {
      title: "Smart Candidate Matching",
      description: "Our platform helps you find the right candidates for your roles",
      icon: "🎯",
      features: ["Skill matching", "Location filtering", "Experience sorting"]
    },
    {
      title: "Cost-Effective Hiring",
      description: "Reduce recruitment costs with our affordable pricing plans",
      icon: "💰",
      features: ["Competitive pricing", "No hidden fees", "Value packages"]
    },
    {
      title: "Time-Saving Tools",
      description: "Streamline your hiring process with automated features",
      icon: "⏰",
      features: ["Resume screening", "Application tracking", "Communication tools"]
    },
    {
      title: "Quality Candidates",
      description: "Access pre-screened candidates with verified profiles",
      icon: "⭐",
      features: ["Verified profiles", "Skill assessments", "Reference checks"]
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Job Seekers" },
    { number: "500+", label: "Companies Trust Us" },
    { number: "95%", label: "Successful Placements" },
    { number: "24hrs", label: "Average Response Time" }
  ];

  return (
    <div className="min-h-screen bg-main-white-bg">
      <MainHeader />
      
      {/* Hero Section */}
      <section className="px-6 py-4 bg-gradient-to-r from-main-text to-searchbar-text text-white">
        <div className="max-w-6xl mx-auto text-center py-[60px]">
          <h1 className="text-4xl font-bold mb-6">
            Find Your Next Great Hire
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of employers who trust AusJobs to connect them with Australia's top talent. 
            Post jobs, find candidates, and build your dream team.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-white text-main-text hover:bg-gray-100">
              Post a Job Now
            </Button>
            <Button size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-main-text">
              View Pricing Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-[60px]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col space-y-2">
                <div className="text-3xl font-bold text-pill-text">{stat.number}</div>
                <div className="text-searchbar-text font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="px-6 py-[60px] bg-dark-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-[60px]">
            <h2 className="text-3xl font-bold text-main-text mb-4">
              Why Choose AusJobs for Your Hiring Needs?
            </h2>
            <p className="text-searchbar-text text-lg max-w-3xl mx-auto">
              Discover the advantages that make AusJobs the preferred choice for employers across Australia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((advantage, index) => (
              <Card key={index} className="rounded-lg border bg-card shadow-sm hover:shadow-lg transition-all">
                <CardHeader className="flex flex-col space-y-1.5 p-6">
                  <div className="text-4xl mb-2">{advantage.icon}</div>
                  <CardTitle className="text-xl font-semibold text-main-text">
                    {advantage.title}
                  </CardTitle>
                  <CardDescription className="text-searchbar-text">
                    {advantage.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {advantage.features.map((feature, featureIndex) => (
                      <Badge key={featureIndex} variant="secondary" className="bg-pill-bg text-pill-text">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section className="px-6 py-[60px]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-main-text mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-searchbar-text text-lg mb-8">
            Choose from our flexible pricing plans designed to suit businesses of all sizes
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-lg border bg-card shadow-sm">
              <CardHeader className="text-center p-6">
                <CardTitle className="text-xl font-semibold">Starter</CardTitle>
                <div className="text-3xl font-bold text-pill-text">$99</div>
                <CardDescription>Per job posting</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ul className="space-y-2 text-sm text-searchbar-text">
                  <li>• 30-day job visibility</li>
                  <li>• Basic candidate filtering</li>
                  <li>• Email support</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card shadow-lg relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pill-text text-white">
                Most Popular
              </Badge>
              <CardHeader className="text-center p-6">
                <CardTitle className="text-xl font-semibold">Professional</CardTitle>
                <div className="text-3xl font-bold text-pill-text">$199</div>
                <CardDescription>Per job posting</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ul className="space-y-2 text-sm text-searchbar-text">
                  <li>• 60-day job visibility</li>
                  <li>• Advanced filtering & matching</li>
                  <li>• Priority support</li>
                  <li>• Featured job listing</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card shadow-sm">
              <CardHeader className="text-center p-6">
                <CardTitle className="text-xl font-semibold">Enterprise</CardTitle>
                <div className="text-3xl font-bold text-pill-text">Custom</div>
                <CardDescription>Contact us</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ul className="space-y-2 text-sm text-searchbar-text">
                  <li>• Unlimited job postings</li>
                  <li>• Dedicated account manager</li>
                  <li>• Custom integrations</li>
                  <li>• Analytics & reporting</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" className="bg-pill-text hover:bg-pill-text/90">
            View Full Pricing Details
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-[60px] bg-pill-bg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-main-text mb-4">
            Ready to Find Your Next Great Hire?
          </h2>
          <p className="text-searchbar-text text-lg mb-8">
            Join thousands of successful employers who have found their perfect candidates through AusJobs
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-pill-text hover:bg-pill-text/90">
              Post Your First Job
            </Button>
            <Button variant="outline" size="lg">
              Contact Sales Team
            </Button>
          </div>
        </div>
              </section>

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
};

export default EmployersPage; 