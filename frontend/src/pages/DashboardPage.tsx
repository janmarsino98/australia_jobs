import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Bell,
  Briefcase,
  Clock,
  Settings,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import MainHeader from "../components/molecules/MainHeader";
import ProfileCompleteness from "../components/molecules/ProfileCompleteness";
import JobApplicationTracker from "../components/molecules/JobApplicationTracker";
import SavedSearches from "../components/molecules/SavedSearches";
import useAuthStore from "../stores/useAuthStore";
import useJobApplicationStore from "../stores/useJobApplicationStore";
import useSavedSearchesStore from "../stores/useSavedSearchesStore";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
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
    { label: 'Search Jobs', icon: Briefcase, href: '/jobs' },
    { label: 'Upload Resume', icon: User, href: '/resume' },
    { label: 'View Applications', icon: Clock, href: '/applications' },
    { label: 'Saved Jobs', icon: Star, href: '/saved' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-gray-600">Here's what's happening with your job search</p>
          </div>
          <Button
            onClick={() => navigate('/settings')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="flex flex-col items-center justify-center h-24 hover:bg-blue-50 hover:border-blue-200"
              onClick={() => navigate(action.href)}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Completeness */}
          <ProfileCompleteness
            user={user}
            onActionClick={(action) => navigate(`/profile/${action}`)}
            className="lg:col-span-1"
          />
          
          {/* Application Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Application Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.interview}</div>
                  <div className="text-sm text-gray-600">Interviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.offer}</div>
                  <div className="text-sm text-gray-600">Offers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(((stats.offer + stats.interview) / stats.total) * 100 || 0)}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Applications */}
          <JobApplicationTracker
            onAddApplication={() => navigate('/jobs')}
            className="w-full"
          />
          
          {/* Saved Searches */}
          <SavedSearches
            onSearchLoad={(filters) => {
              // Store filters and navigate to jobs page
              navigate('/jobs');
            }}
            className="w-full"
          />
        </div>

        {/* Notifications Center */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              No new notifications
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage; 