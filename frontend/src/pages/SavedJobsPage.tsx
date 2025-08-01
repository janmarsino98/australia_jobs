import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Trash2, 
  Download, 
  ExternalLink,
  StickyNote,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSavedJobsStore, { SavedJob } from '../stores/useSavedJobsStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import JobApplicationModal from '../components/molecules/JobApplicationModal';

const SavedJobsPage = () => {
  const navigate = useNavigate();
  const { 
    savedJobs, 
    filteredJobs, 
    searchQuery, 
    setSearchQuery, 
    removeJob, 
    updateJobStatus,
    updateJobNotes,
    exportSavedJobs
  } = useSavedJobsStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');
  
  // Filter jobs based on search query and status
  const displayJobs = filteredJobs.filter(job => {
    if (statusFilter === 'all') return true;
    return job.status === statusFilter;
  });

  // Update filtered jobs when search query changes
  useEffect(() => {
    // The store handles filtering automatically
  }, [searchQuery, savedJobs]);

  const handleRemoveJob = (jobId: string) => {
    if (window.confirm('Are you sure you want to remove this job from your saved list?')) {
      removeJob(jobId);
    }
  };

  const handleQuickApply = (job: SavedJob) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleStatusChange = (jobId: string, status: SavedJob['status']) => {
    updateJobStatus(jobId, status);
  };

  const handleExportJobs = () => {
    const jsonData = exportSavedJobs();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-jobs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewJob = (job: SavedJob) => {
    navigate(`/job-details/${job.slug || job._id}`);
  };

  const startEditingNotes = (job: SavedJob) => {
    setEditingNotes(job._id);
    setNotesInput(job.notes || '');
  };

  const saveNotes = (jobId: string) => {
    updateJobNotes(jobId, notesInput);
    setEditingNotes(null);
    setNotesInput('');
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesInput('');
  };

  const formatSalary = (amount: string | undefined, period: string | undefined) => {
    if (!amount) return 'Salary not specified';
    const formattedAmount = amount.replace(/[^\d.,]/g, '');
    return `$${formattedAmount}${period ? `/${period}` : ''}`;
  };

  const getStatusColor = (status: SavedJob['status']) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: SavedJob['status']) => {
    switch (status) {
      case 'applied': return 'Applied';
      case 'interview': return 'Interview';
      case 'rejected': return 'Rejected';
      default: return 'Saved';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
          <p className="text-gray-600">
            {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search saved jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="saved">Saved</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExportJobs} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Jobs List */}
        {displayJobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {savedJobs.length === 0 ? 'No saved jobs yet' : 'No jobs match your filters'}
              </h3>
              <p className="text-gray-600 mb-4">
                {savedJobs.length === 0 
                  ? 'Start browsing jobs and save the ones that interest you!' 
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {savedJobs.length === 0 && (
                <Button onClick={() => navigate('/jobs')}>
                  Browse Jobs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayJobs.map((job) => (
              <Card key={job._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <Badge className={getStatusColor(job.status)}>
                          {getStatusLabel(job.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.firm}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatSalary(job.remuneration_amount, job.remuneration_period)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Saved {new Date(job.savedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewJob(job)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveJob(job._id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Job Type and Description Preview */}
                    <div>
                      <Badge className="mb-2">{job.jobtype}</Badge>
                      {job.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Notes Section */}
                    <div>
                      {editingNotes === job._id ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Add your notes about this job..."
                            className="w-full p-2 border rounded-md text-sm"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveNotes(job._id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditingNotes}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <StickyNote className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            {job.notes ? (
                              <p className="text-sm text-gray-700">{job.notes}</p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No notes added</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingNotes(job)}
                            className="text-xs"
                          >
                            {job.notes ? 'Edit' : 'Add Note'}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Select 
                          value={job.status || 'saved'} 
                          onValueChange={(value) => handleStatusChange(job._id, value as SavedJob['status'])}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saved">Saved</SelectItem>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {job.status !== 'applied' && (
                        <Button
                          onClick={() => handleQuickApply(job)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Quick Apply
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedJob && (
        <JobApplicationModal
          job={{
            id: selectedJob._id,
            title: selectedJob.title,
            firm: selectedJob.firm,
            location: selectedJob.location,
            jobtype: selectedJob.jobtype
          }}
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
};

export default SavedJobsPage;