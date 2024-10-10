import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MainHeader from "@/components/molecules/MainHeader";
import { useNavigate } from "react-router-dom";

const packages = [
  {
    name: "Basic",
    price: 99,
    features: [
      "30-minute career consultation",
      "Resume review",
      "LinkedIn profile optimization tips",
    ],
  },
  {
    name: "Standard",
    price: 199,
    features: [
      "60-minute career consultation",
      "Resume review and rewrite",
      "LinkedIn profile optimization",
      "Job search strategy session",
    ],
  },
];

const PricingInformationPage = () => {
  const navigate = useNavigate();

  const handleSelectPackage = (pkg) => {
    navigate("/paying", { state: { selectedPackage: pkg } });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <MainHeader />

      <main className="flex-1 p-6 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-4xl mx-auto space-y-8">
          <section className="text-center">
            <h1 className="text-4xl font-bold tracking-tighter text-gray-800 mb-4">
              Career Advice Services
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Get expert guidance to boost your career and achieve your
              professional goals
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            {packages.map((pkg, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">
                    {pkg.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 min-h-[150px]">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>{feature}</li>
                    ))}
                  </ul>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-800">
                      ${pkg.price}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleSelectPackage(pkg)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Select
                  </Button>
                </CardContent>
              </Card>
            ))}
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
};
export default PricingInformationPage;
