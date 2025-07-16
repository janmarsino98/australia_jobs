import { create } from 'zustand';
import { FormState, FormField } from '../types/store';

const useFormStore = create<FormState>()((set) => ({
    fields: {},
    isValid: false,
    isSubmitting: false,

    setField: (name: string, value: string) => {
        set((state) => ({
            fields: {
                ...state.fields,
                [name]: {
                    ...state.fields[name],
                    value,
                    touched: true,
                },
            },
        }));
    },

    setError: (name: string, error: string | null) => {
        set((state) => ({
            fields: {
                ...state.fields,
                [name]: {
                    ...state.fields[name],
                    error,
                },
            },
        }));
    },

    setTouched: (name: string, touched: boolean) => {
        set((state) => ({
            fields: {
                ...state.fields,
                [name]: {
                    ...state.fields[name],
                    touched,
                },
            },
        }));
    },

    resetForm: () => {
        set({
            fields: {},
            isValid: false,
            isSubmitting: false,
        });
    },
}));

export default useFormStore; 