import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import httpClient from '../httpClient';
import { buildApiUrl } from '../config';

export interface UserPreferences {
  id?: string;
  userId?: string;
  jobPreferences: {
    preferredJobTypes: string[];
    preferredLocations: string[];
    preferredSalaryRange: {
      min?: number;
      max?: number;
      currency?: string;
    };
    preferredWorkArrangement: 'remote' | 'hybrid' | 'onsite' | 'flexible';
    preferredIndustries: string[];
    experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'executive';
    availabilityDate?: string;
    willRelocate: boolean;
    requiresSponsorship: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    jobAlerts: boolean;
    applicationUpdates: boolean;
    marketingEmails: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'recruiters-only';
    allowContactFromRecruiters: boolean;
    showSalaryExpectations: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface UserPreferencesState {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPreferences: (preferences: UserPreferences) => void;
  updateJobPreferences: (jobPrefs: Partial<UserPreferences['jobPreferences']>) => void;
  updateNotificationPreferences: (notifPrefs: Partial<UserPreferences['notifications']>) => void;
  updatePrivacyPreferences: (privacyPrefs: Partial<UserPreferences['privacy']>) => void;
  
  // API Actions
  fetchPreferences: () => Promise<void>;
  savePreferences: (preferences: UserPreferences) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  clearError: () => void;
}

const defaultPreferences: UserPreferences = {
  jobPreferences: {
    preferredJobTypes: [],
    preferredLocations: [],
    preferredSalaryRange: {
      currency: 'AUD'
    },
    preferredWorkArrangement: 'flexible',
    preferredIndustries: [],
    experienceLevel: 'mid',
    willRelocate: false,
    requiresSponsorship: false,
  },
  notifications: {
    emailNotifications: true,
    jobAlerts: true,
    applicationUpdates: true,
    marketingEmails: false,
    frequency: 'weekly',
  },
  privacy: {
    profileVisibility: 'public',
    allowContactFromRecruiters: true,
    showSalaryExpectations: false,
  },
};

const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: null,
      isLoading: false,
      error: null,

      setPreferences: (preferences) => {
        set({ preferences });
      },

      updateJobPreferences: (jobPrefs) => {
        const currentPrefs = get().preferences || defaultPreferences;
        const updatedPrefs = {
          ...currentPrefs,
          jobPreferences: {
            ...currentPrefs.jobPreferences,
            ...jobPrefs,
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updatedPrefs });
        
        // Sync to backend
        get().updatePreferences(updatedPrefs).catch(console.error);
      },

      updateNotificationPreferences: (notifPrefs) => {
        const currentPrefs = get().preferences || defaultPreferences;
        const updatedPrefs = {
          ...currentPrefs,
          notifications: {
            ...currentPrefs.notifications,
            ...notifPrefs,
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updatedPrefs });
        
        // Sync to backend
        get().updatePreferences(updatedPrefs).catch(console.error);
      },

      updatePrivacyPreferences: (privacyPrefs) => {
        const currentPrefs = get().preferences || defaultPreferences;
        const updatedPrefs = {
          ...currentPrefs,
          privacy: {
            ...currentPrefs.privacy,
            ...privacyPrefs,
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updatedPrefs });
        
        // Sync to backend
        get().updatePreferences(updatedPrefs).catch(console.error);
      },

      // API methods
      fetchPreferences: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.get(buildApiUrl('/user/preferences'));
          const preferences = response.data.preferences || defaultPreferences;
          set({ preferences, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch user preferences:', error);
          // If preferences don't exist, create default ones
          if (error.response?.status === 404) {
            set({ preferences: defaultPreferences, isLoading: false });
            get().savePreferences(defaultPreferences).catch(console.error);
          } else {
            set({ 
              error: error.response?.data?.message || 'Failed to fetch preferences',
              isLoading: false 
            });
          }
        }
      },

      savePreferences: async (preferences: UserPreferences) => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.post(buildApiUrl('/user/preferences'), {
            ...preferences,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          const savedPrefs = response.data.preferences;
          set({ preferences: savedPrefs, isLoading: false });
        } catch (error: any) {
          console.error('Failed to save preferences:', error);
          set({ 
            error: error.response?.data?.message || 'Failed to save preferences',
            isLoading: false 
          });
        }
      },

      updatePreferences: async (updates: Partial<UserPreferences>) => {
        try {
          const response = await httpClient.put(buildApiUrl('/user/preferences'), {
            ...updates,
            updatedAt: new Date().toISOString(),
          });
          const updatedPrefs = response.data.preferences;
          set({ preferences: updatedPrefs });
        } catch (error: any) {
          console.error('Failed to update preferences:', error);
          set({ error: error.response?.data?.message || 'Failed to update preferences' });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'user-preferences',
      partialize: (state) => ({ 
        preferences: state.preferences 
      }),
    }
  )
);

export default useUserPreferencesStore;