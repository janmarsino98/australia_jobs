import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Bell, 
  BellRing,
  Check,
  X,
  Briefcase,
  Calendar,
  AlertTriangle,
  Info,
  Star,
  Clock,
  TrendingUp,
  User,
  Settings,
  Archive
} from "lucide-react";
import useJobApplicationStore from "../../stores/useJobApplicationStore";
import useAuthStore from "../../stores/useAuthStore";

interface Notification {
  id: string;
  type: 'application_update' | 'job_alert' | 'reminder' | 'system' | 'recommendation' | 'deadline';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionLabel?: string;
  actionUrl?: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface NotificationCenterProps {
  className?: string;
  compact?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  className = "",
  compact = false
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const { applications, getApplicationStats } = useJobApplicationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    generateNotifications();
  }, [applications]);

  const generateNotifications = () => {
    const now = Date.now();
    const generatedNotifications: Notification[] = [];

    // Application-based notifications
    applications.forEach(app => {
      // Interview reminders
      if (app.interviewDate && app.interviewDate > now) {
        const daysDiff = Math.ceil((app.interviewDate - now) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 3) {
          generatedNotifications.push({
            id: `interview-${app.id}`,
            type: 'reminder',
            title: 'Upcoming Interview',
            message: `Interview for ${app.jobTitle} at ${app.company} is in ${daysDiff} day${daysDiff === 1 ? '' : 's'}`,
            timestamp: now - (Math.random() * 1000 * 60 * 60),
            read: false,
            priority: 'high',
            actionLabel: 'View Details',
            actionUrl: app.jobUrl,
            icon: Calendar,
            color: 'text-purple-600'
          });
        }
      }

      // Follow-up reminders
      if (app.followUpDate && app.followUpDate <= now) {
        generatedNotifications.push({
          id: `followup-${app.id}`,
          type: 'reminder',
          title: 'Follow-up Due',
          message: `Time to follow up on your application to ${app.company}`,
          timestamp: now - (Math.random() * 1000 * 60 * 60 * 24),
          read: Math.random() > 0.7,
          priority: 'medium',
          actionLabel: 'Contact',
          icon: Clock,
          color: 'text-orange-600'
        });
      }

      // Status updates
      if (app.lastUpdated !== app.appliedDate) {
        generatedNotifications.push({
          id: `status-${app.id}`,
          type: 'application_update',
          title: 'Application Status Updated',
          message: `Your application for ${app.jobTitle} status changed to ${app.status}`,
          timestamp: app.lastUpdated,
          read: Math.random() > 0.5,
          priority: app.status === 'offer' ? 'high' : 'medium',
          actionLabel: 'View Application',
          actionUrl: app.jobUrl,
          icon: Briefcase,
          color: app.status === 'offer' ? 'text-green-600' : 'text-blue-600'
        });
      }
    });

    // Job alerts and recommendations
    const jobAlerts: Notification[] = [
      {
        id: 'job-alert-1',
        type: 'job_alert',
        title: 'New Job Matches',
        message: '5 new jobs match your saved search criteria',
        timestamp: now - (2 * 60 * 60 * 1000),
        read: false,
        priority: 'medium',
        actionLabel: 'View Jobs',
        actionUrl: '/jobs',
        icon: Star,
        color: 'text-yellow-600'
      },
      {
        id: 'recommendation-1',
        type: 'recommendation',
        title: 'Perfect Match Found',
        message: 'Senior Developer at TechCorp - 95% match with your profile',
        timestamp: now - (4 * 60 * 60 * 1000),
        read: Math.random() > 0.6,
        priority: 'high',
        actionLabel: 'View Job',
        icon: TrendingUp,
        color: 'text-green-600'
      }
    ];

    // System notifications
    const systemNotifications: Notification[] = [
      {
        id: 'profile-completion',
        type: 'system',
        title: 'Complete Your Profile',
        message: 'Add skills and experience to get better job recommendations',
        timestamp: now - (24 * 60 * 60 * 1000),
        read: false,
        priority: 'low',
        actionLabel: 'Update Profile',
        actionUrl: '/profile',
        icon: User,
        color: 'text-indigo-600'
      },
      {
        id: 'weekly-summary',
        type: 'system',
        title: 'Weekly Job Search Summary',
        message: 'You applied to 3 jobs and saved 2 searches this week',
        timestamp: now - (6 * 60 * 60 * 1000),
        read: true,
        priority: 'low',
        actionLabel: 'View Report',
        icon: TrendingUp,
        color: 'text-gray-600'
      }
    ];

    // Deadline notifications
    const deadlineNotifications: Notification[] = [
      {
        id: 'deadline-1',
        type: 'deadline',
        title: 'Application Deadline Soon',
        message: 'Software Engineer at InnovateCorp deadline is tomorrow',
        timestamp: now - (30 * 60 * 1000),
        read: false,
        priority: 'high',
        actionLabel: 'Apply Now',
        icon: AlertTriangle,
        color: 'text-red-600'
      }
    ];

    generatedNotifications.push(...jobAlerts, ...systemNotifications, ...deadlineNotifications);

    // Sort by timestamp (most recent first)
    const sortedNotifications = generatedNotifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, compact ? 5 : 20);

    setNotifications(sortedNotifications);
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'important':
        return notification.priority === 'high';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const importantCount = notifications.filter(n => n.priority === 'high').length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <Bell className="w-5 h-5 mr-2" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Notifications
          </div>
          {!compact && (
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!compact && (
          <div className="flex space-x-2 mb-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === 'important' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('important')}
            >
              Important ({importantCount})
            </Button>
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all ${
                  notification.read 
                    ? 'bg-white border-gray-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${notification.color}`}>
                    <notification.icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {notification.actionLabel && (
                          <button 
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => notification.actionUrl && window.open(notification.actionUrl, '_blank')}
                          >
                            {notification.actionLabel} →
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Remove notification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {compact && notifications.length > 5 && (
          <div className="text-center mt-4">
            <Button variant="outline" size="sm">
              View All Notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter; 