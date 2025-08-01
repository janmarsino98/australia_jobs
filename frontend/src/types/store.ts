// Authentication Types
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'jobseeker' | 'employer' | 'admin';
    email_verified?: boolean;
    phone?: string;
    bio?: string;
    skills?: string[];
    experience?: string;
    education?: string;
    location?: {
        city?: string;
        state?: string;
    };
    profileImage?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    resumeUploaded?: boolean;
    preferences?: {
        jobTypes?: string[];
        salaryRange?: {
            min?: number;
            max?: number;
        };
        workArrangement?: string;
    };
    // New fields from backend
    profile?: {
        first_name?: string;
        last_name?: string;
        display_name?: string;
        profile_picture?: string;
        bio?: string;
        phone?: string;
        location?: string;
        website?: string;
        linkedin_profile?: string;
    };
    oauth_accounts?: {
        [provider: string]: {
            connected_at?: string;
            last_used?: string;
            provider_id?: string;
        };
    };
    created_at?: string;
    last_login?: string;
    is_active?: boolean;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    refreshTokenTimeout: NodeJS.Timeout | null;
    isAuthenticated: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
    setAuthTokens: (token: string, refreshToken: string) => void;
    setRefreshTokenTimer: () => void;
    clearRefreshTokenTimer: () => void;
    refreshAccessToken: () => Promise<void>;
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