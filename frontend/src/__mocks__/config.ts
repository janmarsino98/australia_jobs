// Mock configuration for tests
export const config = {
    disableAuthForTesting: false,
    apiBaseUrl: 'http://localhost:5000',
    isDevelopment: false,
    isProduction: true,
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
        applications: {
            list: '/applications',
            create: '/applications',
            update: '/applications/:id',
            delete: '/applications/:id',
        },
        savedJobs: {
            list: '/saved-jobs',
            save: '/saved-jobs',
            remove: '/saved-jobs/:id',
            update: '/saved-jobs/:id',
        },
        userPreferences: {
            get: '/user/preferences',
            save: '/user/preferences',
            update: '/user/preferences',
        },
        userExperience: {
            list: '/user/experience',
            create: '/user/experience',
            update: '/user/experience/:id',
            delete: '/user/experience/:id',
        },
        userEducation: {
            list: '/user/education',
            create: '/user/education',
            update: '/user/education/:id',
            delete: '/user/education/:id',
            certifications: '/user/education/certifications',
        },
        analytics: {
            events: '/analytics/events',
            eventsBatch: '/analytics/events/batch',
            metrics: '/analytics/metrics',
            userAnalytics: '/analytics/users/me',
        },
        admin: {
            users: '/admin/users',
            jobs: '/admin/jobs',
            stats: '/admin/stats',
            export: '/admin/export',
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

export const buildApiUrl = (endpoint: string): string => {
    const baseUrl = config.apiBaseUrl.replace(/\/$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
};

export default config;