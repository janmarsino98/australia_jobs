import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import httpClient from '../httpClient';
import { buildApiUrl } from '../config';

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | 'temporary';
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  skills: string[];
  achievements: string[];
  industry?: string;
  salary?: {
    amount?: number;
    currency?: string;
    period?: 'hourly' | 'weekly' | 'monthly' | 'yearly';
  };
  createdAt: string;
  updatedAt: string;
}

interface UserExperienceState {
  experiences: WorkExperience[];
  isLoading: boolean;
  error: string | null;
  
  // Local Actions
  addExperience: (experience: Omit<WorkExperience, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExperience: (id: string, updates: Partial<WorkExperience>) => void;
  removeExperience: (id: string) => void;
  reorderExperiences: (experiences: WorkExperience[]) => void;
  
  // Utility methods
  getExperienceById: (id: string) => WorkExperience | undefined;
  getCurrentExperiences: () => WorkExperience[];
  getTotalExperienceYears: () => number;
  getExperiencesByCompany: (company: string) => WorkExperience[];
  
  // API Actions
  fetchExperiences: () => Promise<void>;
  createExperience: (experience: Omit<WorkExperience, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WorkExperience>;
  updateExperienceInBackend: (id: string, updates: Partial<WorkExperience>) => Promise<WorkExperience>;
  deleteExperienceFromBackend: (id: string) => Promise<void>;
  clearError: () => void;
}

const useUserExperienceStore = create<UserExperienceState>()(
  persist(
    (set, get) => ({
      experiences: [],
      isLoading: false,
      error: null,

      addExperience: (experienceData) => {
        const newExperience: WorkExperience = {
          ...experienceData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          experiences: [...state.experiences, newExperience]
        }));
        
        // Create in backend
        get().createExperience(experienceData).catch(console.error);
      },

      updateExperience: (id, updates) => {
        set((state) => ({
          experiences: state.experiences.map(exp =>
            exp.id === id
              ? { ...exp, ...updates, updatedAt: new Date().toISOString() }
              : exp
          )
        }));
        
        // Update in backend
        get().updateExperienceInBackend(id, updates).catch(console.error);
      },

      removeExperience: (id) => {
        set((state) => ({
          experiences: state.experiences.filter(exp => exp.id !== id)
        }));
        
        // Delete from backend
        get().deleteExperienceFromBackend(id).catch(console.error);
      },

      reorderExperiences: (experiences) => {
        set({ experiences });
        // Could implement bulk update endpoint for reordering
      },

      getExperienceById: (id) => {
        return get().experiences.find(exp => exp.id === id);
      },

      getCurrentExperiences: () => {
        return get().experiences.filter(exp => exp.isCurrent);
      },

      getTotalExperienceYears: () => {
        const experiences = get().experiences;
        let totalMonths = 0;

        experiences.forEach(exp => {
          const startDate = new Date(exp.startDate);
          const endDate = exp.isCurrent ? new Date() : new Date(exp.endDate || new Date());
          
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
          
          totalMonths += diffMonths;
        });

        return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
      },

      getExperiencesByCompany: (company) => {
        return get().experiences.filter(exp => 
          exp.company.toLowerCase().includes(company.toLowerCase())
        );
      },

      // API methods
      fetchExperiences: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.get(buildApiUrl('/user/experience'));
          const experiences = response.data.experiences || [];
          set({ experiences, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch work experiences:', error);
          set({ 
            error: error.response?.data?.message || 'Failed to fetch work experiences',
            isLoading: false 
          });
        }
      },

      createExperience: async (experienceData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.post(buildApiUrl('/user/experience'), {
            ...experienceData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          const newExperience = response.data.experience;
          
          set((state) => ({
            experiences: state.experiences.map(exp => 
              exp.id === experienceData.id ? newExperience : exp
            ),
            isLoading: false
          }));
          
          return newExperience;
        } catch (error: any) {
          console.error('Failed to create work experience:', error);
          set({ 
            error: error.response?.data?.message || 'Failed to create work experience',
            isLoading: false 
          });
          throw error;
        }
      },

      updateExperienceInBackend: async (id, updates) => {
        try {
          const response = await httpClient.put(buildApiUrl(`/user/experience/${id}`), {
            ...updates,
            updatedAt: new Date().toISOString(),
          });
          const updatedExperience = response.data.experience;
          
          set((state) => ({
            experiences: state.experiences.map(exp => 
              exp.id === id ? updatedExperience : exp
            )
          }));
          
          return updatedExperience;
        } catch (error: any) {
          console.error('Failed to update work experience:', error);
          set({ error: error.response?.data?.message || 'Failed to update work experience' });
          throw error;
        }
      },

      deleteExperienceFromBackend: async (id) => {
        try {
          await httpClient.delete(buildApiUrl(`/user/experience/${id}`));
        } catch (error: any) {
          console.error('Failed to delete work experience:', error);
          set({ error: error.response?.data?.message || 'Failed to delete work experience' });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'user-experience',
      partialize: (state) => ({ 
        experiences: state.experiences 
      }),
    }
  )
);

export default useUserExperienceStore;