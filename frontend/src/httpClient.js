import axios from "axios";

// Create axios instance with default config
const httpClient = axios.create({
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
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

        // Sanitize request data
        if (config.data && typeof config.data === 'object') {
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
        if (error.response) {
            // Handle specific error cases
            switch (error.response.status) {
                case 401:
                    // Unauthorized - redirect to login
                    window.location.href = '/login';
                    break;
                case 403:
                    // Forbidden - could be CSRF token mismatch
                    console.error('Access forbidden. Possible CSRF token mismatch.');
                    break;
                case 419:
                    // Session expired
                    window.location.href = '/login';
                    break;
                case 500:
                    console.error('Server error:', error.response.data);
                    break;
                default:
                    console.error('Request failed:', error.response.data);
            }
        }
        return Promise.reject(error);
    }
);

export default httpClient;