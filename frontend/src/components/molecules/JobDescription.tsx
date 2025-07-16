import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface JobDescriptionProps {
  description: {
    introduction: string;
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
    closingStatement: string;
  };
}

export const JobDescription: React.FC<JobDescriptionProps> = ({ description }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle as="h2">Job Description</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className="text-gray-700">{description.introduction}</p>
          
          <div className="space-y-4">
            <section>
              <h3 className="font-semibold text-lg mb-2">Requirements</h3>
              <ul className="list-disc pl-5 space-y-1" role="list">
                {description.requirements.map((req, index) => (
                  <li key={index} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-1" role="list">
                {description.responsibilities.map((res, index) => (
                  <li key={index} className="text-gray-700">{res}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">Benefits</h3>
              <ul className="list-disc pl-5 space-y-1" role="list">
                {description.benefits.map((ben, index) => (
                  <li key={index} className="text-gray-700">{ben}</li>
                ))}
              </ul>
            </section>
          </div>

          <p className="text-gray-700 mt-4">{description.closingStatement}</p>
        </div>
      </CardContent>
    </Card>
  );
}; 