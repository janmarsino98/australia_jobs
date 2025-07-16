import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { AuthState, User } from '../types/store';

const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: async (email: string, password: string) => {
                try {
                    const response = await axios.post('/api/auth/login', { email, password });
                    const { user, token } = response.data;

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                    });

                    // Set the token in axios defaults
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } catch (error) {
                    throw error;
                }
            },

            logout: () => {
                // Remove token from axios defaults
                delete axios.defaults.headers.common['Authorization'];

                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
            },

            setUser: (user: User) => {
                set({ user });
            },
        }),
        {
            name: 'auth-storage', // unique name for localStorage
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore; 