import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Sparkles, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock, 
  ExternalLink,
  Bookmark,
  Heart
} from "lucide-react";
import httpClient from "../../httpClient";
import useAuthStore from "../../stores/useAuthStore";
import useJobApplicationStore from "../../stores/useJobApplicationStore";

interface RecommendedJob {
  _id: string;
  title: string;
  firm: string;
  location: string;
  jobtype: string;
  remuneration_amount: string;
  remuneration_period: string;
  posted: string;
  match_score?: number;
  reasons?: string[];
}

interface JobRecommendationsProps {
  className?: string;
}

export const JobRecommendations: React.FC<JobRecommendationsProps> = ({ 
  className = "" 
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();
  const { addApplication } = useJobApplicationStore();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      // Mock recommendation logic based on user profile
      const response = await httpClient.get("http://localhost:5000/jobs/get?limit=6");
      
      // Add mock match scores and reasons for demonstration
      const jobsWithScores = response.data.map((job: any, index: number) => ({
        ...job,
        match_score: Math.floor(Math.random() * 30) + 70, // 70-100% match
        reasons: [
          "Matches your experience level",
          "Located in your preferred area", 
          "Salary aligns with expectations",
          "Skills match job requirements"
        ].slice(0, Math.floor(Math.random() * 3) + 2)
      }));

      setRecommendations(jobsWithScores.slice(0, 6));
    } catch (error) {
      console.error("Error fetching job recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (amount: string, period: string) => {
    return `$${amount}/${period}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleSaveJob = (jobId: string) => {
    const newSavedJobs = new Set(savedJobs);
    if (savedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
    } else {
      newSavedJobs.add(jobId);
    }
    setSavedJobs(newSavedJobs);
    // TODO: Integrate with saved jobs store when available
  };

  const handleQuickApply = (job: RecommendedJob) => {
    addApplication({
      jobTitle: job.title,
      company: job.firm,
      location: job.location,
      jobUrl: `/job/${job._id}`,
      status: 'applied',
      salary: {
        min: parseInt(job.remuneration_amount) * 0.9,
        max: parseInt(job.remuneration_amount) * 1.1,
        currency: 'AUD'
      }
    });
    // Show success toast or notification
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
            Personalized Recommendations
          </div>
          <Button variant="outline" size="sm" onClick={fetchRecommendations}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No recommendations available</p>
            <p className="text-sm">Complete your profile to get personalized job suggestions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((job) => (
              <div 
                key={job._id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate text-sm">
                      {job.title}
                    </h4>
                    <p className="text-sm text-gray-600">{job.firm}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Badge variant="secondary" className="text-xs">
                      {job.match_score}% match
                    </Badge>
                    <button
                      onClick={() => handleSaveJob(job._id)}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        savedJobs.has(job._id) ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="w-3 h-3 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {job.jobtype}
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {formatSalary(job.remuneration_amount, job.remuneration_period)}
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(job.posted)}
                  </div>
                </div>

                {job.reasons && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Why this matches:</p>
                    <ul className="text-xs text-gray-600">
                      {job.reasons.slice(0, 2).map((reason, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => handleQuickApply(job)}
                  >
                    Quick Apply
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open(`/job/${job._id}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {recommendations.length > 0 && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => window.open('/jobs', '_blank')}>
              View All Jobs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobRecommendations; 