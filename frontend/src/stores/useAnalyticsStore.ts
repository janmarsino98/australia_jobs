import { create } from 'zustand';
import httpClient from '../httpClient';
import { buildApiUrl } from '../config';

export type AnalyticsEventType = 
  | 'page_view'
  | 'job_search'
  | 'job_view'
  | 'job_save'
  | 'job_apply'
  | 'profile_update'
  | 'resume_upload'
  | 'resume_download'
  | 'login'
  | 'logout'
  | 'registration';

export interface AnalyticsEvent {
  id?: string;
  eventType: AnalyticsEventType;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, any>;
  metadata?: {
    userAgent?: string;
    referrer?: string;
    url?: string;
    ip?: string;
  };
}

export interface AnalyticsMetrics {
  totalPageViews: number;
  totalJobSearches: number;
  totalJobViews: number;
  totalJobSaves: number;
  totalJobApplications: number;
  averageSessionDuration: number;
  topSearchTerms: Array<{ term: string; count: number }>;
  topJobCategories: Array<{ category: string; count: number }>;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  conversionRate: number;
}

interface AnalyticsState {
  events: AnalyticsEvent[];
  metrics: AnalyticsMetrics | null;
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  
  // Event tracking
  trackEvent: (eventType: AnalyticsEventType, properties?: Record<string, any>) => void;
  trackPageView: (page: string, additionalProperties?: Record<string, any>) => void;
  trackJobInteraction: (action: 'view' | 'save' | 'apply', jobId: string, jobTitle?: string) => void;
  trackUserAction: (action: string, properties?: Record<string, any>) => void;
  
  // Data management
  getEvents: (eventType?: AnalyticsEventType, limit?: number) => AnalyticsEvent[];
  clearLocalEvents: () => void;
  
  // API actions
  sendEventToBackend: (event: AnalyticsEvent) => Promise<void>;
  sendPendingEvents: () => Promise<void>;
  fetchMetrics: (timeRange?: 'day' | 'week' | 'month' | 'year') => Promise<void>;
  fetchUserAnalytics: (userId?: string) => Promise<void>;
  clearError: () => void;
}

// Generate a session ID for tracking
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const useAnalyticsStore = create<AnalyticsState>()((set, get) => ({
  events: [],
  metrics: null,
  isLoading: false,
  error: null,
  sessionId: generateSessionId(),

  trackEvent: (eventType, properties = {}) => {
    const event: AnalyticsEvent = {
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: get().sessionId,
      properties,
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        url: window.location.href,
      },
    };

    // Add to local events
    set((state) => ({
      events: [...state.events, event].slice(-100) // Keep only last 100 events
    }));

    // Send to backend (fire and forget)
    get().sendEventToBackend(event).catch(console.error);
  },

  trackPageView: (page, additionalProperties = {}) => {
    get().trackEvent('page_view', {
      page,
      timestamp: Date.now(),
      ...additionalProperties,
    });
  },

  trackJobInteraction: (action, jobId, jobTitle) => {
    const eventTypeMap = {
      view: 'job_view' as const,
      save: 'job_save' as const,
      apply: 'job_apply' as const,
    };

    get().trackEvent(eventTypeMap[action], {
      jobId,
      jobTitle,
      action,
    });
  },

  trackUserAction: (action, properties = {}) => {
    get().trackEvent('profile_update', {
      action,
      ...properties,
    });
  },

  getEvents: (eventType, limit = 50) => {
    const events = get().events;
    const filteredEvents = eventType 
      ? events.filter(event => event.eventType === eventType)
      : events;
    
    return filteredEvents.slice(-limit).reverse(); // Most recent first
  },

  clearLocalEvents: () => {
    set({ events: [] });
  },

  // API methods
  sendEventToBackend: async (event: AnalyticsEvent) => {
    try {
      await httpClient.post(buildApiUrl('/analytics/events'), {
        event,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      // Analytics failures should not affect user experience
      console.warn('Failed to send analytics event:', error);
    }
  },

  sendPendingEvents: async () => {
    const events = get().events;
    if (events.length === 0) return;

    try {
      await httpClient.post(buildApiUrl('/analytics/events/batch'), {
        events,
        sessionId: get().sessionId,
      });
      
      // Clear events after successful send
      set({ events: [] });
    } catch (error: any) {
      console.warn('Failed to send pending analytics events:', error);
      set({ error: error.response?.data?.message || 'Failed to send analytics events' });
    }
  },

  fetchMetrics: async (timeRange = 'month') => {
    set({ isLoading: true, error: null });
    try {
      const response = await httpClient.get(buildApiUrl('/analytics/metrics'), {
        params: { timeRange }
      });
      const metrics = response.data.metrics;
      set({ metrics, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch analytics metrics:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch metrics',
        isLoading: false 
      });
    }
  },

  fetchUserAnalytics: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = userId 
        ? `/analytics/users/${userId}` 
        : '/analytics/users/me';
      
      const response = await httpClient.get(buildApiUrl(endpoint));
      const analytics = response.data.analytics;
      
      set({ 
        metrics: analytics.metrics,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Failed to fetch user analytics:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch user analytics',
        isLoading: false 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAnalyticsStore;

// Helper function to automatically track page views
export const usePageTracking = () => {
  const trackPageView = useAnalyticsStore(state => state.trackPageView);
  
  return (pageName: string, additionalProps?: Record<string, any>) => {
    trackPageView(pageName, additionalProps);
  };
};

// Helper hook for job interaction tracking
export const useJobTracking = () => {
  const trackJobInteraction = useAnalyticsStore(state => state.trackJobInteraction);
  
  return {
    trackJobView: (jobId: string, jobTitle?: string) => 
      trackJobInteraction('view', jobId, jobTitle),
    trackJobSave: (jobId: string, jobTitle?: string) => 
      trackJobInteraction('save', jobId, jobTitle),
    trackJobApply: (jobId: string, jobTitle?: string) => 
      trackJobInteraction('apply', jobId, jobTitle),
  };
};