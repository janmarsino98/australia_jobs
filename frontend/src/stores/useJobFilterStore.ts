import { create } from 'zustand';
import { JobFilterState, JobFilters } from '../types/store';

const initialFilters: JobFilters = {
    query: '',
    location: '',
    category: '',
    type: '',
    salary: {
        min: 0,
        max: 500000,
    },
};

const useJobFilterStore = create<JobFilterState>()((set) => ({
    filters: initialFilters,

    setFilter: (key, value) => {
        set((state) => ({
            filters: {
                ...state.filters,
                [key]: value,
            },
        }));
    },

    resetFilters: () => {
        set({ filters: initialFilters });
    },
}));

export default useJobFilterStore; 