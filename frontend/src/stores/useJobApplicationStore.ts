import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import httpClient from '../httpClient';
import { buildApiUrl } from '../config';

export interface JobApplication {
    id: string;
    jobTitle: string;
    company: string;
    location: string;
    appliedDate: number;
    status: 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
    jobUrl?: string;
    salary?: {
        min?: number;
        max?: number;
        currency?: string;
    };
    notes?: string;
    followUpDate?: number;
    interviewDate?: number;
    lastUpdated: number;
}

interface JobApplicationState {
    applications: JobApplication[];
    isLoading: boolean;
    error: string | null;
    
    // Local actions
    addApplication: (application: Omit<JobApplication, 'id' | 'appliedDate' | 'lastUpdated'>) => void;
    updateApplicationStatus: (id: string, status: JobApplication['status'], notes?: string) => void;
    updateApplication: (id: string, updates: Partial<JobApplication>) => void;
    removeApplication: (id: string) => void;
    getApplicationsByStatus: (status: JobApplication['status']) => JobApplication[];
    getRecentApplications: (limit?: number) => JobApplication[];
    getApplicationStats: () => {
        total: number;
        applied: number;
        reviewing: number;
        interview: number;
        offer: number;
        rejected: number;
        withdrawn: number;
    };
    
    // API actions
    fetchApplications: () => Promise<void>;
    syncApplicationToBackend: (application: JobApplication) => Promise<void>;
    syncApplicationStatusToBackend: (id: string, status: JobApplication['status'], notes?: string) => Promise<void>;
    deleteApplicationFromBackend: (id: string) => Promise<void>;
    clearError: () => void;
}

const useJobApplicationStore = create<JobApplicationState>()(
    persist(
        (set, get) => ({
            applications: [],
            isLoading: false,
            error: null,

            addApplication: (applicationData) => {
                const newApplication: JobApplication = {
                    ...applicationData,
                    id: Date.now().toString(),
                    appliedDate: Date.now(),
                    lastUpdated: Date.now(),
                    status: 'applied',
                };

                set((state) => ({
                    applications: [newApplication, ...state.applications]
                }));
                
                // Sync to backend
                get().syncApplicationToBackend(newApplication).catch(console.error);
            },

            updateApplicationStatus: (id, status, notes) => {
                set((state) => ({
                    applications: state.applications.map(app =>
                        app.id === id
                            ? {
                                ...app,
                                status,
                                notes: notes || app.notes,
                                lastUpdated: Date.now()
                            }
                            : app
                    )
                }));
                
                // Sync to backend
                get().syncApplicationStatusToBackend(id, status, notes).catch(console.error);
            },

            updateApplication: (id, updates) => {
                set((state) => ({
                    applications: state.applications.map(app =>
                        app.id === id
                            ? { ...app, ...updates, lastUpdated: Date.now() }
                            : app
                    )
                }));
                
                // Sync to backend
                const updatedApp = get().applications.find(app => app.id === id);
                if (updatedApp) {
                    get().syncApplicationToBackend(updatedApp).catch(console.error);
                }
            },

            removeApplication: (id) => {
                set((state) => ({
                    applications: state.applications.filter(app => app.id !== id)
                }));
                
                // Delete from backend
                get().deleteApplicationFromBackend(id).catch(console.error);
            },

            getApplicationsByStatus: (status) => {
                return get().applications.filter(app => app.status === status);
            },

            getRecentApplications: (limit = 10) => {
                return get().applications
                    .sort((a, b) => b.lastUpdated - a.lastUpdated)
                    .slice(0, limit);
            },

            getApplicationStats: () => {
                const applications = get().applications;
                const stats = {
                    total: applications.length,
                    applied: 0,
                    reviewing: 0,
                    interview: 0,
                    offer: 0,
                    rejected: 0,
                    withdrawn: 0,
                };

                applications.forEach(app => {
                    stats[app.status]++;
                });

                return stats;
            },
            
            // API methods
            fetchApplications: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await httpClient.get(buildApiUrl('/applications'));
                    const applications = response.data.applications || [];
                    set({ applications, isLoading: false });
                } catch (error: any) {
                    console.error('Failed to fetch applications:', error);
                    set({ 
                        error: error.response?.data?.message || 'Failed to fetch applications',
                        isLoading: false 
                    });
                }
            },
            
            syncApplicationToBackend: async (application: JobApplication) => {
                try {
                    await httpClient.post(buildApiUrl('/applications'), {
                        ...application,
                        appliedDate: new Date(application.appliedDate).toISOString(),
                        lastUpdated: new Date(application.lastUpdated).toISOString(),
                        followUpDate: application.followUpDate ? new Date(application.followUpDate).toISOString() : undefined,
                        interviewDate: application.interviewDate ? new Date(application.interviewDate).toISOString() : undefined,
                    });
                } catch (error: any) {
                    console.error('Failed to sync application to backend:', error);
                    set({ error: error.response?.data?.message || 'Failed to sync application' });
                }
            },
            
            syncApplicationStatusToBackend: async (id: string, status: JobApplication['status'], notes?: string) => {
                try {
                    await httpClient.put(buildApiUrl(`/applications/${id}`), {
                        status,
                        notes,
                        lastUpdated: new Date().toISOString()
                    });
                } catch (error: any) {
                    console.error('Failed to sync application status:', error);
                    set({ error: error.response?.data?.message || 'Failed to update application status' });
                }
            },
            
            deleteApplicationFromBackend: async (id: string) => {
                try {
                    await httpClient.delete(buildApiUrl(`/applications/${id}`));
                } catch (error: any) {
                    console.error('Failed to delete application from backend:', error);
                    set({ error: error.response?.data?.message || 'Failed to delete application' });
                }
            },
            
            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'job-applications',
            partialize: (state) => ({ 
                applications: state.applications 
            }),
        }
    )
);

export default useJobApplicationStore; 