import axios from "axios";
import { config } from "./config.ts";

// Create axios instance with default config
const httpClient = axios.create({
    baseURL: config.apiBaseUrl,
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    timeout: 90000, // 90 second timeout for AI operations
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Add request interceptor for security headers
httpClient.interceptors.request.use(
    config => {
        // Add security headers
        config.headers['X-Content-Type-Options'] = 'nosniff';
        config.headers['X-Frame-Options'] = 'DENY';
        config.headers['X-XSS-Protection'] = '1; mode=block';

        // Don't modify Content-Type for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // Sanitize URLs
        if (config.url) {
            try {
                const url = new URL(config.url);
                config.url = url.toString();
            } catch (e) {
                // If not a valid URL, assume it's a relative path
                config.url = encodeURI(config.url);
            }
        }

        // Sanitize request data (skip for FormData)
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
            config.data = JSON.parse(JSON.stringify(config.data));
        }

        return config;
    },
    error => Promise.reject(error)
);

// Add response interceptor for error handling
httpClient.interceptors.response.use(
    response => response,
    error => {
        // Enhanced error handling with detailed logging
        if (error.response) {
            const { status, data, config } = error.response;
            
            // Log error details for debugging (only in development)
            if (import.meta.env.DEV) {
                console.group(`API Error: ${status} ${config.method?.toUpperCase()} ${config.url}`);
                console.error('Status:', status);
                console.error('Data:', data);
                console.error('Request Config:', config);
                console.groupEnd();
            }

            // Handle specific error cases
            switch (status) {
                case 400:
                    console.error('Bad Request - Check your request data');
                    break;
                case 401:
                    console.error('Unauthorized - User authentication required');
                    // Could redirect to login page here
                    break;
                case 403:
                    console.error('Forbidden - Access denied. Possible CSRF token mismatch.');
                    break;
                case 404:
                    console.error('Not Found - The requested resource does not exist');
                    break;
                case 422:
                    console.error('Validation Error - Check your input data');
                    break;
                case 429:
                    console.error('Too Many Requests - Rate limit exceeded');
                    break;
                case 500:
                    console.error('Internal Server Error - Something went wrong on the server');
                    break;
                case 502:
                    console.error('Bad Gateway - Server is down or unreachable');
                    break;
                case 503:
                    console.error('Service Unavailable - Server is temporarily unavailable');
                    break;
                default:
                    console.error(`HTTP Error ${status}:`, data?.message || 'Unknown error');
            }
        } else if (error.request) {
            // Network error
            console.error('Network Error - No response received from server');
            console.error('Request details:', error.request);
        } else {
            // Request setup error
            console.error('Request Setup Error:', error.message);
        }
        
        return Promise.reject(error);
    }
);

export default httpClient;