import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Plus,
  MoreVertical,
  Calendar,
  MapPin,
  ExternalLink,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from "lucide-react";
import useJobApplicationStore, { JobApplication } from "../../stores/useJobApplicationStore";

interface KanbanColumn {
  id: JobApplication['status'];
  title: string;
  color: string;
  icon: React.ComponentType<any>;
  count: number;
}

interface JobApplicationKanbanProps {
  onAddApplication?: () => void;
  className?: string;
}

export const JobApplicationKanban: React.FC<JobApplicationKanbanProps> = ({ 
  onAddApplication,
  className = "" 
}) => {
  const { 
    applications, 
    getApplicationsByStatus,
    updateApplicationStatus,
    removeApplication,
    getApplicationStats
  } = useJobApplicationStore();

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const stats = getApplicationStats();

  const columns: KanbanColumn[] = [
    {
      id: 'applied',
      title: 'Applied',
      color: 'bg-blue-50 border-blue-200',
      icon: Clock,
      count: stats.applied
    },
    {
      id: 'reviewing',
      title: 'Under Review',
      color: 'bg-yellow-50 border-yellow-200',
      icon: AlertCircle,
      count: stats.reviewing
    },
    {
      id: 'interview',
      title: 'Interview',
      color: 'bg-purple-50 border-purple-200',
      icon: Calendar,
      count: stats.interview
    },
    {
      id: 'offer',
      title: 'Offer',
      color: 'bg-green-50 border-green-200',
      icon: CheckCircle,
      count: stats.offer
    },
    {
      id: 'rejected',
      title: 'Rejected',
      color: 'bg-red-50 border-red-200',
      icon: XCircle,
      count: stats.rejected
    },
    {
      id: 'withdrawn',
      title: 'Withdrawn',
      color: 'bg-gray-50 border-gray-200',
      icon: XCircle,
      count: stats.withdrawn
    }
  ];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatSalary = (salary: JobApplication['salary']) => {
    if (!salary || (!salary.min && !salary.max)) return null;
    const currency = salary.currency || 'AUD';
    if (salary.min && salary.max) {
      return `$${salary.min.toLocaleString()}-$${salary.max.toLocaleString()} ${currency}`;
    }
    return `$${(salary.min || salary.max)?.toLocaleString()} ${currency}`;
  };

  const handleDragStart = (e: React.DragEvent, applicationId: string) => {
    setDraggedItem(applicationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: JobApplication['status']) => {
    e.preventDefault();
    if (draggedItem) {
      updateApplicationStatus(draggedItem, newStatus);
      setDraggedItem(null);
    }
  };

  const handleStatusChange = (appId: string, newStatus: JobApplication['status']) => {
    updateApplicationStatus(appId, newStatus);
    setShowMenu(null);
  };


  const getStatusColor = (status: JobApplication['status']) => {
    const colors = {
      applied: 'text-blue-600',
      reviewing: 'text-yellow-600',
      interview: 'text-purple-600',
      offer: 'text-green-600',
      rejected: 'text-red-600',
      withdrawn: 'text-gray-600'
    };
    return colors[status];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Application Pipeline
          </div>
          <Button
            onClick={onAddApplication}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No applications yet</h3>
            <p className="text-sm mb-4">Start tracking your job applications to see them here</p>
            <Button onClick={onAddApplication}>Add Your First Application</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex space-x-4 min-w-max">
              {columns.map((column) => {
                const columnApplications = getApplicationsByStatus(column.id);
                const StatusIcon = column.icon;

                return (
                  <div
                    key={column.id}
                    className={`flex-shrink-0 w-80 ${column.color} rounded-lg p-4`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(column.id)}`} />
                        <h3 className="font-medium text-gray-900">{column.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {column.count}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {columnApplications.map((application) => (
                        <div
                          key={application.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, application.id)}
                          className="bg-white rounded-lg p-3 shadow-sm border cursor-move hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {application.jobTitle}
                              </h4>
                              <p className="text-xs text-gray-600">{application.company}</p>
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => setShowMenu(
                                  showMenu === application.id ? null : application.id
                                )}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>

                              {showMenu === application.id && (
                                <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg z-20 min-w-[120px]">
                                  <div className="py-1">
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                                      Move to
                                    </div>
                                    {columns
                                      .filter(col => col.id !== application.status)
                                      .map((col) => {
                                        const ColIcon = col.icon;
                                        return (
                                          <button
                                            key={col.id}
                                            onClick={() => handleStatusChange(application.id, col.id)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center space-x-2"
                                          >
                                            <ColIcon className="w-3 h-3" />
                                            <span>{col.title}</span>
                                          </button>
                                        );
                                      })}
                                    <div className="border-t">
                                      <button
                                        onClick={() => {
                                          removeApplication(application.id);
                                          setShowMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 mb-2">
                            <div className="flex items-center text-xs text-gray-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              {application.location}
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              Applied {formatDate(application.appliedDate)}
                            </div>
                            {application.salary && (
                              <div className="flex items-center text-xs text-green-600">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {formatSalary(application.salary)}
                              </div>
                            )}
                          </div>

                          {application.notes && (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-2">
                              {application.notes.substring(0, 80)}
                              {application.notes.length > 80 && '...'}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {application.interviewDate && (
                                <Badge variant="outline" className="text-xs">
                                  Interview scheduled
                                </Badge>
                              )}
                              {application.followUpDate && (
                                <Badge variant="outline" className="text-xs">
                                  Follow-up due
                                </Badge>
                              )}
                            </div>
                            {application.jobUrl && (
                              <a
                                href={application.jobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobApplicationKanban; 