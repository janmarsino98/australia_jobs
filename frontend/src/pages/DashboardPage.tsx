import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Bell,
  Briefcase,
  Clock,
  Settings,
  Star,
  TrendingUp,
  User,
  Calendar,
  Search,
  Upload,
  Eye,
  Layout,
  BarChart3,
  Target,
  Sparkles
} from "lucide-react";
import ProfileCompleteness from "../components/molecules/ProfileCompleteness";
import JobApplicationTracker from "../components/molecules/JobApplicationTracker";
import JobApplicationKanban from "../components/molecules/JobApplicationKanban";
import SavedSearches from "../components/molecules/SavedSearches";
import JobRecommendations from "../components/molecules/JobRecommendations";
import ActivityTimeline from "../components/molecules/ActivityTimeline";
import NotificationCenter from "../components/molecules/NotificationCenter";
import useAuthStore from "../stores/useAuthStore";
import useJobApplicationStore from "../stores/useJobApplicationStore";
import useSavedSearchesStore from "../stores/useSavedSearchesStore";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'overview' | 'kanban'>('overview');
  const { user } = useAuthStore();
  const { getApplicationStats, getRecentApplications } = useJobApplicationStore();
  const { getSavedSearches } = useSavedSearchesStore();

  if (!user) {
    navigate('/login');
    return null;
  }

  const stats = getApplicationStats();
  const recentApplications = getRecentApplications(5);
  const savedSearches = getSavedSearches();

  const quickActions = [
    { 
      label: 'Search Jobs', 
      icon: Search, 
      href: '/jobs',
      description: 'Find new opportunities',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    { 
      label: 'Upload Resume', 
      icon: Upload, 
      href: '/resume',
      description: 'Update your profile',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    { 
      label: 'View Applications', 
      icon: Briefcase, 
      href: '/applications',
      description: 'Track your progress',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    { 
      label: 'Saved Jobs', 
      icon: Star, 
      href: '/saved',
      description: 'Your bookmarked jobs',
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
    },
    { 
      label: 'Profile Settings', 
      icon: User, 
      href: '/settings',
      description: 'Manage your account',
      color: 'bg-gray-50 hover:bg-gray-100 border-gray-200'
    },
  ];

  const dashboardStats = [
    {
      title: 'Total Applications',
      value: stats.total,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+3 this week'
    },
    {
      title: 'Interview Rate',
      value: `${Math.round(((stats.interview + stats.offer) / Math.max(stats.total, 1)) * 100)}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+5% improvement'
    },
    {
      title: 'Active Searches',
      value: savedSearches.length,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 'Last updated today'
    },
    {
      title: 'Profile Score',
      value: '85%',
      icon: User,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: 'Complete for 100%'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
            <p className="text-gray-600">Here's what's happening with your job search</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant={view === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('overview')}
              className="flex items-center space-x-2"
            >
              <Layout className="w-4 h-4" />
              <span>Overview</span>
            </Button>
            <Button
              variant={view === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('kanban')}
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Kanban</span>
            </Button>
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.href)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${action.color}`}
                >
                  <action.icon className="w-6 h-6 mb-3 text-gray-700" />
                  <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {view === 'overview' ? (
          <>
            {/* Top Row - Job Recommendations */}
            <div className="mb-8">
              <JobRecommendations />
            </div>

            {/* Middle Row - Applications and Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <JobApplicationTracker
                  onAddApplication={() => navigate('/jobs')}
                />
              </div>
              <div className="space-y-6">
                <ProfileCompleteness
                  user={{...user, role: user.role || 'jobseeker'}}
                  onActionClick={(action) => navigate(`/profile/${action}`)}
                />
                <NotificationCenter compact={true} />
              </div>
            </div>

            {/* Bottom Row - Saved Searches and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SavedSearches
                onSearchLoad={(filters) => {
                  // Store filters and navigate to jobs page
                  navigate('/jobs');
                }}
              />
              <ActivityTimeline limit={8} />
            </div>
          </>
        ) : (
          <>
            {/* Kanban View */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Application Pipeline</h2>
                  <p className="text-gray-600">Drag and drop to update application status</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>{stats.total} Total Applications</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{Math.round(((stats.offer + stats.interview) / Math.max(stats.total, 1)) * 100)}% Success Rate</span>
                  </Badge>
                </div>
              </div>
              <JobApplicationKanban
                onAddApplication={() => navigate('/jobs')}
              />
            </div>

            {/* Secondary content for Kanban view */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <JobRecommendations />
                <SavedSearches
                  onSearchLoad={(filters) => navigate('/jobs')}
                />
              </div>
              <div className="space-y-6">
                <ActivityTimeline limit={6} />
                <NotificationCenter compact={true} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage; 