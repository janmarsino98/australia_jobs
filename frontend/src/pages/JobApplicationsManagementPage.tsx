import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import { useToast } from "../components/ui/use-toast";
import { motion } from "framer-motion";
import { 
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Calendar,
  User,
  FileText,
  Star,
  MapPin,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Phone,
  Archive,
  MoreVertical
} from "lucide-react";
import { useParams } from "react-router-dom";
import httpClient from "../httpClient";
import config from "../config";

interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  appliedDate: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected';
  resumeUrl?: string;
  coverLetter?: string;
  experience: string;
  skills: string[];
  rating?: number;
  notes?: string;
  lastActivity: string;
  location: string;
  salaryExpectation?: number;
}

const JobApplicationsManagementPage = () => {
  const { jobId } = useParams();
  const { toast } = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  // Mock data - would be replaced with API call
  const mockApplications: Application[] = [
    {
      id: "1",
      applicantName: "Sarah Johnson",
      applicantEmail: "sarah.johnson@email.com",
      applicantPhone: "+61 423 456 789",
      appliedDate: "2024-02-10T10:30:00Z",
      status: "reviewing",
      resumeUrl: "/resumes/sarah-johnson.pdf",
      coverLetter: "I am very interested in this position and believe my 5 years of experience in React development makes me a perfect fit...",
      experience: "5 years",
      skills: ["React", "TypeScript", "Node.js", "AWS", "MongoDB"],
      rating: 4.5,
      notes: "Strong technical background, good communication skills",
      lastActivity: "2024-02-11T14:30:00Z",
      location: "Sydney, NSW",
      salaryExpectation: 120000
    },
    {
      id: "2", 
      applicantName: "Michael Chen",
      applicantEmail: "m.chen@email.com",
      appliedDate: "2024-02-09T16:15:00Z",
      status: "shortlisted",
      resumeUrl: "/resumes/michael-chen.pdf",
      coverLetter: "Having worked with similar technologies at my previous company, I'm confident I can contribute immediately...",
      experience: "7 years",
      skills: ["React", "Vue.js", "Python", "Docker", "PostgreSQL"],
      rating: 5.0,
      notes: "Excellent candidate, strong portfolio",
      lastActivity: "2024-02-12T09:15:00Z", 
      location: "Melbourne, VIC",
      salaryExpectation: 140000
    },
    {
      id: "3",
      applicantName: "Emma Wilson",
      applicantEmail: "emma.w@email.com",
      applicantPhone: "+61 401 234 567",
      appliedDate: "2024-02-08T11:45:00Z",
      status: "interview",
      resumeUrl: "/resumes/emma-wilson.pdf",
      experience: "3 years",
      skills: ["JavaScript", "React", "CSS", "HTML", "Git"],
      rating: 3.5,
      notes: "Junior level but shows promise",
      lastActivity: "2024-02-13T16:00:00Z",
      location: "Brisbane, QLD",
      salaryExpectation: 85000
    },
    {
      id: "4",
      applicantName: "David Rodriguez",
      applicantEmail: "david.r@email.com",
      appliedDate: "2024-02-07T14:20:00Z",
      status: "pending",
      resumeUrl: "/resumes/david-rodriguez.pdf",
      coverLetter: "I would love the opportunity to discuss how my background in full-stack development...",
      experience: "4 years",
      skills: ["JavaScript", "Python", "Django", "React", "MySQL"],
      lastActivity: "2024-02-07T14:20:00Z",
      location: "Perth, WA",
      salaryExpectation: 95000
    }
  ];

  // Load applications on component mount
  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setApplications(mockApplications);
        setFilteredApplications(mockApplications);
        setJobTitle("Senior Software Engineer"); // Would come from API
      } catch (error) {
        toast({
          title: "Error Loading Applications",
          description: "Failed to load job applications. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [jobId, toast]);

  // Filter applications
  useEffect(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-800";
      case "reviewing": return "bg-blue-100 text-blue-800";
      case "shortlisted": return "bg-green-100 text-green-800";
      case "interview": return "bg-purple-100 text-purple-800";
      case "offer": return "bg-yellow-100 text-yellow-800";
      case "hired": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return Clock;
      case "reviewing": return Eye;
      case "shortlisted": return Star;
      case "interview": return MessageSquare;
      case "offer": return Mail;
      case "hired": return CheckCircle;
      case "rejected": return XCircle;
      default: return Clock;
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await httpClient.patch(`${config.apiBaseUrl}/applications/${applicationId}/status`, {
        status: newStatus
      });
      
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus as any, lastActivity: new Date().toISOString() }
            : app
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Application status changed to ${newStatus}.`
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update application status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedApplications.length === 0) {
      toast({
        title: "No Applications Selected",
        description: "Please select applications to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    try {
      await httpClient.post(`${config.apiBaseUrl}/applications/bulk-${action}`, {
        applicationIds: selectedApplications
      });
      
      toast({
        title: "Bulk Action Completed",
        description: `${action} applied to ${selectedApplications.length} application${selectedApplications.length > 1 ? 's' : ''}.`
      });
      
      setSelectedApplications([]);
    } catch (error) {
      toast({
        title: "Bulk Action Failed",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportApplications = () => {
    // In a real app, this would generate and download a CSV/Excel file
    const csvContent = filteredApplications.map(app => 
      `${app.applicantName},${app.applicantEmail},${app.status},${app.experience},${app.location}`
    ).join('\n');
    
    toast({
      title: "Export Started",
      description: "Applications data export has been initiated."
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications</h1>
            <p className="text-gray-600">
              Manage applications for <strong>{jobTitle}</strong>
            </p>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            {[
              { key: 'pending', label: 'Pending', icon: Clock },
              { key: 'reviewing', label: 'Reviewing', icon: Eye },
              { key: 'shortlisted', label: 'Shortlisted', icon: Star },
              { key: 'interview', label: 'Interview', icon: MessageSquare },
              { key: 'offer', label: 'Offer', icon: Mail },
              { key: 'hired', label: 'Hired', icon: CheckCircle },
              { key: 'rejected', label: 'Rejected', icon: XCircle }
            ].map(({ key, label, icon: Icon }) => (
              <Card key={key} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter(key)}>
                <CardContent className="p-4 text-center">
                  <Icon size={24} className="mx-auto mb-2 text-gray-600" />
                  <div className="text-2xl font-bold text-gray-900">{statusCounts[key] || 0}</div>
                  <div className="text-sm text-gray-600">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Search by name, email, or skills..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>

                <Button variant="outline" onClick={exportApplications}>
                  <Download size={16} className="mr-2" />
                  Export
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedApplications.length > 0 && (
                <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedApplications.length} application{selectedApplications.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('shortlist')}>
                      Shortlist
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')}>
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
                      Archive
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const StatusIcon = getStatusIcon(application.status);
              const timeAgo = Math.floor((new Date().getTime() - new Date(application.appliedDate).getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(application.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedApplications(prev => [...prev, application.id]);
                            } else {
                              setSelectedApplications(prev => prev.filter(id => id !== application.id));
                            }
                          }}
                          className="mt-1"
                        />

                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={24} className="text-gray-600" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.applicantName}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center gap-1">
                                  <Mail size={14} />
                                  {application.applicantEmail}
                                </div>
                                {application.applicantPhone && (
                                  <div className="flex items-center gap-1">
                                    <Phone size={14} />
                                    {application.applicantPhone}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  {application.location}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {application.rating && (
                                <div className="flex items-center gap-1">
                                  <Star size={16} className="text-yellow-500" />
                                  <span className="text-sm font-medium">{application.rating}</span>
                                </div>
                              )}
                              
                              <Badge className={getStatusColor(application.status)} variant="outline">
                                <StatusIcon size={12} className="mr-1" />
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                            <div>{application.experience} experience</div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              Applied {timeAgo} days ago
                            </div>
                            {application.salaryExpectation && (
                              <div>${application.salaryExpectation.toLocaleString()} expected</div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {application.skills.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {application.skills.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{application.skills.length - 5} more
                              </Badge>
                            )}
                          </div>

                          {application.coverLetter && (
                            <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                              {application.coverLetter}
                            </p>
                          )}

                          {application.notes && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 mb-3">
                              <strong>Notes:</strong> {application.notes}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {application.resumeUrl && (
                                <Button size="sm" variant="outline">
                                  <FileText size={14} className="mr-1" />
                                  Resume
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <Mail size={14} className="mr-1" />
                                Contact
                              </Button>
                              <Button size="sm" variant="outline">
                                <MessageSquare size={14} className="mr-1" />
                                Interview
                              </Button>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={application.status}
                                onChange={(e) => handleStatusChange(application.id, e.target.value)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filteredApplications.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No matching applications' : 'No applications yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters'
                    : 'Applications will appear here once candidates start applying to your job'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default JobApplicationsManagementPage;