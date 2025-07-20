import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const packages = [
  {
    name: "Starter",
    price: 99,
    period: "Per consultation",
    description: "Perfect for those just starting their career journey",
    features: [
      "30-minute career consultation",
      "Basic resume review",
      "LinkedIn profile tips",
      "Job search guidance",
      "Email support"
    ],
    highlight: false
  },
  {
    name: "Professional",
    price: 199,
    period: "Per consultation",
    description: "Comprehensive career development package",
    features: [
      "60-minute career consultation",
      "In-depth resume review & rewrite",
      "LinkedIn profile optimization",
      "Personalized job search strategy",
      "Interview preparation",
      "Priority email support",
      "2 follow-up sessions"
    ],
    highlight: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "Contact us",
    description: "Tailored solutions for organizations",
    features: [
      "Multiple consultation sessions",
      "Team resume reviews",
      "Corporate LinkedIn training",
      "Bulk hiring strategies",
      "Dedicated career advisor",
      "Custom reporting",
      "Ongoing support"
    ],
    highlight: false
  }
];

const stats = [
  { number: "1,000+", label: "Career Consultations" },
  { number: "92%", label: "Success Rate" },
  { number: "45 Days", label: "Average Job Search" },
  { number: "4.9/5", label: "Client Satisfaction" }
];

const PricingInformationPage = () => {
  const navigate = useNavigate();

  const handleSelectPackage = (pkg) => {
    navigate("/paying", { state: { selectedPackage: pkg } });
  };

  return (
    <div className="min-h-screen bg-main-white-bg">
      
      {/* Hero Section */}
      <section className="px-6 py-4 bg-gradient-to-r from-main-text to-searchbar-text text-white">
        <div className="max-w-6xl mx-auto text-center py-[60px]">
          <h1 className="text-4xl font-bold mb-6">
            Invest in Your Career Success
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Choose the perfect career consultation package to help you achieve your professional goals. 
            Expert guidance tailored to your needs.
          </p>
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

      {/* Pricing Section */}
      <section className="px-6 py-[60px] bg-dark-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-[60px]">
            <h2 className="text-3xl font-bold text-main-text mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-searchbar-text text-lg max-w-3xl mx-auto">
              Choose from our flexible consultation packages designed to suit your career stage and goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <Card key={index} className={`rounded-lg border bg-card ${pkg.highlight ? 'shadow-lg relative' : 'shadow-sm'} hover:shadow-lg transition-all h-full flex flex-col`}>
                {pkg.highlight && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pill-text text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="flex flex-col space-y-1.5 p-6">
                  <CardTitle className="text-xl font-semibold text-main-text">
                    {pkg.name}
                  </CardTitle>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-pill-text">
                      {typeof pkg.price === 'number' ? `$${pkg.price}` : pkg.price}
                    </span>
                    <span className="text-sm text-searchbar-text mb-1">
                      {pkg.period}
                    </span>
                  </div>
                  <CardDescription className="text-searchbar-text">
                    {pkg.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex flex-col flex-grow">
                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-searchbar-text">
                        <span className="mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <Button 
                      onClick={() => handleSelectPackage(pkg)}
                      size="lg"
                      className={`w-full ${pkg.highlight ? 'bg-pill-text hover:bg-pill-text/90' : 'bg-main-text hover:bg-main-text/90'}`}
                    >
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-[60px] bg-pill-bg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-main-text mb-4">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-searchbar-text text-lg mb-8">
            Join thousands of successful professionals who have transformed their careers with our expert guidance
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-pill-text hover:bg-pill-text/90">
              Schedule a Consultation
            </Button>
            <Button size="lg" variant="outline">
              Contact Our Team
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

export default PricingInformationPage;
