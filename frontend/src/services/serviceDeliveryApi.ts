import httpClient from '../httpClient';
import {
  ReviewResult,
  ResumeRequirements,
  BookingPreferences,
  BookingConfirmation,
  ReviewResultResponse,
  BookingConfirmationResponse,
  ApiError
} from '../types/api';

// Service Delivery API Interface
export interface ServiceDeliveryApiService {
  processAIResumeReview: (orderId: string, resumeFile: File) => Promise<ReviewResult>;
  initiateAIResumeBuilding: (orderId: string, requirements: ResumeRequirements) => Promise<{ taskId: string; estimatedCompletion: string; }>;
  bookProfessionalConsultation: (orderId: string, preferences: BookingPreferences) => Promise<BookingConfirmation>;
  getServiceProgress: (orderId: string, serviceType: string) => Promise<{ progress: number; status: string; estimatedCompletion?: string; }>;
  downloadServiceResult: (orderId: string, serviceType: string) => Promise<Blob>;
  requestServiceRevision: (orderId: string, revisionDetails: string) => Promise<{ success: boolean; revisionId: string; }>;
  getAvailableTimeSlots: (serviceType: string, dateRange?: [string, string]) => Promise<{ date: string; slots: string[]; }[]>;
}

// Error handling utility
const handleApiError = (error: any): never => {
  if (error.response?.data) {
    const apiError: ApiError = {
      message: error.response.data.message || error.response.data.error || 'Service processing error',
      code: error.response.data.code,
      field: error.response.data.field,
      details: error.response.data.details
    };
    throw apiError;
  }
  
  if (error.request) {
    throw new Error('Network error - unable to process service request');
  }
  
  throw new Error(error.message || 'Service processing failed');
};

// Service Delivery API implementation
export const serviceDeliveryApi: ServiceDeliveryApiService = {
  /**
   * Process AI Resume Review - instant analysis
   */
  async processAIResumeReview(orderId: string, resumeFile: File): Promise<ReviewResult> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      if (!resumeFile) {
        throw new Error('Resume file is required');
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(resumeFile.type)) {
        throw new Error('Only PDF and Word documents are supported');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (resumeFile.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('orderId', orderId);
      formData.append('service', 'ai-resume-review');

      const response = await httpClient.post<ReviewResultResponse>('/api/services/ai-resume-review', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000 // 2 minutes for AI processing
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to process resume review');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Initiate AI Resume Building - longer process
   */
  async initiateAIResumeBuilding(orderId: string, requirements: ResumeRequirements): Promise<{ taskId: string; estimatedCompletion: string; }> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      if (!requirements.targetRole || !requirements.industry) {
        throw new Error('Target role and industry are required');
      }

      const response = await httpClient.post('/api/services/ai-resume-building', {
        orderId,
        requirements,
        service: 'ai-resume-building',
        initiatedAt: new Date().toISOString()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to initiate resume building');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Book Professional Consultation
   */
  async bookProfessionalConsultation(orderId: string, preferences: BookingPreferences): Promise<BookingConfirmation> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      if (!preferences.preferredDates || preferences.preferredDates.length === 0) {
        throw new Error('At least one preferred date is required');
      }

      if (!preferences.timeSlots || preferences.timeSlots.length === 0) {
        throw new Error('At least one preferred time slot is required');
      }

      const response = await httpClient.post<BookingConfirmationResponse>('/api/services/book-consultation', {
        orderId,
        preferences,
        service: 'professional-consultation',
        bookedAt: new Date().toISOString()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to book consultation');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get service processing progress
   */
  async getServiceProgress(orderId: string, serviceType: string): Promise<{ progress: number; status: string; estimatedCompletion?: string; }> {
    try {
      if (!orderId || !serviceType) {
        throw new Error('Order ID and service type are required');
      }

      const response = await httpClient.get(`/api/services/progress/${orderId}/${serviceType}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get service progress');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Download completed service result
   */
  async downloadServiceResult(orderId: string, serviceType: string): Promise<Blob> {
    try {
      if (!orderId || !serviceType) {
        throw new Error('Order ID and service type are required');
      }

      const response = await httpClient.get(`/api/services/download/${orderId}/${serviceType}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Request revision for professional services
   */
  async requestServiceRevision(orderId: string, revisionDetails: string): Promise<{ success: boolean; revisionId: string; }> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      if (!revisionDetails.trim()) {
        throw new Error('Revision details are required');
      }

      const response = await httpClient.post(`/api/services/request-revision`, {
        orderId,
        revisionDetails,
        requestedAt: new Date().toISOString()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to request revision');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get available time slots for booking services
   */
  async getAvailableTimeSlots(serviceType: string, dateRange?: [string, string]): Promise<{ date: string; slots: string[]; }[]> {
    try {
      if (!serviceType) {
        throw new Error('Service type is required');
      }

      const params: any = { serviceType };
      if (dateRange) {
        params.startDate = dateRange[0];
        params.endDate = dateRange[1];
      }

      const response = await httpClient.get('/api/services/available-slots', { params });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get available time slots');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Utility functions for service operations
export const serviceDeliveryApiUtils = {
  /**
   * Format ATS score for display
   */
  formatATSScore: (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  },

  /**
   * Get score color class
   */
  getScoreColorClass: (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  },

  /**
   * Calculate overall resume completeness
   */
  calculateCompleteness: (reviewResult: ReviewResult): number => {
    const sectionScores = Object.values(reviewResult.sections).map(section => section.score);
    return Math.round(sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length);
  },

  /**
   * Generate improvement priority list
   */
  getImprovementPriorities: (reviewResult: ReviewResult): Array<{ section: string; score: number; priority: 'high' | 'medium' | 'low'; }> => {
    const sections = Object.entries(reviewResult.sections).map(([name, data]) => ({
      section: name,
      score: data.score,
      priority: data.score < 60 ? 'high' as const : data.score < 80 ? 'medium' as const : 'low' as const
    }));

    return sections.sort((a, b) => a.score - b.score);
  },

  /**
   * Format consultation duration
   */
  formatConsultationDuration: (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  },

  /**
   * Validate booking preferences
   */
  validateBookingPreferences: (preferences: BookingPreferences): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!preferences.preferredDates || preferences.preferredDates.length === 0) {
      errors.push('At least one preferred date is required');
    } else {
      preferences.preferredDates.forEach((date, index) => {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          errors.push(`Preferred date ${index + 1} is invalid`);
        } else if (dateObj < new Date()) {
          errors.push(`Preferred date ${index + 1} cannot be in the past`);
        }
      });
    }
    
    if (!preferences.timeSlots || preferences.timeSlots.length === 0) {
      errors.push('At least one time slot preference is required');
    }
    
    if (!preferences.communicationMethod) {
      errors.push('Communication method is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Calculate estimated service completion time
   */
  getEstimatedCompletion: (serviceType: string, priority: 'standard' | 'rush' = 'standard'): Date => {
    const now = new Date();
    const completionTimes: Record<string, { standard: number; rush: number }> = {
      'ai-resume-review': { standard: 0, rush: 0 }, // Instant
      'ai-resume-building': { standard: 24, rush: 4 }, // Hours
      'professional-resume-review': { standard: 48, rush: 24 },
      'professional-resume-building': { standard: 72, rush: 48 },
      'professional-cover-letter': { standard: 48, rush: 24 },
      'professional-linkedin': { standard: 48, rush: 24 },
      'professional-consultation': { standard: 168, rush: 72 } // 1 week standard, 3 days rush
    };
    
    const hours = completionTimes[serviceType]?.[priority] || 48;
    now.setHours(now.getHours() + hours);
    return now;
  },

  /**
   * Generate service tracking ID
   */
  generateTrackingId: (orderId: string, serviceType: string): string => {
    const prefix = serviceType.split('-').map(word => word.charAt(0).toUpperCase()).join('');
    const orderSuffix = orderId.slice(-6).toUpperCase();
    return `${prefix}-${orderSuffix}`;
  },

  /**
   * Get service status display text
   */
  getServiceStatusText: (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Waiting to Start',
      'in_progress': 'In Progress',
      'review': 'Under Review',
      'revision': 'Revision Requested',
      'completed': 'Completed',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  },

  /**
   * Get service status color
   */
  getServiceStatusColor: (status: string): string => {
    const colorMap: Record<string, string> = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'in_progress': 'text-blue-600 bg-blue-100',
      'review': 'text-purple-600 bg-purple-100',
      'revision': 'text-orange-600 bg-orange-100',
      'completed': 'text-green-600 bg-green-100',
      'delivered': 'text-green-700 bg-green-200',
      'cancelled': 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  },

  /**
   * Calculate service progress percentage
   */
  calculateProgress: (status: string): number => {
    const progressMap: Record<string, number> = {
      'pending': 0,
      'in_progress': 50,
      'review': 75,
      'revision': 60,
      'completed': 90,
      'delivered': 100,
      'cancelled': 0
    };
    return progressMap[status] || 0;
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Generate downloadable filename
   */
  generateDownloadFilename: (orderId: string, serviceType: string, fileType = 'pdf'): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const servicePrefix = serviceType.replace(/-/g, '_');
    const orderSuffix = orderId.slice(-6);
    return `${servicePrefix}_${orderSuffix}_${timestamp}.${fileType}`;
  }
};

export default serviceDeliveryApi;