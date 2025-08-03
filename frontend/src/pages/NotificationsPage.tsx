import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, Filter, Settings, RefreshCw } from 'lucide-react';
import { useNotificationStore, Notification } from '../stores/useNotificationStore';
import { NotificationPreferences } from '../components/molecules/NotificationPreferences';
import { cn } from '../lib/utils';

export const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
    createTestNotification
  } = useNotificationStore();

  useEffect(() => {
    const status = statusFilter === 'all' ? undefined : statusFilter;
    fetchNotifications(currentPage, status);
  }, [fetchNotifications, currentPage, statusFilter]);

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleStatusFilterChange = (status: 'all' | 'unread' | 'read') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    const status = statusFilter === 'all' ? undefined : statusFilter;
    fetchNotifications(currentPage, status);
  };

  const handleCreateTestNotification = async () => {
    const testNotifications = [
      {
        title: 'Application Submitted',
        message: 'Your application for Senior Software Developer at TechCorp has been submitted successfully.'
      },
      {
        title: 'New Job Match Found',
        message: 'We found a 95% match: Full Stack Developer at InnovateLabs. Check it out!'
      },
      {
        title: 'Interview Scheduled',
        message: 'Great news! You have been selected for an interview at DevCorp for the React Developer position.'
      },
      {
        title: 'Resume Analysis Complete',
        message: 'Your resume analysis is ready! Overall ATS score: 87/100. View detailed feedback.'
      },
      {
        title: 'Account Security Alert',
        message: 'New login detected from Sydney, NSW. If this wasn\'t you, please secure your account.'
      }
    ];
    
    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    await createTestNotification(randomNotification.title, randomNotification.message);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'job_application_submitted': 'Application Submitted',
      'job_application_status_changed': 'Application Update',
      'new_job_match': 'Job Match',
      'resume_analysis_complete': 'Resume Analysis',
      'password_changed': 'Password Changed',
      'login_from_new_device': 'New Device Login',
      'account_locked': 'Account Security',
      'two_factor_enabled': '2FA Update',
      'subscription_expires_soon': 'Subscription',
      'new_message': 'New Message',
      'system_maintenance': 'System Update',
      'welcome': 'Welcome'
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600">
                      You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Refresh notifications"
                >
                  <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm",
                    activeTab === 'notifications'
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm flex items-center",
                    activeTab === 'preferences'
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Preferences
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'notifications' ? (
              <>
                {/* Filters and Actions */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Filter:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'unread' | 'read')}
                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCreateTestNotification}
                      disabled={isLoading}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800 disabled:opacity-50 border border-green-300 hover:border-green-400 rounded-md transition-colors"
                      title="Create a random test notification"
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Add Test Notification
                    </button>
                    
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* Error State */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              clearError();
                              handleRefresh();
                            }}
                            className="bg-red-50 text-red-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-red-100"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications List */}
                {isLoading && notifications.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-500">
                      {statusFilter === 'unread' 
                        ? "You don't have any unread notifications"
                        : statusFilter === 'read'
                        ? "You don't have any read notifications"
                        : "You don't have any notifications yet"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "flex items-start space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
                          notification.status === 'unread' 
                            ? "border-blue-200 bg-blue-50" 
                            : "border-gray-200"
                        )}
                      >
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center",
                            notification.status === 'unread' ? "bg-blue-100" : "bg-gray-100"
                          )}>
                            <Bell className={cn(
                              "h-6 w-6",
                              notification.status === 'unread' ? "text-blue-600" : "text-gray-400"
                            )} />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h3 className={cn(
                                "font-medium truncate",
                                notification.status === 'unread' ? "text-gray-900" : "text-gray-700"
                              )}>
                                {notification.title}
                              </h3>
                              <span className={cn(
                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                                getPriorityColor(notification.priority)
                              )}>
                                {notification.priority}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {getNotificationTypeLabel(notification.type)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {notification.status === 'unread' && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(notification.id, e)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Delete notification"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>{formatTimeAgo(notification.created_at)}</span>
                            {notification.expires_at && (
                              <span>Expires: {new Date(notification.expires_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NotificationPreferences />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};