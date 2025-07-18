import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/store';

interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
    type: 'social_auth_success';
}

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithLinkedIn: () => Promise<void>;
    logout: () => void;
    refreshSession: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,

            login: async (email: string, password: string, rememberMe = false) => {
                try {
                    // TODO: Implement actual login API call
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password, rememberMe }),
                    });

                    if (!response.ok) {
                        throw new Error('Login failed');
                    }

                    const data = await response.json();
                    set({
                        user: data.user,
                        token: data.token,
                        refreshToken: data.refreshToken,
                        isAuthenticated: true,
                    });
                } catch (error) {
                    throw error;
                }
            },

            loginWithGoogle: async () => {
                try {
                    // TODO: Implement Google OAuth flow
                    const popup = window.open(
                        '/api/auth/google',
                        'Google Login',
                        'width=500,height=600'
                    );

                    const result = await new Promise<AuthResponse>((resolve, reject) => {
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'social_auth_success') {
                                resolve(event.data as AuthResponse);
                            } else if (event.data.type === 'social_auth_error') {
                                reject(new Error(event.data.error));
                            }
                        });
                    });

                    set({
                        user: result.user,
                        token: result.token,
                        refreshToken: result.refreshToken,
                        isAuthenticated: true,
                    });
                } catch (error) {
                    throw error;
                }
            },

            loginWithLinkedIn: async () => {
                try {
                    // TODO: Implement LinkedIn OAuth flow
                    const popup = window.open(
                        '/api/auth/linkedin',
                        'LinkedIn Login',
                        'width=500,height=600'
                    );

                    const result = await new Promise<AuthResponse>((resolve, reject) => {
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'social_auth_success') {
                                resolve(event.data as AuthResponse);
                            } else if (event.data.type === 'social_auth_error') {
                                reject(new Error(event.data.error));
                            }
                        });
                    });

                    set({
                        user: result.user,
                        token: result.token,
                        refreshToken: result.refreshToken,
                        isAuthenticated: true,
                    });
                } catch (error) {
                    throw error;
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            refreshSession: async () => {
                try {
                    const refreshToken = useAuthStore.getState().refreshToken;
                    if (!refreshToken) {
                        throw new Error('No refresh token available');
                    }

                    const response = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken }),
                    });

                    if (!response.ok) {
                        throw new Error('Session refresh failed');
                    }

                    const data = await response.json();
                    set({
                        token: data.token,
                        refreshToken: data.refreshToken,
                    });
                } catch (error) {
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                refreshToken: state.refreshToken,
                user: state.user,
            }),
        }
    )
);

export default useAuthStore; 