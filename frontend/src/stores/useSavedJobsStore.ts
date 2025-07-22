import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import httpClient from '../httpClient';
import { buildApiUrl } from '../config';

export interface SavedJob {
  _id: string;
  title: string;
  firm: string;
  location: string;
  jobtype: string;
  remuneration_amount?: string;
  remuneration_period?: string;
  description?: string;
  posted?: string;
  created_at?: string;
  slug: string;
  
  // Saved job specific fields
  savedAt: string;
  notes?: string;
  applied?: boolean;
  status?: 'saved' | 'applied' | 'interview' | 'rejected';
}

interface SavedJobsState {
  savedJobs: SavedJob[];
  searchQuery: string;
  filteredJobs: SavedJob[];
  isLoading: boolean;
  error: string | null;
  
  // Local Actions
  saveJob: (job: Omit<SavedJob, 'savedAt' | 'status'>) => void;
  removeJob: (jobId: string) => void;
  updateJobStatus: (jobId: string, status: SavedJob['status']) => void;
  updateJobNotes: (jobId: string, notes: string) => void;
  setSearchQuery: (query: string) => void;
  getJobById: (jobId: string) => SavedJob | undefined;
  clearAllSavedJobs: () => void;
  exportSavedJobs: () => string;
  
  // API Actions
  fetchSavedJobs: () => Promise<void>;
  syncSavedJobToBackend: (job: SavedJob) => Promise<void>;
  removeSavedJobFromBackend: (jobId: string) => Promise<void>;
  updateSavedJobInBackend: (jobId: string, updates: Partial<SavedJob>) => Promise<void>;
  clearError: () => void;
}

const useSavedJobsStore = create<SavedJobsState>()(
  persist(
    (set, get) => ({
      savedJobs: [],
      searchQuery: '',
      filteredJobs: [],
      isLoading: false,
      error: null,

      saveJob: (job) => {
        const savedJob: SavedJob = {
          ...job,
          savedAt: new Date().toISOString(),
          status: 'saved'
        };
        
        set((state) => {
          const exists = state.savedJobs.find(j => j._id === job._id);
          if (exists) return state; // Don't add duplicates
          
          const newSavedJobs = [...state.savedJobs, savedJob];
          return {
            savedJobs: newSavedJobs,
            filteredJobs: get().searchQuery ? 
              newSavedJobs.filter(j => 
                j.title.toLowerCase().includes(get().searchQuery.toLowerCase()) ||
                j.firm.toLowerCase().includes(get().searchQuery.toLowerCase()) ||
                j.location.toLowerCase().includes(get().searchQuery.toLowerCase())
              ) : newSavedJobs
          };
        });
        
        // Sync to backend
        get().syncSavedJobToBackend(savedJob).catch(console.error);
      },

      removeJob: (jobId) => {
        set((state) => {
          const newSavedJobs = state.savedJobs.filter(job => job._id !== jobId);
          return {
            savedJobs: newSavedJobs,
            filteredJobs: state.searchQuery ? 
              newSavedJobs.filter(j => 
                j.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                j.firm.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                j.location.toLowerCase().includes(state.searchQuery.toLowerCase())
              ) : newSavedJobs
          };
        });
        
        // Remove from backend
        get().removeSavedJobFromBackend(jobId).catch(console.error);
      },

      updateJobStatus: (jobId, status) => {
        set((state) => ({
          savedJobs: state.savedJobs.map(job =>
            job._id === jobId ? { ...job, status } : job
          ),
          filteredJobs: state.filteredJobs.map(job =>
            job._id === jobId ? { ...job, status } : job
          )
        }));
        
        // Update in backend
        get().updateSavedJobInBackend(jobId, { status }).catch(console.error);
      },

      updateJobNotes: (jobId, notes) => {
        set((state) => ({
          savedJobs: state.savedJobs.map(job =>
            job._id === jobId ? { ...job, notes } : job
          ),
          filteredJobs: state.filteredJobs.map(job =>
            job._id === jobId ? { ...job, notes } : job
          )
        }));
        
        // Update in backend
        get().updateSavedJobInBackend(jobId, { notes }).catch(console.error);
      },

      setSearchQuery: (query) => {
        set((state) => ({
          searchQuery: query,
          filteredJobs: query ? 
            state.savedJobs.filter(job => 
              job.title.toLowerCase().includes(query.toLowerCase()) ||
              job.firm.toLowerCase().includes(query.toLowerCase()) ||
              job.location.toLowerCase().includes(query.toLowerCase()) ||
              job.jobtype.toLowerCase().includes(query.toLowerCase())
            ) : state.savedJobs
        }));
      },

      getJobById: (jobId) => {
        return get().savedJobs.find(job => job._id === jobId);
      },

      clearAllSavedJobs: () => {
        set({
          savedJobs: [],
          filteredJobs: [],
          searchQuery: ''
        });
      },

      exportSavedJobs: () => {
        const jobs = get().savedJobs;
        const exportData = jobs.map(job => ({
          title: job.title,
          company: job.firm,
          location: job.location,
          jobType: job.jobtype,
          salary: job.remuneration_amount && job.remuneration_period ? 
            `${job.remuneration_amount} ${job.remuneration_period}` : '',
          savedDate: new Date(job.savedAt).toLocaleDateString(),
          status: job.status || 'saved',
          notes: job.notes || ''
        }));
        
        return JSON.stringify(exportData, null, 2);
      },
      
      // API methods
      fetchSavedJobs: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.get(buildApiUrl('/saved-jobs'));
          const savedJobs = response.data.savedJobs || [];
          set({ 
            savedJobs, 
            filteredJobs: savedJobs,
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Failed to fetch saved jobs:', error);
          set({ 
            error: error.response?.data?.message || 'Failed to fetch saved jobs',
            isLoading: false 
          });
        }
      },
      
      syncSavedJobToBackend: async (job: SavedJob) => {
        try {
          await httpClient.post(buildApiUrl('/saved-jobs'), {
            jobId: job._id,
            jobData: {
              title: job.title,
              firm: job.firm,
              location: job.location,
              jobtype: job.jobtype,
              remuneration_amount: job.remuneration_amount,
              remuneration_period: job.remuneration_period,
              description: job.description,
              posted: job.posted,
              slug: job.slug
            },
            notes: job.notes,
            status: job.status
          });
        } catch (error: any) {
          console.error('Failed to sync saved job:', error);
          set({ error: error.response?.data?.message || 'Failed to save job' });
        }
      },
      
      removeSavedJobFromBackend: async (jobId: string) => {
        try {
          await httpClient.delete(buildApiUrl(`/saved-jobs/${jobId}`));
        } catch (error: any) {
          console.error('Failed to remove saved job from backend:', error);
          set({ error: error.response?.data?.message || 'Failed to remove saved job' });
        }
      },
      
      updateSavedJobInBackend: async (jobId: string, updates: Partial<SavedJob>) => {
        try {
          await httpClient.put(buildApiUrl(`/saved-jobs/${jobId}`), updates);
        } catch (error: any) {
          console.error('Failed to update saved job:', error);
          set({ error: error.response?.data?.message || 'Failed to update saved job' });
        }
      },
      
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'saved-jobs-store',
      version: 1,
      partialize: (state) => ({ 
        savedJobs: state.savedJobs,
        searchQuery: state.searchQuery 
      }),
    }
  )
);

export default useSavedJobsStore;