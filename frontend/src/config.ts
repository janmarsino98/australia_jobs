// Configuration settings for the application
const getApiBaseUrl = (): string => {
    // Use environment variables if available
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    
    // Default to localhost for development
    return 'http://localhost:5000';
};

export const config = {
    // Set to true to disable authentication for testing purposes
    // Set to false to enable normal authentication flow
    disableAuthForTesting: false,

    // API base URL with environment support
    apiBaseUrl: getApiBaseUrl(),
    
    // Environment detection
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    
    // API endpoints
    endpoints: {
        auth: {
            me: '/auth/@me',
            verify: '/auth/verify-email',
            resendVerification: '/auth/resend-verification',
            resetPasswordRequest: '/auth/reset-password/request',
            resetPasswordConfirm: '/auth/reset-password/confirm',
        },
        jobs: {
            get: '/jobs/get',
            apply: '/jobs/apply',
            single: '/jobs',
            suggestions: {
                titles: '/jobs/suggestions/titles',
                locations: '/jobs/suggestions/locations',
            },
        },
        users: {
            profile: '/users/profile',
            skills: '/users/profile/skills',
            experience: '/users/profile/experience',
            education: '/users/profile/education',
        },
        cities: {
            getAll: '/cities/get_all',
            getMain: '/cities/get_main',
            createPaymentIntent: '/cities/create-payment-intent',
        },
        states: {
            getAll: '/states/get_all',
        },
        jobtypes: {
            getAll: '/jobtypes/get_all',
        },
        resume: {
            current: '/resume/current',
        },
    },
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
    const baseUrl = config.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
};

export default config; 