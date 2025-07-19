import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/store';
import config from '../config';
import httpClient from '../httpClient';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (name: string, email: string, password: string, role: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithLinkedIn: () => Promise<void>;
    logout: () => void;
    checkSession: () => Promise<boolean>;
    initialize: () => void;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,

            // Initialize authentication state by checking session
            initialize: async () => {
                console.log('🔄 Auth store initializing...');
                try {
                    // First try to restore from storage
                    const storedUser = get().user;
                    if (storedUser) {
                        console.log('📦 Found stored user data:', storedUser.email);
                        set({ user: storedUser, isAuthenticated: true });
                    }

                    // Then validate session with backend
                    const isValid = await get().checkSession();
                    console.log('🔄 Session check result:', isValid);

                    if (!isValid) {
                        console.log('❌ Session invalid, clearing user data');
                        set({ user: null, isAuthenticated: false });
                    }
                } catch (error) {
                    console.error('❌ Session check failed during initialization:', error);
                    set({ user: null, isAuthenticated: false });
                }
            },

            // Check if current session is valid
            checkSession: async () => {
                try {
                    console.log('🔍 Checking session validity...');
                    const response = await httpClient.get(`${config.apiBaseUrl}/auth/@me`);

                    if (response.data && response.data.user) {
                        const userData = response.data.user;
                        console.log('✅ Session valid, user found:', userData.email);
                        console.log('👤 Profile data:', userData.profile);

                        set({
                            user: {
                                id: userData.id,
                                email: userData.email,
                                name: userData.name,
                                role: userData.role,
                                email_verified: userData.email_verified,
                                profile: userData.profile,
                                oauth_accounts: userData.oauth_accounts,
                                created_at: userData.created_at,
                                last_login: userData.last_login,
                                is_active: userData.is_active,
                                // Map profile image from LinkedIn if available
                                profileImage: userData.profile?.profile_picture
                            },
                            isAuthenticated: true,
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('❌ Session check failed:', error);
                    set({ user: null, isAuthenticated: false });
                    return false;
                }
            },

            login: async (email: string, password: string, rememberMe = false) => {
                try {
                    console.log('🔐 Attempting login for:', email);
                    const response = await httpClient.post(`${config.apiBaseUrl}/auth/login`, {
                        email,
                        password,
                        rememberMe,
                    });

                    if (response.data && response.data.user) {
                        const userData = response.data.user;
                        console.log('✅ Login successful:', { userId: userData.id });
                        console.log('👤 Profile data:', userData.profile);

                        set({
                            user: {
                                id: userData.id,
                                email: userData.email,
                                name: userData.name,
                                role: userData.role,
                                email_verified: userData.email_verified,
                                profile: userData.profile,
                                oauth_accounts: userData.oauth_accounts,
                                created_at: userData.created_at,
                                last_login: userData.last_login,
                                is_active: userData.is_active,
                                // Map profile image from LinkedIn if available
                                profileImage: userData.profile?.profile_picture
                            },
                            isAuthenticated: true,
                        });
                    } else {
                        throw new Error('Invalid response from server');
                    }
                } catch (error) {
                    console.error('❌ Login failed:', error);
                    throw error;
                }
            },

            register: async (name: string, email: string, password: string, role: string) => {
                try {
                    console.log('📝 Attempting registration for:', email);
                    const response = await httpClient.post(`${config.apiBaseUrl}/auth/register`, {
                        name,
                        email,
                        password,
                        role,
                    });

                    if (response.data && response.data.user) {
                        const userData = response.data.user;
                        console.log('✅ Registration successful:', { userId: userData.id });
                        console.log('👤 Profile data:', userData.profile);

                        set({
                            user: {
                                id: userData.id,
                                email: userData.email,
                                name: userData.name,
                                role: userData.role,
                                email_verified: userData.email_verified,
                                profile: userData.profile,
                                oauth_accounts: userData.oauth_accounts,
                                created_at: userData.created_at,
                                last_login: userData.last_login,
                                is_active: userData.is_active,
                                // Map profile image from LinkedIn if available
                                profileImage: userData.profile?.profile_picture
                            },
                            isAuthenticated: true,
                        });
                    } else {
                        throw new Error('Invalid response from server');
                    }
                } catch (error) {
                    console.error('❌ Registration failed:', error);
                    throw error;
                }
            },

            loginWithGoogle: async () => {
                try {
                    console.log('🔄 Initiating Google OAuth login...');
                    // For session-based OAuth, redirect to backend OAuth initiation endpoint
                    const redirectUrl = `${config.apiBaseUrl}/auth/google/login`;
                    window.location.href = redirectUrl;
                } catch (error) {
                    console.error('❌ Google login failed:', error);
                    throw error;
                }
            },

            loginWithLinkedIn: async () => {
                try {
                    console.log('🔄 Initiating LinkedIn OAuth login...');
                    // For session-based OAuth, redirect to backend OAuth initiation endpoint  
                    const redirectUrl = `${config.apiBaseUrl}/auth/linkedin/login`;
                    window.location.href = redirectUrl;
                } catch (error) {
                    console.error('❌ LinkedIn login failed:', error);
                    throw error;
                }
            },

            logout: async () => {
                try {
                    console.log('🚪 Logging out user');
                    // Call backend logout endpoint if it exists
                    try {
                        await httpClient.post(`${config.apiBaseUrl}/auth/logout`);
                    } catch (error) {
                        // Logout endpoint might not exist, that's okay
                        console.log('No logout endpoint, clearing session locally');
                    }

                    set({
                        user: null,
                        isAuthenticated: false,
                    });
                } catch (error) {
                    console.error('❌ Logout error:', error);
                    // Clear local state anyway
                    set({
                        user: null,
                        isAuthenticated: false,
                    });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                // Only persist user data, not authentication state
                // Authentication state will be checked on app load via session
                user: state.user,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    console.log('💾 Store rehydrated:', {
                        hasUser: !!state.user,
                    });
                    // Don't set isAuthenticated from storage
                    // It will be set by initialize() which checks the session
                    state.isAuthenticated = false;
                }
            },
        }
    )
);

export default useAuthStore; 