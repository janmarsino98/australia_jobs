// Authentication Types
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'jobseeker' | 'employer';
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
}

// Job Search Filter Types
export interface JobFilters {
    query: string;
    location: string;
    category: string;
    type: string;
    salary: {
        min: number;
        max: number;
    };
}

export interface JobFilterState {
    filters: JobFilters;
    setFilter: <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => void;
    resetFilters: () => void;
}

// Application Preferences Types
export interface AppPreferences {
    theme: 'light' | 'dark';
    emailNotifications: boolean;
    jobAlerts: boolean;
    language: string;
}

export interface AppPreferencesState {
    preferences: AppPreferences;
    setPreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
    resetPreferences: () => void;
}

// Form State Types
export interface FormField {
    value: string;
    error: string | null;
    touched: boolean;
}

export interface FormState {
    fields: Record<string, FormField>;
    setField: (name: string, value: string) => void;
    setError: (name: string, error: string | null) => void;
    setTouched: (name: string, touched: boolean) => void;
    resetForm: () => void;
    isValid: boolean;
    isSubmitting: boolean;
} 