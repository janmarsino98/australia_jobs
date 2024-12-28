import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MainHeader from "@/components/molecules/MainHeader";
import { useNavigate } from "react-router-dom";

const packages = [
  {
    name: "Free",
    price: 0,
    features: [
      "Instant AI feedback on your CV",
      "Actionable suggestions",
      "Essential CV writing resources",
    ],
  },
  {
    name: "Basic",
    price: 50,
    features: [
      "All Free Features Included",
      "Resume analysis by a specialist",
      "Australian Market Tailoring",
      "Optimized layout and content",
      "Up to 2 Revisions",
    ],
  },
  {
    name: "Professional",
    price: 80,
    features: [
      "All Basic Features",
      "Customized Cover Letter",
      "Resume and cover letter aligned with your target role",
      "Unlimited Revisions",
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

          <section className="grid gap-6 md:grid-cols-3 items-stretch">
            {packages.map((pkg, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">
                    {pkg.name}
                  </CardTitle>
                </CardHeader>

                {/* 
        Use flex in CardContent with flex-col and justify-between 
        so the content is “pushed” apart (features at top, price & button at bottom).
      */}
                <CardContent className="flex flex-col justify-between flex-1 space-y-6">
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>{feature}</li>
                    ))}
                  </ul>

                  {/* 
          Wrap price and button in a container at the bottom 
          so they align across all cards.
        */}
                  <div className="mt-4 text-center">
                    <span className="block text-3xl font-bold text-gray-800 mb-4">
                      ${pkg.price}
                    </span>
                    <Button
                      onClick={() => handleSelectPackage(pkg)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Select
                    </Button>
                  </div>
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
