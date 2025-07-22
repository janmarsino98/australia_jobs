import { create } from 'zustand';
import httpClient from '../httpClient';
import { buildApiUrl } from '../config';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'user';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  profile?: {
    phone?: string;
    location?: string;
    profilePicture?: string;
  };
  stats?: {
    totalApplications: number;
    totalSavedJobs: number;
    lastActivity: string;
  };
}

export interface AdminJob {
  id: string;
  title: string;
  company: string;
  location: string;
  status: 'active' | 'inactive' | 'expired' | 'draft';
  postedBy: string;
  postedAt: string;
  applicationsCount: number;
  viewsCount: number;
  isPromoted: boolean;
  expiresAt?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  activeUsers: number;
  newUsersToday: number;
  newJobsToday: number;
  popularJobTypes: Array<{ type: string; count: number }>;
  popularLocations: Array<{ location: string; count: number }>;
  conversionRate: number;
}

interface AdminState {
  users: AdminUser[];
  jobs: AdminJob[];
  systemStats: SystemStats | null;
  selectedUser: AdminUser | null;
  selectedJob: AdminJob | null;
  isLoading: boolean;
  error: string | null;
  
  // User management
  fetchUsers: (page?: number, limit?: number, filters?: Record<string, any>) => Promise<void>;
  getUserById: (id: string) => Promise<AdminUser | null>;
  updateUser: (id: string, updates: Partial<AdminUser>) => Promise<void>;
  deactivateUser: (id: string) => Promise<void>;
  activateUser: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Job management
  fetchJobs: (page?: number, limit?: number, filters?: Record<string, any>) => Promise<void>;
  getJobById: (id: string) => Promise<AdminJob | null>;
  updateJob: (id: string, updates: Partial<AdminJob>) => Promise<void>;
  approveJob: (id: string) => Promise<void>;
  rejectJob: (id: string) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  promoteJob: (id: string, duration?: number) => Promise<void>;
  
  // Analytics & Stats
  fetchSystemStats: (timeRange?: 'day' | 'week' | 'month' | 'year') => Promise<void>;
  exportUserData: (format: 'csv' | 'json') => Promise<string>;
  exportJobData: (format: 'csv' | 'json') => Promise<string>;
  
  // Local state management
  setSelectedUser: (user: AdminUser | null) => void;
  setSelectedJob: (job: AdminJob | null) => void;
  clearError: () => void;
}

const useAdminStore = create<AdminState>()((set, get) => ({
  users: [],
  jobs: [],
  systemStats: null,
  selectedUser: null,
  selectedJob: null,
  isLoading: false,
  error: null,

  // User management methods
  fetchUsers: async (page = 1, limit = 50, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.get(buildApiUrl('/admin/users'), {
        params: { page, limit, ...filters }
      });
      const users = response.data.users || [];
      set({ users, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch users',
        isLoading: false 
      });
    }
  },

  getUserById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.get(buildApiUrl(`/admin/users/${id}`));
      const user = response.data.user;
      set({ selectedUser: user, isLoading: false });
      return user;
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch user',
        isLoading: false 
      });
      return null;
    }
  },

  updateUser: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.put(buildApiUrl(`/admin/users/${id}`), updates);
      const updatedUser = response.data.user;
      
      set((state) => ({
        users: state.users.map(user => user.id === id ? updatedUser : user),
        selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Failed to update user:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to update user',
        isLoading: false 
      });
    }
  },

  deactivateUser: async (id) => {
    try {
      await httpClient.put(buildApiUrl(`/admin/users/${id}/deactivate`));
      set((state) => ({
        users: state.users.map(user => 
          user.id === id ? { ...user, isActive: false } : user
        )
      }));
    } catch (error: any) {
      console.error('Failed to deactivate user:', error);
      set({ error: error.response?.data?.message || 'Failed to deactivate user' });
    }
  },

  activateUser: async (id) => {
    try {
      await httpClient.put(buildApiUrl(`/admin/users/${id}/activate`));
      set((state) => ({
        users: state.users.map(user => 
          user.id === id ? { ...user, isActive: true } : user
        )
      }));
    } catch (error: any) {
      console.error('Failed to activate user:', error);
      set({ error: error.response?.data?.message || 'Failed to activate user' });
    }
  },

  deleteUser: async (id) => {
    try {
      await httpClient.delete(buildApiUrl(`/admin/users/${id}`));
      set((state) => ({
        users: state.users.filter(user => user.id !== id),
        selectedUser: state.selectedUser?.id === id ? null : state.selectedUser
      }));
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      set({ error: error.response?.data?.message || 'Failed to delete user' });
    }
  },

  // Job management methods
  fetchJobs: async (page = 1, limit = 50, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.get(buildApiUrl('/admin/jobs'), {
        params: { page, limit, ...filters }
      });
      const jobs = response.data.jobs || [];
      set({ jobs, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch jobs',
        isLoading: false 
      });
    }
  },

  getJobById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.get(buildApiUrl(`/admin/jobs/${id}`));
      const job = response.data.job;
      set({ selectedJob: job, isLoading: false });
      return job;
    } catch (error: any) {
      console.error('Failed to fetch job:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch job',
        isLoading: false 
      });
      return null;
    }
  },

  updateJob: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.put(buildApiUrl(`/admin/jobs/${id}`), updates);
      const updatedJob = response.data.job;
      
      set((state) => ({
        jobs: state.jobs.map(job => job.id === id ? updatedJob : job),
        selectedJob: state.selectedJob?.id === id ? updatedJob : state.selectedJob,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Failed to update job:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to update job',
        isLoading: false 
      });
    }
  },

  approveJob: async (id) => {
    try {
      await httpClient.put(buildApiUrl(`/admin/jobs/${id}/approve`));
      set((state) => ({
        jobs: state.jobs.map(job => 
          job.id === id ? { ...job, status: 'active' } : job
        )
      }));
    } catch (error: any) {
      console.error('Failed to approve job:', error);
      set({ error: error.response?.data?.message || 'Failed to approve job' });
    }
  },

  rejectJob: async (id) => {
    try {
      await httpClient.put(buildApiUrl(`/admin/jobs/${id}/reject`));
      set((state) => ({
        jobs: state.jobs.map(job => 
          job.id === id ? { ...job, status: 'inactive' } : job
        )
      }));
    } catch (error: any) {
      console.error('Failed to reject job:', error);
      set({ error: error.response?.data?.message || 'Failed to reject job' });
    }
  },

  deleteJob: async (id) => {
    try {
      await httpClient.delete(buildApiUrl(`/admin/jobs/${id}`));
      set((state) => ({
        jobs: state.jobs.filter(job => job.id !== id),
        selectedJob: state.selectedJob?.id === id ? null : state.selectedJob
      }));
    } catch (error: any) {
      console.error('Failed to delete job:', error);
      set({ error: error.response?.data?.message || 'Failed to delete job' });
    }
  },

  promoteJob: async (id, duration = 30) => {
    try {
      await httpClient.put(buildApiUrl(`/admin/jobs/${id}/promote`), { duration });
      set((state) => ({
        jobs: state.jobs.map(job => 
          job.id === id ? { ...job, isPromoted: true } : job
        )
      }));
    } catch (error: any) {
      console.error('Failed to promote job:', error);
      set({ error: error.response?.data?.message || 'Failed to promote job' });
    }
  },

  // Analytics methods
  fetchSystemStats: async (timeRange = 'month') => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.get(buildApiUrl('/admin/stats'), {
        params: { timeRange }
      });
      const stats = response.data.stats;
      set({ systemStats: stats, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch system stats:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch system stats',
        isLoading: false 
      });
    }
  },

  exportUserData: async (format) => {
    try {
      const response = await httpClient.get(buildApiUrl('/admin/export/users'), {
        params: { format },
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        return URL.createObjectURL(blob);
      } else {
        return JSON.stringify(response.data, null, 2);
      }
    } catch (error: any) {
      console.error('Failed to export user data:', error);
      set({ error: error.response?.data?.message || 'Failed to export user data' });
      throw error;
    }
  },

  exportJobData: async (format) => {
    try {
      const response = await httpClient.get(buildApiUrl('/admin/export/jobs'), {
        params: { format },
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        return URL.createObjectURL(blob);
      } else {
        return JSON.stringify(response.data, null, 2);
      }
    } catch (error: any) {
      console.error('Failed to export job data:', error);
      set({ error: error.response?.data?.message || 'Failed to export job data' });
      throw error;
    }
  },

  // Local state management
  setSelectedUser: (user) => {
    set({ selectedUser: user });
  },

  setSelectedJob: (job) => {
    set({ selectedJob: job });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAdminStore;