import React from 'react';
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Building, MapPin, Briefcase, DollarSign, Calendar } from "lucide-react";

interface JobHeaderProps {
  title: string;
  firm: string;
  location: string;
  jobType: string;
  salary: {
    amount: string;
    period: string;
  };
  postedDate: string;
  onApply: () => void;
}

export const JobHeader: React.FC<JobHeaderProps> = ({
  title,
  firm,
  location,
  jobType,
  salary,
  postedDate,
  onApply,
}) => {
  return (
    <section>
      <h1 className="text-4xl font-bold tracking-tighter text-gray-800 mb-4">
        {title}
      </h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <Badge variant="secondary" className="flex items-center">
          <Building className="mr-1 h-4 w-4" />
          {firm}
        </Badge>
        <Badge variant="secondary" className="flex items-center">
          <MapPin className="mr-1 h-4 w-4" />
          {location}
        </Badge>
        <Badge variant="secondary" className="flex items-center">
          <Briefcase className="mr-1 h-4 w-4" />
          {jobType}
        </Badge>
        <Badge variant="secondary" className="flex items-center">
          <DollarSign className="mr-1 h-4 w-4" />
          {`${salary.amount} / ${salary.period}`}
        </Badge>
        <Badge variant="secondary" className="flex items-center">
          <Calendar className="mr-1 h-4 w-4" />
          Posted {postedDate}
        </Badge>
      </div>
      <Button
        size="lg"
        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white"
        onClick={onApply}
      >
        Apply Now
      </Button>
    </section>
  );
}; 