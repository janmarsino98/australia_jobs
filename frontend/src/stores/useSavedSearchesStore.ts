import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedSearch {
    id: string;
    name: string;
    filters: {
        title?: string;
        location?: string;
        categories?: string[];
        salary?: {
            min?: number;
            max?: number;
        };
        jobType?: string;
        experienceLevel?: string;
        datePosted?: string;
        workArrangement?: string;
    };
    createdAt: number;
    lastUsed?: number;
    alertsEnabled?: boolean;
}

interface SavedSearchesState {
    savedSearches: SavedSearch[];
    addSavedSearch: (search: Omit<SavedSearch, 'id' | 'createdAt'>) => void;
    removeSavedSearch: (id: string) => void;
    updateSavedSearch: (id: string, updates: Partial<SavedSearch>) => void;
    markAsUsed: (id: string) => void;
    getSavedSearches: () => SavedSearch[];
    toggleAlerts: (id: string) => void;
}

const useSavedSearchesStore = create<SavedSearchesState>()(
    persist(
        (set, get) => ({
            savedSearches: [],

            addSavedSearch: (search) => {
                const newSearch: SavedSearch = {
                    ...search,
                    id: Date.now().toString(),
                    createdAt: Date.now(),
                };

                set((state) => ({
                    savedSearches: [newSearch, ...state.savedSearches.slice(0, 19)] // Keep only last 20 saved searches
                }));
            },

            removeSavedSearch: (id) => {
                set((state) => ({
                    savedSearches: state.savedSearches.filter(search => search.id !== id)
                }));
            },

            updateSavedSearch: (id, updates) => {
                set((state) => ({
                    savedSearches: state.savedSearches.map(search =>
                        search.id === id ? { ...search, ...updates } : search
                    )
                }));
            },

            markAsUsed: (id) => {
                set((state) => ({
                    savedSearches: state.savedSearches.map(search =>
                        search.id === id ? { ...search, lastUsed: Date.now() } : search
                    )
                }));
            },

            getSavedSearches: () => {
                return get().savedSearches.sort((a, b) => b.createdAt - a.createdAt);
            },

            toggleAlerts: (id) => {
                set((state) => ({
                    savedSearches: state.savedSearches.map(search =>
                        search.id === id
                            ? { ...search, alertsEnabled: !search.alertsEnabled }
                            : search
                    )
                }));
            },
        }),
        {
            name: 'saved-searches',
        }
    )
);

export default useSavedSearchesStore; 