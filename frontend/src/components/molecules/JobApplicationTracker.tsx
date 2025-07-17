import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  MoreVertical,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import useJobApplicationStore, { JobApplication } from "../../stores/useJobApplicationStore";

interface JobApplicationTrackerProps {
    onAddApplication?: () => void;
    className?: string;
}

export const JobApplicationTracker: React.FC<JobApplicationTrackerProps> = ({ 
    onAddApplication,
    className = "" 
}) => {
    const { 
        applications, 
        getRecentApplications, 
        getApplicationStats,
        updateApplicationStatus,
        removeApplication 
    } = useJobApplicationStore();

    const [selectedStatus, setSelectedStatus] = useState<JobApplication['status'] | 'all'>('all');
    const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);

    const stats = getApplicationStats();
    const recentApplications = getRecentApplications(5);

    const getStatusColor = (status: JobApplication['status']) => {
        const colors = {
            applied: 'bg-blue-100 text-blue-800',
            reviewing: 'bg-yellow-100 text-yellow-800',
            interview: 'bg-purple-100 text-purple-800',
            offer: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            withdrawn: 'bg-gray-100 text-gray-800'
        };
        return colors[status];
    };

    const getStatusIcon = (status: JobApplication['status']) => {
        switch (status) {
            case 'applied':
                return <Clock className="w-4 h-4" />;
            case 'reviewing':
                return <AlertCircle className="w-4 h-4" />;
            case 'interview':
                return <Calendar className="w-4 h-4" />;
            case 'offer':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejected':
                return <XCircle className="w-4 h-4" />;
            case 'withdrawn':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getSuccessRate = () => {
        if (stats.total === 0) return 0;
        return Math.round(((stats.offer + stats.interview) / stats.total) * 100);
    };

    const handleStatusUpdate = (appId: string, newStatus: JobApplication['status']) => {
        updateApplicationStatus(appId, newStatus);
        setShowStatusMenu(null);
    };

    const filteredApplications = selectedStatus === 'all' 
        ? recentApplications 
        : recentApplications.filter(app => app.status === selectedStatus);

    const statusOptions: { value: JobApplication['status'] | 'all'; label: string }[] = [
        { value: 'all', label: 'All Applications' },
        { value: 'applied', label: 'Applied' },
        { value: 'reviewing', label: 'Under Review' },
        { value: 'interview', label: 'Interview' },
        { value: 'offer', label: 'Offer' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'withdrawn', label: 'Withdrawn' }
    ];

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Stats Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Application Statistics
                        </div>
                        <button
                            type="button"
                            onClick={onAddApplication}
                            className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Application</span>
                        </button>
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
                            <div className="text-2xl font-bold text-orange-600">{getSuccessRate()}%</div>
                            <div className="text-sm text-gray-600">Success Rate</div>
                        </div>
                    </div>

                    {stats.total > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress to Interview</span>
                                <span>{Math.round(((stats.interview + stats.offer) / stats.total) * 100)}%</span>
                            </div>
                            <Progress 
                                value={((stats.interview + stats.offer) / stats.total) * 100} 
                                className="h-2"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Applications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Briefcase className="w-5 h-5 mr-2" />
                        Recent Applications
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setSelectedStatus(option.value)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                    selectedStatus === option.value
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {option.label}
                                {option.value !== 'all' && (
                                    <span className="ml-1">
                                        ({stats[option.value as keyof typeof stats]})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Applications List */}
                    {filteredApplications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">No applications yet</p>
                            <p className="text-sm">Start tracking your job applications to see your progress</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredApplications.map((application) => (
                                <div 
                                    key={application.id} 
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {application.jobTitle}
                                                </h4>
                                                {application.jobUrl && (
                                                    <a
                                                        href={application.jobUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                                <span className="font-medium">{application.company}</span>
                                                <span className="flex items-center">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {application.location}
                                                </span>
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(application.appliedDate)}
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                                    <div className="flex items-center space-x-1">
                                                        {getStatusIcon(application.status)}
                                                        <span className="capitalize">{application.status}</span>
                                                    </div>
                                                </span>
                                                
                                                {application.salary && (
                                                    <span className="text-sm text-green-600 font-medium">
                                                        ${application.salary.min?.toLocaleString()}-${application.salary.max?.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowStatusMenu(
                                                    showStatusMenu === application.id ? null : application.id
                                                )}
                                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {showStatusMenu === application.id && (
                                                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-[150px]">
                                                    <div className="py-1">
                                                        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                                                            Update Status
                                                        </div>
                                                        {(['applied', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn'] as const).map((status) => (
                                                            <button
                                                                key={status}
                                                                type="button"
                                                                onClick={() => handleStatusUpdate(application.id, status)}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                                                    application.status === status ? 'bg-blue-50 text-blue-700' : ''
                                                                }`}
                                                            >
                                                                {getStatusIcon(status)}
                                                                <span className="capitalize">{status}</span>
                                                            </button>
                                                        ))}
                                                        <div className="border-t">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    removeApplication(application.id);
                                                                    setShowStatusMenu(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {application.notes && (
                                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            {application.notes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {applications.length > 5 && (
                        <div className="text-center pt-4">
                            <button
                                type="button"
                                className="text-sm text-blue-600 hover:text-blue-800"
                                onClick={() => {/* Navigate to full applications page */}}
                            >
                                View All Applications ({applications.length})
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default JobApplicationTracker; 