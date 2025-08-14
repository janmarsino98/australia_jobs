import { useState, useCallback } from 'react';
import {
  ReviewResult,
  ResumeRequirements,
  BookingPreferences,
  BookingConfirmation,
  ApiError
} from '../types/api';
import { serviceDeliveryApi, serviceDeliveryApiUtils } from '../services/serviceDeliveryApi';

// Hook interface
export interface UseServiceDeliveryReturn {
  // Data
  reviewResult: ReviewResult | null;
  bookingConfirmation: BookingConfirmation | null;
  serviceProgress: { progress: number; status: string; estimatedCompletion?: string; } | null;
  availableSlots: { date: string; slots: string[]; }[];
  
  // Loading states
  isProcessingReview: boolean;
  isInitiatingBuild: boolean;
  isBooking: boolean;
  isDownloading: boolean;
  isRequestingRevision: boolean;
  isFetchingProgress: boolean;
  isFetchingSlots: boolean;
  
  // Error states
  error: ApiError | null;
  reviewError: ApiError | null;
  bookingError: ApiError | null;
  
  // Actions
  processAIResumeReview: (orderId: string, resumeFile: File) => Promise<ReviewResult | null>;
  initiateAIResumeBuilding: (orderId: string, requirements: ResumeRequirements) => Promise<{ taskId: string; estimatedCompletion: string; } | null>;
  bookProfessionalConsultation: (orderId: string, preferences: BookingPreferences) => Promise<BookingConfirmation | null>;
  getServiceProgress: (orderId: string, serviceType: string) => Promise<void>;
  downloadServiceResult: (orderId: string, serviceType: string) => Promise<Blob | null>;
  requestServiceRevision: (orderId: string, revisionDetails: string) => Promise<{ success: boolean; revisionId: string; } | null>;
  getAvailableTimeSlots: (serviceType: string, dateRange?: [string, string]) => Promise<void>;
  
  // Utilities
  clearErrors: () => void;
  reset: () => void;
}

// Main service delivery hook
export const useServiceDelivery = (): UseServiceDeliveryReturn => {
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<BookingConfirmation | null>(null);
  const [serviceProgress, setServiceProgress] = useState<{ progress: number; status: string; estimatedCompletion?: string; } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ date: string; slots: string[]; }[]>([]);
  
  const [isProcessingReview, setIsProcessingReview] = useState(false);
  const [isInitiatingBuild, setIsInitiatingBuild] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [isFetchingProgress, setIsFetchingProgress] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  
  const [error, setError] = useState<ApiError | null>(null);
  const [reviewError, setReviewError] = useState<ApiError | null>(null);
  const [bookingError, setBookingError] = useState<ApiError | null>(null);

  // Process AI Resume Review
  const processAIResumeReview = useCallback(async (orderId: string, resumeFile: File): Promise<ReviewResult | null> => {
    try {
      setIsProcessingReview(true);
      setReviewError(null);
      
      const result = await serviceDeliveryApi.processAIResumeReview(orderId, resumeFile);
      setReviewResult(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setReviewError(apiError);
      console.error('Failed to process resume review:', apiError);
      return null;
    } finally {
      setIsProcessingReview(false);
    }
  }, []);

  // Initiate AI Resume Building
  const initiateAIResumeBuilding = useCallback(async (orderId: string, requirements: ResumeRequirements): Promise<{ taskId: string; estimatedCompletion: string; } | null> => {
    try {
      setIsInitiatingBuild(true);
      setError(null);
      
      const result = await serviceDeliveryApi.initiateAIResumeBuilding(orderId, requirements);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to initiate resume building:', apiError);
      return null;
    } finally {
      setIsInitiatingBuild(false);
    }
  }, []);

  // Book Professional Consultation
  const bookProfessionalConsultation = useCallback(async (orderId: string, preferences: BookingPreferences): Promise<BookingConfirmation | null> => {
    try {
      setIsBooking(true);
      setBookingError(null);
      
      // Validate booking preferences
      const validation = serviceDeliveryApiUtils.validateBookingPreferences(preferences);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      const confirmation = await serviceDeliveryApi.bookProfessionalConsultation(orderId, preferences);
      setBookingConfirmation(confirmation);
      return confirmation;
    } catch (err) {
      const apiError = err as ApiError;
      setBookingError(apiError);
      console.error('Failed to book consultation:', apiError);
      return null;
    } finally {
      setIsBooking(false);
    }
  }, []);

  // Get service progress
  const getServiceProgress = useCallback(async (orderId: string, serviceType: string): Promise<void> => {
    try {
      setIsFetchingProgress(true);
      setError(null);
      
      const progress = await serviceDeliveryApi.getServiceProgress(orderId, serviceType);
      setServiceProgress(progress);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to get service progress:', apiError);
    } finally {
      setIsFetchingProgress(false);
    }
  }, []);

  // Download service result
  const downloadServiceResult = useCallback(async (orderId: string, serviceType: string): Promise<Blob | null> => {
    try {
      setIsDownloading(true);
      setError(null);
      
      const blob = await serviceDeliveryApi.downloadServiceResult(orderId, serviceType);
      
      // Trigger download in browser
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = serviceDeliveryApiUtils.generateDownloadFilename(orderId, serviceType);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return blob;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to download service result:', apiError);
      return null;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  // Request service revision
  const requestServiceRevision = useCallback(async (orderId: string, revisionDetails: string): Promise<{ success: boolean; revisionId: string; } | null> => {
    try {
      setIsRequestingRevision(true);
      setError(null);
      
      const result = await serviceDeliveryApi.requestServiceRevision(orderId, revisionDetails);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to request revision:', apiError);
      return null;
    } finally {
      setIsRequestingRevision(false);
    }
  }, []);

  // Get available time slots
  const getAvailableTimeSlots = useCallback(async (serviceType: string, dateRange?: [string, string]): Promise<void> => {
    try {
      setIsFetchingSlots(true);
      setError(null);
      
      const slots = await serviceDeliveryApi.getAvailableTimeSlots(serviceType, dateRange);
      setAvailableSlots(slots);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to get available time slots:', apiError);
    } finally {
      setIsFetchingSlots(false);
    }
  }, []);

  // Clear errors
  const clearErrors = useCallback((): void => {
    setError(null);
    setReviewError(null);
    setBookingError(null);
  }, []);

  // Reset all state
  const reset = useCallback((): void => {
    setReviewResult(null);
    setBookingConfirmation(null);
    setServiceProgress(null);
    setAvailableSlots([]);
    setError(null);
    setReviewError(null);
    setBookingError(null);
  }, []);

  return {
    // Data
    reviewResult,
    bookingConfirmation,
    serviceProgress,
    availableSlots,
    
    // Loading states
    isProcessingReview,
    isInitiatingBuild,
    isBooking,
    isDownloading,
    isRequestingRevision,
    isFetchingProgress,
    isFetchingSlots,
    
    // Error states
    error,
    reviewError,
    bookingError,
    
    // Actions
    processAIResumeReview,
    initiateAIResumeBuilding,
    bookProfessionalConsultation,
    getServiceProgress,
    downloadServiceResult,
    requestServiceRevision,
    getAvailableTimeSlots,
    
    // Utilities
    clearErrors,
    reset
  };
};

// Hook for AI Resume Review specifically
export const useAIResumeReview = () => {
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const processReview = useCallback(async (orderId: string, resumeFile: File): Promise<ReviewResult | null> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const result = await serviceDeliveryApi.processAIResumeReview(orderId, resumeFile);
      setReviewResult(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getScoreAnalysis = useCallback((result: ReviewResult) => {
    return {
      overallScore: result.overallScore,
      atsScore: result.atsScore,
      completeness: serviceDeliveryApiUtils.calculateCompleteness(result),
      priorities: serviceDeliveryApiUtils.getImprovementPriorities(result),
      scoreText: serviceDeliveryApiUtils.formatATSScore(result.atsScore),
      scoreColor: serviceDeliveryApiUtils.getScoreColorClass(result.atsScore)
    };
  }, []);

  return {
    reviewResult,
    isProcessing,
    error,
    processReview,
    getScoreAnalysis,
    clearError: () => setError(null)
  };
};

// Hook for service progress tracking
export const useServiceProgress = (orderId?: string, serviceType?: string) => {
  const [progress, setProgress] = useState<{ progress: number; status: string; estimatedCompletion?: string; } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchProgress = useCallback(async (orderIdParam?: string, serviceTypeParam?: string): Promise<void> => {
    const id = orderIdParam || orderId;
    const type = serviceTypeParam || serviceType;
    
    if (!id || !type) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const progressData = await serviceDeliveryApi.getServiceProgress(id, type);
      setProgress(progressData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, serviceType]);

  const getProgressDisplay = useCallback(() => {
    if (!progress) return null;
    
    return {
      percentage: progress.progress,
      statusText: serviceDeliveryApiUtils.getServiceStatusText(progress.status),
      statusColor: serviceDeliveryApiUtils.getServiceStatusColor(progress.status),
      calculatedProgress: serviceDeliveryApiUtils.calculateProgress(progress.status),
      estimatedCompletion: progress.estimatedCompletion ? new Date(progress.estimatedCompletion) : null
    };
  }, [progress]);

  return {
    progress,
    isLoading,
    error,
    fetchProgress,
    getProgressDisplay,
    refresh: () => fetchProgress()
  };
};

// Hook for consultation booking
export const useConsultationBooking = () => {
  const [availableSlots, setAvailableSlots] = useState<{ date: string; slots: string[]; }[]>([]);
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchAvailableSlots = useCallback(async (serviceType: string, dateRange?: [string, string]): Promise<void> => {
    try {
      setIsLoadingSlots(true);
      setError(null);
      
      const slots = await serviceDeliveryApi.getAvailableTimeSlots(serviceType, dateRange);
      setAvailableSlots(slots);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  const bookConsultation = useCallback(async (orderId: string, preferences: BookingPreferences): Promise<BookingConfirmation | null> => {
    try {
      setIsBooking(true);
      setError(null);
      
      const validation = serviceDeliveryApiUtils.validateBookingPreferences(preferences);
      if (!validation.valid) {
        throw new Error(`Invalid booking preferences: ${validation.errors.join(', ')}`);
      }
      
      const confirmation = await serviceDeliveryApi.bookProfessionalConsultation(orderId, preferences);
      setBooking(confirmation);
      return confirmation;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      return null;
    } finally {
      setIsBooking(false);
    }
  }, []);

  return {
    availableSlots,
    booking,
    isLoadingSlots,
    isBooking,
    error,
    fetchAvailableSlots,
    bookConsultation,
    clearError: () => setError(null)
  };
};

export default useServiceDelivery;