import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import httpClient from '../httpClient';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  data: Record<string, any>;
  action_url?: string;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  [key: string]: {
    in_app: boolean;
    email: boolean;
    push: boolean;
  };
}

interface NotificationStore {
  // State
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (page?: number, status?: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  resetPreferences: () => Promise<void>;
  createTestNotification: (title: string, message: string) => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      preferences: {},
      isLoading: false,
      error: null,

      // Actions
      fetchNotifications: async (page = 1, status) => {
        set({ isLoading: true, error: null });
        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: '50'
          });
          
          if (status) {
            params.append('status', status);
          }

          const response = await httpClient.get(`/notifications?${params}`);
          
          if (response.data.success) {
            set({
              notifications: response.data.data.notifications,
              unreadCount: response.data.data.unread_count,
              isLoading: false
            });
          } else {
            throw new Error(response.data.message || 'Failed to fetch notifications');
          }
        } catch (error: any) {
          console.error('Error fetching notifications:', error);
          set({
            error: error.response?.data?.message || error.message || 'Failed to fetch notifications',
            isLoading: false
          });
        }
      },

      fetchUnreadCount: async () => {
        try {
          const response = await httpClient.get('/notifications/count?unread_only=true');
          
          if (response.data.success) {
            set({ unreadCount: response.data.data.count });
          }
        } catch (error: any) {
          console.error('Error fetching unread count:', error);
        }
      },

      markAsRead: async (notificationId: string) => {
        try {
          const response = await httpClient.put(`/notifications/${notificationId}/read`);
          
          if (response.data.success) {
            const { notifications } = get();
            const updatedNotifications = notifications.map(notification =>
              notification.id === notificationId
                ? { ...notification, status: 'read' as const, read_at: new Date().toISOString() }
                : notification
            );
            
            const newUnreadCount = updatedNotifications.filter(n => n.status === 'unread').length;
            
            set({
              notifications: updatedNotifications,
              unreadCount: newUnreadCount
            });
          }
        } catch (error: any) {
          console.error('Error marking notification as read:', error);
          set({ error: error.response?.data?.message || 'Failed to mark notification as read' });
        }
      },

      markAllAsRead: async () => {
        try {
          const response = await httpClient.put('/notifications/read-all');
          
          if (response.data.success) {
            const { notifications } = get();
            const updatedNotifications = notifications.map(notification => ({
              ...notification,
              status: 'read' as const,
              read_at: notification.read_at || new Date().toISOString()
            }));
            
            set({
              notifications: updatedNotifications,
              unreadCount: 0
            });
          }
        } catch (error: any) {
          console.error('Error marking all notifications as read:', error);
          set({ error: error.response?.data?.message || 'Failed to mark all notifications as read' });
        }
      },

      deleteNotification: async (notificationId: string) => {
        try {
          const response = await httpClient.delete(`/notifications/${notificationId}`);
          
          if (response.data.success) {
            const { notifications } = get();
            const updatedNotifications = notifications.filter(n => n.id !== notificationId);
            const newUnreadCount = updatedNotifications.filter(n => n.status === 'unread').length;
            
            set({
              notifications: updatedNotifications,
              unreadCount: newUnreadCount
            });
          }
        } catch (error: any) {
          console.error('Error deleting notification:', error);
          set({ error: error.response?.data?.message || 'Failed to delete notification' });
        }
      },

      fetchPreferences: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.get('/notification-preferences');
          
          if (response.data.success) {
            set({
              preferences: response.data.data.preferences,
              isLoading: false
            });
          } else {
            throw new Error(response.data.message || 'Failed to fetch preferences');
          }
        } catch (error: any) {
          console.error('Error fetching preferences:', error);
          set({
            error: error.response?.data?.message || error.message || 'Failed to fetch preferences',
            isLoading: false
          });
        }
      },

      updatePreferences: async (preferences: NotificationPreferences) => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.put('/notification-preferences', {
            preferences
          });
          
          if (response.data.success) {
            set({
              preferences,
              isLoading: false
            });
          } else {
            throw new Error(response.data.message || 'Failed to update preferences');
          }
        } catch (error: any) {
          console.error('Error updating preferences:', error);
          set({
            error: error.response?.data?.message || error.message || 'Failed to update preferences',
            isLoading: false
          });
        }
      },

      resetPreferences: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.post('/notification-preferences/reset');
          
          if (response.data.success) {
            set({
              preferences: response.data.data.preferences,
              isLoading: false
            });
          } else {
            throw new Error(response.data.message || 'Failed to reset preferences');
          }
        } catch (error: any) {
          console.error('Error resetting preferences:', error);
          set({
            error: error.response?.data?.message || error.message || 'Failed to reset preferences',
            isLoading: false
          });
        }
      },

      createTestNotification: async (title: string, message: string) => {
        try {
          const response = await httpClient.post('/notifications/test', {
            title,
            message
          });
          
          if (response.data.success) {
            // Refresh notifications after creating test notification
            get().fetchNotifications();
          }
        } catch (error: any) {
          console.error('Error creating test notification:', error);
          set({ error: error.response?.data?.message || 'Failed to create test notification' });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        preferences: state.preferences,
        unreadCount: state.unreadCount
      })
    }
  )
);