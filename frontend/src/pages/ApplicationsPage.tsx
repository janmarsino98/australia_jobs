import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Filter,
  MapPin,
  MoreVertical,
  Search,
  Trash2,
  Eye,
  Edit,
  AlertTriangle
} from "lucide-react";
import useJobApplicationStore, { JobApplication } from "../stores/useJobApplicationStore";
import useAuthStore from "../stores/useAuthStore";

const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    applications, 
    getApplicationStats, 
    updateApplicationStatus, 
    removeApplication 
  } = useJobApplicationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobApplication['status'] | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);

  // Filter and search applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = searchTerm === '' || 
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const stats = getApplicationStats();

  const handleStatusChange = (applicationId: string, newStatus: JobApplication['status']) => {
    updateApplicationStatus(applicationId, newStatus);
  };

  const handleWithdraw = (applicationId: string) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      updateApplicationStatus(applicationId, 'withdrawn');
    }
  };

  const handleDelete = (applicationId: string) => {
    if (window.confirm('Are you sure you want to delete this application record? This action cannot be undone.')) {
      removeApplication(applicationId);
    }
  };

  const getStatusColor = (status: JobApplication['status']) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary?: { min?: number; max?: number; currency?: string }) => {
    if (!salary) return 'Not specified';
    const currency = salary.currency || 'AUD';
    if (salary.min && salary.max) {
      return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()} ${currency}`;
    } else if (salary.min) {
      return `$${salary.min.toLocaleString()}+ ${currency}`;
    } else if (salary.max) {
      return `Up to $${salary.max.toLocaleString()} ${currency}`;
    }
    return 'Not specified';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
        <p className="text-gray-600">Track and manage your job applications</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {(['applied', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn'] as const).map((status) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{status}</p>
                  <p className="text-2xl font-bold">{stats[status]}</p>
                </div>
                <Badge className={`${getStatusColor(status)} border-0`}>
                  {stats[status]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by job title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value as JobApplication['status'] | 'all')}
              >
                <option value="all">All Statuses</option>
                <option value="applied">Applied</option>
                <option value="reviewing">Under Review</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                Timeline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {applications.length === 0 ? 'No applications yet' : 'No applications match your search'}
            </h3>
            <p className="text-gray-600 mb-6">
              {applications.length === 0 
                ? "Start applying to jobs to see them here"
                : "Try adjusting your search terms or filters"
              }
            </p>
            {applications.length === 0 && (
              <Button onClick={() => navigate('/jobs')}>
                Browse Jobs
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {viewMode === 'list' ? (
            filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                            {application.jobTitle}
                          </h3>
                          <p className="text-gray-600 mb-2">{application.company}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {application.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Applied {formatDate(application.appliedDate)}
                            </div>
                            {application.salary && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {formatSalary(application.salary)}
                              </div>
                            )}
                          </div>

                          {application.notes && (
                            <p className="text-sm text-gray-600 mb-3 italic">
                              {application.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={`${getStatusColor(application.status)} border-0 capitalize`}>
                        {application.status}
                      </Badge>

                      <div className="flex items-center gap-2">
                        {application.jobUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(application.jobUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Job
                          </Button>
                        )}

                        <Select 
                          value={application.status} 
                          onValueChange={(value) => handleStatusChange(application.id, value as JobApplication['status'])}
                        >
                          <option value="applied">Applied</option>
                          <option value="reviewing">Under Review</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                          <option value="withdrawn">Withdrawn</option>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(application.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            /* Timeline View */
            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative">
                  {filteredApplications
                    .sort((a, b) => b.lastUpdated - a.lastUpdated)
                    .map((application, index) => (
                      <div key={application.id} className="relative pl-8 pb-8 last:pb-0">
                        {index < filteredApplications.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                        )}
                        
                        <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{application.jobTitle}</h4>
                            <Badge className={`${getStatusColor(application.status)} border-0 capitalize ml-2`}>
                              {application.status}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-2">{application.company} • {application.location}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <span>Applied: {formatDate(application.appliedDate)}</span>
                            <span>Updated: {formatDate(application.lastUpdated)}</span>
                          </div>

                          {application.notes && (
                            <p className="text-sm text-gray-600 italic">{application.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;