import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchHistoryItem {
    id: string;
    query: string;
    location?: string;
    timestamp: number;
    resultsCount?: number;
}

interface SearchHistoryState {
    searches: SearchHistoryItem[];
    addSearch: (search: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => void;
    removeSearch: (id: string) => void;
    clearHistory: () => void;
    getRecentSearches: (limit?: number) => SearchHistoryItem[];
    getPopularSearches: () => string[];
}

const useSearchHistoryStore = create<SearchHistoryState>()(
    persist(
        (set, get) => ({
            searches: [],

            addSearch: (search) => {
                const newSearch: SearchHistoryItem = {
                    ...search,
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                };

                set((state) => ({
                    searches: [newSearch, ...state.searches.slice(0, 49)] // Keep only last 50 searches
                }));
            },

            removeSearch: (id) => {
                set((state) => ({
                    searches: state.searches.filter(search => search.id !== id)
                }));
            },

            clearHistory: () => {
                set({ searches: [] });
            },

            getRecentSearches: (limit = 10) => {
                return get().searches
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit);
            },

            getPopularSearches: () => {
                const searches = get().searches;
                const queryCount: Record<string, number> = {};

                searches.forEach(search => {
                    if (search.query) {
                        queryCount[search.query] = (queryCount[search.query] || 0) + 1;
                    }
                });

                return Object.entries(queryCount)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([query]) => query);
            },
        }),
        {
            name: 'search-history',
        }
    )
);

export default useSearchHistoryStore; 