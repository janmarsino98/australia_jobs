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
  Sparkles,
  Users,
  FileText,
  DollarSign,
  MessageSquare,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Ban,
  UserX,
  UserCheck,
  Filter,
  Download,
  RefreshCw,
  Globe,
  Database,
  Server,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Mail
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

  // Admin Dashboard Data and Logic
  const isAdmin = user?.role === 'admin';
  
  // Mock admin data - would be replaced with API calls
  const adminStats = {
    totalUsers: 12453,
    activeUsers: 8921,
    newUsersThisWeek: 234,
    totalJobs: 3456,
    pendingJobs: 45,
    rejectedJobs: 23,
    totalRevenue: 125430,
    monthlyRevenue: 18250,
    supportTickets: 12,
    urgentTickets: 3
  };

  const mockUsers = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      role: 'jobseeker',
      status: 'active',
      joinDate: '2024-01-15',
      lastLogin: '2024-02-10',
      applications: 15
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'employer',
      status: 'active',
      joinDate: '2024-01-10',
      lastLogin: '2024-02-09',
      jobsPosted: 8
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: 'mike@tech.com',
      role: 'jobseeker',
      status: 'suspended',
      joinDate: '2024-01-20',
      lastLogin: '2024-02-08',
      applications: 3
    }
  ];

  const mockJobs = [
    {
      id: '1',
      title: 'Senior React Developer',
      company: 'Tech Corp',
      location: 'Sydney, NSW',
      salary: '$120,000 - $150,000',
      status: 'pending',
      postedDate: '2024-02-09',
      applications: 25,
      views: 312
    },
    {
      id: '2',
      title: 'Marketing Manager',
      company: 'Growth Inc',
      location: 'Melbourne, VIC',
      salary: '$80,000 - $100,000',
      status: 'approved',
      postedDate: '2024-02-08',
      applications: 42,
      views: 156
    },
    {
      id: '3',
      title: 'Data Analyst',
      company: 'Analytics Ltd',
      location: 'Brisbane, QLD',
      salary: '$70,000 - $90,000',
      status: 'rejected',
      postedDate: '2024-02-07',
      applications: 0,
      views: 23,
      reason: 'Duplicate posting'
    }
  ];

  const mockTransactions = [
    {
      id: '1',
      type: 'job_posting',
      amount: 299,
      company: 'Tech Corp',
      date: '2024-02-09',
      status: 'completed',
      description: 'Senior React Developer posting'
    },
    {
      id: '2',
      type: 'premium_subscription',
      amount: 49,
      user: 'John Smith',
      date: '2024-02-08',
      status: 'completed',
      description: 'Monthly premium subscription'
    },
    {
      id: '3',
      type: 'job_promotion',
      amount: 99,
      company: 'Growth Inc',
      date: '2024-02-07',
      status: 'pending',
      description: 'Featured job promotion'
    }
  ];

  const mockTickets = [
    {
      id: '1',
      subject: 'Cannot upload resume',
      user: 'John Smith',
      priority: 'high',
      status: 'open',
      created: '2024-02-10',
      category: 'technical'
    },
    {
      id: '2',
      subject: 'Billing inquiry',
      user: 'Sarah Johnson',
      priority: 'medium',
      status: 'in_progress',
      created: '2024-02-09',
      category: 'billing'
    },
    {
      id: '3',
      subject: 'Job posting not visible',
      user: 'Mike Wilson',
      priority: 'urgent',
      status: 'open',
      created: '2024-02-10',
      category: 'job_posting'
    }
  ];

  const handleUserAction = (userId: string, action: string) => {
    console.log(`Admin action: ${action} for user ${userId}`);
    // In real app, this would make API call
  };

  const handleJobAction = (jobId: string, action: string) => {
    console.log(`Admin action: ${action} for job ${jobId}`);
    // In real app, this would make API call
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'approved': case 'completed': case 'resolved': return 'bg-green-100 text-green-800';
      case 'pending': case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': case 'rejected': case 'failed': return 'bg-red-100 text-red-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard 🛡️</h1>
              <p className="text-gray-600">Monitor and manage platform operations</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => navigate('/settings')} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.totalUsers.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +{adminStats.newUsersThisWeek} this week
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{(adminStats.totalJobs - adminStats.pendingJobs - adminStats.rejectedJobs).toLocaleString()}</p>
                    <p className="text-xs text-yellow-600 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {adminStats.pendingJobs} pending approval
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${adminStats.monthlyRevenue.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12% vs last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Support Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.supportTickets}</p>
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {adminStats.urgentTickets} urgent
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Admin Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-1" />
                        Filter
                      </Button>
                      <Badge variant="outline">{mockUsers.filter(u => u.status === 'active').length} Active</Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-700">{mockUsers.filter(u => u.status === 'suspended').length} Suspended</Badge>
                    </div>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {mockUsers.slice(0, 3).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(user.status)} variant="outline">
                            {user.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm" onClick={() => handleUserAction(user.id, 'edit')}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleUserAction(user.id, user.status === 'active' ? 'suspend' : 'activate')}>
                              {user.status === 'active' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Moderation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Job Moderation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{adminStats.pendingJobs} Pending</Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-700">{adminStats.rejectedJobs} Rejected</Badge>
                    </div>
                    <Button variant="outline" size="sm">View Queue</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {mockJobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{job.title}</h4>
                            <p className="text-xs text-gray-600">{job.company} • {job.location}</p>
                            <p className="text-xs text-gray-500">Posted: {job.postedDate}</p>
                          </div>
                          <Badge className={getStatusColor(job.status)} variant="outline">
                            {job.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {job.applications} applications • {job.views} views
                          </div>
                          <div className="flex space-x-1">
                            {job.status === 'pending' && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleJobAction(job.id, 'approve')}>
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleJobAction(job.id, 'reject')}>
                                  <XCircle className="w-3 h-3 text-red-600" />
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm" onClick={() => handleJobAction(job.id, 'view')}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Payment Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Total Revenue: </span>
                      <span className="text-green-600 font-bold">${adminStats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <Button variant="outline" size="sm">Export</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {mockTransactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">${transaction.amount}</p>
                          <p className="text-xs text-gray-600">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.company || transaction.user} • {transaction.date}</p>
                        </div>
                        <Badge className={getStatusColor(transaction.status)} variant="outline">
                          {transaction.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {mockTickets.filter(t => t.priority === 'urgent').length} Urgent
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {mockTickets.filter(t => t.status === 'open').length} Open
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {mockTickets.slice(0, 3).map((ticket) => (
                      <div key={ticket.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{ticket.subject}</h4>
                            <p className="text-xs text-gray-600">by {ticket.user}</p>
                            <p className="text-xs text-gray-500">{ticket.created} • {ticket.category}</p>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                              {ticket.priority}
                            </Badge>
                            <Badge className={getStatusColor(ticket.status)} variant="outline">
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Analytics */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                System Analytics & Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Platform Stats
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Database Size:</span>
                      <span className="font-medium">2.3 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Calls Today:</span>
                      <span className="font-medium">15,432</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Server Uptime:</span>
                      <span className="font-medium text-green-600">99.9%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <Server className="w-4 h-4 mr-2" />
                    System Health
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>API Status:</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Database:</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Email Service:</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Configuration
                  </h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Platform Settings
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Templates
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      Security Settings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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