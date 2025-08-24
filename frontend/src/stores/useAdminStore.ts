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

export interface DatabaseSummary {
  users_by_role: Record<string, number>;
  total_users: number;
  job_applications: number;
  saved_jobs: number;
  user_preferences: number;
  user_experience: number;
  user_education: number;
  resume_metadata: number;
  gridfs_files: number;
}

export interface DatabaseOperationResult {
  success: boolean;
  message: string;
  deleted_collections: Record<string, number>;
  total_deleted: number;
  timestamp: string;
}

interface AdminState {
  users: AdminUser[];
  jobs: AdminJob[];
  systemStats: SystemStats | null;
  databaseSummary: DatabaseSummary | null;
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
  
  // Database Management
  fetchDatabaseSummary: () => Promise<void>;
  clearAllUsers: () => Promise<DatabaseOperationResult>;
  clearSpecificUser: (userId: string) => Promise<DatabaseOperationResult>;
  
  // Local state management
  setSelectedUser: (user: AdminUser | null) => void;
  setSelectedJob: (job: AdminJob | null) => void;
  clearError: () => void;
}

const useAdminStore = create<AdminState>()((set, _get) => ({
  users: [],
  jobs: [],
  systemStats: null,
  databaseSummary: null,
  selectedUser: null,
  selectedJob: null,
  isLoading: false,
  error: null,

  // User management methods
  fetchUsers: async (page = 1, limit = 50, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.get(buildApiUrl('/admin/users-list'), {
        params: { page, limit, ...filters }
      });
      const rawUsers = response.data.users || [];
      // Map backend fields to frontend interface
      const users = rawUsers.map((user: any) => ({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        isActive: user.is_active !== false,
        emailVerified: user.email_verified || false,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }));
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

  // Database management methods
  fetchDatabaseSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.get(buildApiUrl('/admin/users-summary'));
      const summary = response.data.summary;
      set({ databaseSummary: summary, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch database summary:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch database summary',
        isLoading: false 
      });
    }
  },

  clearAllUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.post(buildApiUrl('/admin/clear-all-users'));
      const result: DatabaseOperationResult = response.data;
      
      // Clear local state since all users are deleted
      set({ 
        users: [],
        databaseSummary: null,
        selectedUser: null,
        isLoading: false 
      });
      
      return result;
    } catch (error: any) {
      console.error('Failed to clear all users:', error);
      const errorMessage = error.response?.data?.message || 'Failed to clear all users';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  clearSpecificUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.post(buildApiUrl(`/admin/clear-user/${userId}`));
      const result: DatabaseOperationResult = response.data;
      
      // Remove user from local state
      set((state) => ({
        users: state.users.filter(user => user.id !== userId),
        selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
        isLoading: false
      }));
      
      return result;
    } catch (error: any) {
      console.error('Failed to clear specific user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to clear specific user';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
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