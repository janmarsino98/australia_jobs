import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import { useToast } from "../components/ui/use-toast";
import { motion } from "framer-motion";
import { 
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  RefreshCw,
  Download,
  Share,
  Copy
} from "lucide-react";
import httpClient from "../httpClient";
import config from "../config";
import useAuthStore from "../stores/useAuthStore";
import { useNavigate } from "react-router-dom";

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: {
    city: string;
    state: string;
  };
  jobType: string;
  workArrangement: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  status: 'active' | 'paused' | 'expired' | 'draft';
  applications: number;
  views: number;
  createdAt: string;
  expiresAt: string;
  department: string;
  experienceLevel: string;
  featured: boolean;
}

const JobManagementPage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  // Mock data - would be replaced with API call
  const mockJobs: JobPosting[] = [
    {
      id: "1",
      title: "Senior Software Engineer",
      company: "TechCorp Australia",
      location: { city: "Sydney", state: "NSW" },
      jobType: "full-time",
      workArrangement: "hybrid",
      salary: { min: 120000, max: 150000, currency: "AUD", period: "year" },
      status: "active",
      applications: 47,
      views: 1234,
      createdAt: "2024-02-01",
      expiresAt: "2024-03-01",
      department: "Engineering",
      experienceLevel: "senior",
      featured: true
    },
    {
      id: "2", 
      title: "Product Manager",
      company: "TechCorp Australia",
      location: { city: "Melbourne", state: "VIC" },
      jobType: "full-time",
      workArrangement: "remote",
      salary: { min: 110000, max: 140000, currency: "AUD", period: "year" },
      status: "active",
      applications: 23,
      views: 567,
      createdAt: "2024-02-10",
      expiresAt: "2024-03-10",
      department: "Product",
      experienceLevel: "mid",
      featured: false
    },
    {
      id: "3",
      title: "Frontend Developer",
      company: "TechCorp Australia", 
      location: { city: "Brisbane", state: "QLD" },
      jobType: "contract",
      workArrangement: "on-site",
      salary: { min: 90000, max: 110000, currency: "AUD", period: "year" },
      status: "paused",
      applications: 12,
      views: 234,
      createdAt: "2024-02-05",
      expiresAt: "2024-03-05",
      department: "Engineering",
      experienceLevel: "mid",
      featured: false
    },
    {
      id: "4",
      title: "Marketing Specialist",
      company: "TechCorp Australia",
      location: { city: "Perth", state: "WA" },
      jobType: "part-time",
      workArrangement: "hybrid",
      salary: { min: 60000, max: 75000, currency: "AUD", period: "year" },
      status: "draft",
      applications: 0,
      views: 0,
      createdAt: "2024-02-15",
      expiresAt: "2024-03-15",
      department: "Marketing",
      experienceLevel: "entry",
      featured: false
    }
  ];

  // Load jobs on component mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setJobs(mockJobs);
        setFilteredJobs(mockJobs);
      } catch (error) {
        toast({
          title: "Error Loading Jobs",
          description: "Failed to load your job postings. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [toast]);

  // Filter and search jobs
  useEffect(() => {
    let filtered = jobs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "applications":
          return b.applications - a.applications;
        case "views":
          return b.views - a.views;
        case "title":
          return a.title.localeCompare(b.title);
        case "created":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, sortBy]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary";
      case "expired": return "destructive";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return CheckCircle;
      case "paused": return Pause;
      case "expired": return AlertCircle;
      case "draft": return Edit;
      default: return AlertCircle;
    }
  };

  const handleJobAction = async (jobId: string, action: string) => {
    try {
      setLoading(true);
      
      switch (action) {
        case "pause":
          await httpClient.patch(`${config.apiBaseUrl}/jobs/${jobId}/pause`);
          setJobs(prev => prev.map(job => 
            job.id === jobId ? { ...job, status: 'paused' as const } : job
          ));
          toast({ title: "Job Paused", description: "Job posting has been paused." });
          break;
        
        case "activate":
          await httpClient.patch(`${config.apiBaseUrl}/jobs/${jobId}/activate`);
          setJobs(prev => prev.map(job => 
            job.id === jobId ? { ...job, status: 'active' as const } : job
          ));
          toast({ title: "Job Activated", description: "Job posting is now active." });
          break;
          
        case "delete":
          if (confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) {
            await httpClient.delete(`${config.apiBaseUrl}/jobs/${jobId}`);
            setJobs(prev => prev.filter(job => job.id !== jobId));
            toast({ title: "Job Deleted", description: "Job posting has been deleted." });
          }
          break;
          
        case "duplicate":
          await httpClient.post(`${config.apiBaseUrl}/jobs/${jobId}/duplicate`);
          toast({ title: "Job Duplicated", description: "Job has been duplicated as a draft." });
          // Refresh jobs list
          break;
      }
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.response?.data?.message || `Failed to ${action} job posting.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedJobs.length === 0) {
      toast({
        title: "No Jobs Selected",
        description: "Please select jobs to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await httpClient.post(`${config.apiBaseUrl}/jobs/bulk-${action}`, {
        jobIds: selectedJobs
      });
      
      toast({
        title: "Bulk Action Completed",
        description: `${action} applied to ${selectedJobs.length} job${selectedJobs.length > 1 ? 's' : ''}.`
      });
      
      setSelectedJobs([]);
      // Refresh jobs list
    } catch (error) {
      toast({
        title: "Bulk Action Failed",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyJobLink = (jobId: string) => {
    const link = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Job posting link copied to clipboard."
    });
  };

  const getJobPerformance = (job: JobPosting) => {
    const ageInDays = Math.floor(
      (new Date().getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const applicationsPerDay = ageInDays > 0 ? job.applications / ageInDays : 0;
    const conversionRate = job.views > 0 ? (job.applications / job.views) * 100 : 0;

    return { ageInDays, applicationsPerDay, conversionRate };
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
              <p className="text-gray-600 mt-2">
                Manage your job postings and track their performance
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/post-job')}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Post New Job
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: "Active Jobs",
                value: jobs.filter(j => j.status === 'active').length,
                icon: CheckCircle,
                color: "text-green-600",
                bgColor: "bg-green-100"
              },
              {
                title: "Total Applications",
                value: jobs.reduce((sum, job) => sum + job.applications, 0),
                icon: Users,
                color: "text-blue-600",
                bgColor: "bg-blue-100"
              },
              {
                title: "Total Views",
                value: jobs.reduce((sum, job) => sum + job.views, 0),
                icon: Eye,
                color: "text-purple-600",
                bgColor: "bg-purple-100"
              },
              {
                title: "Avg. Conversion",
                value: `${Math.round(
                  jobs.reduce((sum, job) => {
                    const rate = job.views > 0 ? (job.applications / job.views) * 100 : 0;
                    return sum + rate;
                  }, 0) / jobs.length
                )}%`,
                icon: TrendingUp,
                color: "text-orange-600",
                bgColor: "bg-orange-100"
              }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardContent className="flex items-center p-6">
                    <div className={`p-3 rounded-full ${stat.bgColor} mr-4`}>
                      <Icon size={24} className={stat.color} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-gray-600 text-sm">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Search jobs by title, department, or location..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="expired">Expired</option>
                  <option value="draft">Draft</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created">Date Created</option>
                  <option value="applications">Applications</option>
                  <option value="views">Views</option>
                  <option value="title">Title</option>
                </select>

                {/* Refresh */}
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw size={16} />
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedJobs.length > 0 && (
                <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('pause')}>
                      Pause
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                      Activate
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs List */}
          {filteredJobs.length > 0 ? (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const StatusIcon = getStatusIcon(job.status);
                const performance = getJobPerformance(job);
                
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          {/* Job Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedJobs.includes(job.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedJobs(prev => [...prev, job.id]);
                                } else {
                                  setSelectedJobs(prev => prev.filter(id => id !== job.id));
                                }
                              }}
                              className="mt-1"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {job.title}
                                </h3>
                                {job.featured && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    Featured
                                  </Badge>
                                )}
                                <Badge variant={getStatusBadgeVariant(job.status)} className="flex items-center gap-1">
                                  <StatusIcon size={12} />
                                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  {job.location.city}, {job.location.state}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={14} />
                                  {job.jobType} • {job.workArrangement}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign size={14} />
                                  ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} {job.salary.period}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  Posted {performance.ageInDays} days ago
                                </div>
                              </div>

                              {/* Performance Metrics */}
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500">Applications</div>
                                  <div className="font-semibold flex items-center gap-1">
                                    {job.applications}
                                    <span className="text-xs text-gray-400">
                                      ({performance.applicationsPerDay.toFixed(1)}/day)
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Views</div>
                                  <div className="font-semibold">{job.views.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Conversion</div>
                                  <div className="font-semibold">{performance.conversionRate.toFixed(1)}%</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              className="flex items-center gap-1"
                            >
                              <Eye size={14} />
                              View
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/jobs/${job.id}/edit`)}
                              className="flex items-center gap-1"
                            >
                              <Edit size={14} />
                              Edit
                            </Button>

                            {job.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleJobAction(job.id, 'pause')}
                                className="flex items-center gap-1"
                              >
                                <Pause size={14} />
                                Pause
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleJobAction(job.id, 'activate')}
                                className="flex items-center gap-1"
                              >
                                <Play size={14} />
                                Activate
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyJobLink(job.id)}
                              className="flex items-center gap-1"
                            >
                              <Copy size={14} />
                              Copy Link
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleJobAction(job.id, 'delete')}
                              className="flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No matching jobs found' : 'No jobs posted yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search criteria or filters'
                    : 'Start by posting your first job to attract top talent'
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <Button onClick={() => navigate('/post-job')}>
                    <Plus size={16} className="mr-2" />
                    Post Your First Job
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default JobManagementPage;