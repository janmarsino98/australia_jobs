import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import httpClient from '../httpClient';
import { AuthState, User } from '../types/store';
import { jwtDecode } from 'jwt-decode';

const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            refreshTokenTimeout: null,

            setAuthTokens: (token: string, refreshToken: string) => {
                set({ token, refreshToken });
                httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            },

            setRefreshTokenTimer: () => {
                // Simplified - no automatic refresh for now
            },

            clearRefreshTokenTimer: () => {
                const state = get();
                if (state.refreshTokenTimeout) {
                    clearTimeout(state.refreshTokenTimeout);
                    set({ refreshTokenTimeout: null });
                }
            },

            refreshAccessToken: async () => {
                const state = get();
                if (!state.refreshToken) {
                    get().logout();
                    return;
                }

                try {
                    const response = await httpClient.post('/api/auth/refresh', {
                        refreshToken: state.refreshToken,
                    });
                    const { token: newToken, refreshToken: newRefreshToken } = response.data;
                    get().setAuthTokens(newToken, newRefreshToken);
                } catch (error) {
                    console.error('Failed to refresh token:', error);
                    get().logout();
                }
            },

            login: async (email: string, password: string, rememberMe: boolean = false) => {
                try {
                    const response = await httpClient.post('/api/auth/login', { email, password });
                    const { user, token, refreshToken } = response.data;

                    // Validate token
                    const decoded = jwtDecode(token);
                    const expiryTime = decoded.exp ? decoded.exp * 1000 : 0;

                    if (Date.now() >= expiryTime - 5 * 60 * 1000) {
                        throw new Error('Token is expired or about to expire');
                    }

                    // Set user and authentication state
                    set({
                        user,
                        isAuthenticated: true,
                    });

                    // Set tokens
                    get().setAuthTokens(token, refreshToken);

                    // Handle remember me
                    if (rememberMe) {
                        localStorage.setItem('rememberMe', 'true');
                    } else {
                        localStorage.removeItem('rememberMe');
                    }
                } catch (error) {
                    get().logout();
                    throw error;
                }
            },

            logout: () => {
                const state = get();

                // Clear refresh timer
                if (state.refreshTokenTimeout) {
                    clearTimeout(state.refreshTokenTimeout);
                }

                // Clear httpClient auth header
                delete httpClient.defaults.headers.common['Authorization'];

                // Clear local storage
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem('rememberMe');
                }

                // Reset state
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    refreshTokenTimeout: null,
                });
            },

            setUser: (user: User) => {
                set({ user });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.token) {
                    httpClient.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
                }
            },
        }
    )
);

export default useAuthStore; 