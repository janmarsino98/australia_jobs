import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppPreferencesState, AppPreferences } from '../types/store';

const initialPreferences: AppPreferences = {
    theme: 'light',
    emailNotifications: true,
    jobAlerts: true,
    language: 'en',
};

const useAppPreferencesStore = create<AppPreferencesState>()(
    persist(
        (set) => ({
            preferences: initialPreferences,

            setPreference: (key, value) => {
                set((state) => ({
                    preferences: {
                        ...state.preferences,
                        [key]: value,
                    },
                }));
            },

            resetPreferences: () => {
                set({ preferences: initialPreferences });
            },
        }),
        {
            name: 'app-preferences', // unique name for localStorage
        }
    )
);

export default useAppPreferencesStore; 