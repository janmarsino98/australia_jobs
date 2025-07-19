// Configuration settings for the application
export const config = {
    // Set to true to disable authentication for testing purposes
    // Set to false to enable normal authentication flow
    disableAuthForTesting: false,

    // API endpoints and other config can go here in the future
    apiBaseUrl: 'http://localhost:5000',
} as const;

export default config; 