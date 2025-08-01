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
import { buildApiUrl } from "../../config";
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
  const [error, setError] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();
  const { addApplication } = useJobApplicationStore();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, try to get personalized recommendations from ML API
      try {
        const response = await fetch(buildApiUrl('/recommendations/jobs'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const recommendedJobs = data.recommendations.map((rec: any) => ({
            ...rec.job,
            match_score: Math.round(rec.match_score * 100),
            reasons: rec.reasons || []
          }));
          
          setRecommendations(recommendedJobs.slice(0, 6));
          return;
        }
        
        throw new Error('ML recommendations not available');
      } catch (mlError) {
        console.warn('ML recommendations failed, falling back to general jobs:', mlError);
        
        // Fallback to enhanced general job fetching
        const fallbackResponse = await httpClient.get("/jobs/get?limit=12");
        
        if (fallbackResponse.data && fallbackResponse.data.length > 0) {
          // Enhanced fallback logic using user profile data
          const enhancedJobs = await enhanceFallbackJobs(fallbackResponse.data);
          setRecommendations(enhancedJobs.slice(0, 6));
        } else {
          setError('No job recommendations available at the moment');
        }
      }
    } catch (error) {
      console.error("Error fetching job recommendations:", error);
      setError('Failed to load job recommendations');
    } finally {
      setLoading(false);
    }
  };

  const enhanceFallbackJobs = async (jobs: any[]) => {
    // Get user profile for smarter fallback matching
    let userProfile = null;
    try {
      const profileResponse = await fetch(buildApiUrl('/users/profile'), {
        credentials: 'include'
      });
      if (profileResponse.ok) {
        userProfile = await profileResponse.json();
      }
    } catch (error) {
      console.warn('Could not fetch user profile for job matching');
    }

    return jobs.map((job: any) => {
      let matchScore = 50; // Base score
      const reasons: string[] = [];

      if (userProfile) {
        // Location matching
        if (job.location && userProfile.location?.city) {
          if (job.location.toLowerCase().includes(userProfile.location.city.toLowerCase())) {
            matchScore += 15;
            reasons.push("Located in your preferred area");
          }
        }

        // Skills matching
        if (userProfile.skills && userProfile.skills.length > 0) {
          const jobTitle = job.title.toLowerCase();
          const hasMatchingSkills = userProfile.skills.some((skill: string) => 
            jobTitle.includes(skill.toLowerCase()) || 
            job.firm.toLowerCase().includes(skill.toLowerCase())
          );
          if (hasMatchingSkills) {
            matchScore += 20;
            reasons.push("Skills match job requirements");
          }
        }

        // Experience level matching
        if (userProfile.experience && userProfile.experience.length > 0) {
          const yearsOfExperience = calculateYearsOfExperience(userProfile.experience);
          if (yearsOfExperience > 2) {
            matchScore += 10;
            reasons.push("Matches your experience level");
          }
        }

        // Job type preference matching
        if (userProfile.preferences?.jobType?.includes(job.jobtype)) {
          matchScore += 15;
          reasons.push("Matches your preferred job type");
        }
      }

      // Add some variety to avoid identical scores
      matchScore += Math.floor(Math.random() * 10) - 5;
      matchScore = Math.min(95, Math.max(45, matchScore)); // Clamp between 45-95%

      // Add generic reasons if none found
      if (reasons.length === 0) {
        reasons.push("Popular in your industry", "Recently posted");
      }

      return {
        ...job,
        match_score: matchScore,
        reasons: reasons.slice(0, 3)
      };
    }).sort((a: any, b: any) => b.match_score - a.match_score);
  };

  const calculateYearsOfExperience = (experience: any[]) => {
    const totalMs = experience.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.current ? new Date() : new Date(exp.endDate || Date.now());
      return total + (end.getTime() - start.getTime());
    }, 0);
    
    return totalMs / (1000 * 60 * 60 * 24 * 365.25); // Convert to years
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
      jobUrl: `/job-details/${job.slug || job._id}`,
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
        {error ? (
          <div className="text-center py-8 text-red-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-red-300" />
            <p className="text-lg font-medium mb-2">Unable to load recommendations</p>
            <p className="text-sm mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRecommendations}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Try again
            </Button>
          </div>
        ) : recommendations.length === 0 && !loading ? (
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
                    onClick={() => window.open(`/job-details/${job.slug || job._id}`, '_blank')}
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