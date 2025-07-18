import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  Clock, 
  Briefcase, 
  Search, 
  User, 
  Bell, 
  CheckCircle,
  FileText,
  Heart,
  Eye,
  Send
} from "lucide-react";
import useJobApplicationStore from "../../stores/useJobApplicationStore";
import useSearchHistoryStore from "../../stores/useSearchHistoryStore";
import useSavedSearchesStore from "../../stores/useSavedSearchesStore";

interface ActivityItem {
  id: string;
  type: 'application' | 'search' | 'profile' | 'saved_search' | 'job_view' | 'resume';
  title: string;
  description: string;
  timestamp: number;
  icon: React.ComponentType<any>;
  color: string;
  actionUrl?: string;
}

interface ActivityTimelineProps {
  className?: string;
  limit?: number;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  className = "",
  limit = 10
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const { getRecentApplications } = useJobApplicationStore();
  const { getRecentSearches } = useSearchHistoryStore();
  const { getSavedSearches } = useSavedSearchesStore();

  useEffect(() => {
    generateActivityTimeline();
  }, []);

  const generateActivityTimeline = () => {
    const allActivities: ActivityItem[] = [];

    // Get recent applications
    const recentApplications = getRecentApplications(5);
    recentApplications.forEach(app => {
      allActivities.push({
        id: `app-${app.id}`,
        type: 'application',
        title: 'Applied to job',
        description: `${app.jobTitle} at ${app.company}`,
        timestamp: app.appliedDate,
        icon: Briefcase,
        color: 'text-blue-600',
        actionUrl: app.jobUrl
      });

      // Add status updates for applications
      if (app.lastUpdated !== app.appliedDate) {
        allActivities.push({
          id: `status-${app.id}`,
          type: 'application',
          title: 'Application status updated',
          description: `${app.jobTitle} - Status changed to ${app.status}`,
          timestamp: app.lastUpdated,
          icon: CheckCircle,
          color: getStatusColor(app.status),
          actionUrl: app.jobUrl
        });
      }
    });

    // Get recent searches
    const recentSearches = getRecentSearches(5);
    recentSearches.forEach(search => {
      allActivities.push({
        id: `search-${search.id}`,
        type: 'search',
        title: 'Searched for jobs',
        description: `"${search.query}"${search.location ? ` in ${search.location}` : ''}${search.resultsCount ? ` - ${search.resultsCount} results` : ''}`,
        timestamp: search.timestamp,
        icon: Search,
        color: 'text-purple-600'
      });
    });

    // Get saved searches
    const savedSearches = getSavedSearches();
    savedSearches.slice(0, 3).forEach(search => {
      allActivities.push({
        id: `saved-${search.id}`,
        type: 'saved_search',
        title: 'Saved search created',
        description: `"${search.name}" - ${search.filters.title || 'All jobs'}${search.filters.location ? ` in ${search.filters.location}` : ''}`,
        timestamp: search.createdAt,
        icon: Heart,
        color: 'text-red-600'
      });
    });

    // Add some mock activities for demonstration
    const now = Date.now();
    const mockActivities: ActivityItem[] = [
      {
        id: 'profile-update',
        type: 'profile',
        title: 'Profile updated',
        description: 'Added new skills and experience',
        timestamp: now - (2 * 24 * 60 * 60 * 1000), // 2 days ago
        icon: User,
        color: 'text-green-600'
      },
      {
        id: 'resume-upload',
        type: 'resume',
        title: 'Resume uploaded',
        description: 'New resume file uploaded and analyzed',
        timestamp: now - (3 * 24 * 60 * 60 * 1000), // 3 days ago
        icon: FileText,
        color: 'text-orange-600'
      },
      {
        id: 'job-view',
        type: 'job_view',
        title: 'Viewed job posting',
        description: 'Senior Developer at TechCorp',
        timestamp: now - (1 * 24 * 60 * 60 * 1000), // 1 day ago
        icon: Eye,
        color: 'text-gray-600'
      }
    ];

    allActivities.push(...mockActivities);

    // Sort by timestamp (most recent first) and limit
    const sortedActivities = allActivities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    setActivities(sortedActivities);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      applied: 'text-blue-600',
      reviewing: 'text-yellow-600',
      interview: 'text-purple-600',
      offer: 'text-green-600',
      rejected: 'text-red-600',
      withdrawn: 'text-gray-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      application: 'Application',
      search: 'Search',
      profile: 'Profile',
      saved_search: 'Saved',
      job_view: 'Viewed',
      resume: 'Resume'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No recent activity</p>
            <p className="text-sm">Start exploring jobs to see your activity here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getActivityTypeLabel(activity.type)}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  
                  {activity.actionUrl && (
                    <button 
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      onClick={() => window.open(activity.actionUrl, '_blank')}
                    >
                      View details →
                    </button>
                  )}
                </div>
                
                {index < activities.length - 1 && (
                  <div className="absolute left-4 mt-8 w-px h-4 bg-gray-200" 
                       style={{ transform: 'translateX(-50%)' }} />
                )}
              </div>
            ))}
          </div>
        )}
        
        {activities.length >= limit && (
          <div className="text-center mt-6">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View all activity
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline; 