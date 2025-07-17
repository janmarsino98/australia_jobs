import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

const useJobApplicationStore = create<JobApplicationState>()(
    persist(
        (set, get) => ({
            applications: [],

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
            },

            updateApplication: (id, updates) => {
                set((state) => ({
                    applications: state.applications.map(app =>
                        app.id === id
                            ? { ...app, ...updates, lastUpdated: Date.now() }
                            : app
                    )
                }));
            },

            removeApplication: (id) => {
                set((state) => ({
                    applications: state.applications.filter(app => app.id !== id)
                }));
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
        }),
        {
            name: 'job-applications',
        }
    )
);

export default useJobApplicationStore; 