import { useState, useCallback } from 'react';
import {
  PaymentIntentRequest,
  PaymentIntentResponse,
  PaymentConfirmationResponse,
  ApiError
} from '../types/api';
import { paymentApi, paymentApiUtils } from '../services/paymentApi';

// Hook interface
export interface UsePaymentReturn {
  // Data
  paymentIntent: PaymentIntentResponse | null;
  paymentStatus: PaymentConfirmationResponse | null;
  paymentMethods: any[];
  
  // Loading states
  isCreating: boolean;
  isConfirming: boolean;
  isProcessing: boolean;
  isRefunding: boolean;
  
  // Error states
  error: ApiError | null;
  paymentError: ApiError | null;
  
  // Actions
  createPaymentIntent: (paymentData: PaymentIntentRequest) => Promise<PaymentIntentResponse | null>;
  confirmPayment: (paymentIntentId: string, paymentMethodId?: string) => Promise<PaymentConfirmationResponse | null>;
  getPaymentStatus: (paymentIntentId: string) => Promise<PaymentConfirmationResponse | null>;
  refundPayment: (paymentIntentId: string, amount?: number, reason?: string) => Promise<{ success: boolean; refundId: string; } | null>;
  fetchPaymentMethods: (customerId?: string) => Promise<void>;
  savePaymentMethod: (paymentMethodId: string, customerId: string) => Promise<boolean>;
  
  // Utilities
  clearErrors: () => void;
  reset: () => void;
}

// Main payment hook
export const usePayment = (): UsePaymentReturn => {
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentConfirmationResponse | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  
  const [error, setError] = useState<ApiError | null>(null);
  const [paymentError, setPaymentError] = useState<ApiError | null>(null);

  // Create payment intent
  const createPaymentIntent = useCallback(async (paymentData: PaymentIntentRequest): Promise<PaymentIntentResponse | null> => {
    try {
      setIsCreating(true);
      setError(null);
      setPaymentError(null);
      
      const intent = await paymentApi.createPaymentIntent(paymentData);
      setPaymentIntent(intent);
      return intent;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to create payment intent:', apiError);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Confirm payment
  const confirmPayment = useCallback(async (paymentIntentId: string, paymentMethodId?: string): Promise<PaymentConfirmationResponse | null> => {
    try {
      setIsConfirming(true);
      setPaymentError(null);
      
      const confirmation = await paymentApi.confirmPayment(paymentIntentId, paymentMethodId);
      setPaymentStatus(confirmation);
      return confirmation;
    } catch (err) {
      const apiError = err as ApiError;
      setPaymentError(apiError);
      console.error('Failed to confirm payment:', apiError);
      return null;
    } finally {
      setIsConfirming(false);
    }
  }, []);

  // Get payment status
  const getPaymentStatus = useCallback(async (paymentIntentId: string): Promise<PaymentConfirmationResponse | null> => {
    try {
      setIsProcessing(true);
      setPaymentError(null);
      
      const status = await paymentApi.getPaymentStatus(paymentIntentId);
      setPaymentStatus(status);
      return status;
    } catch (err) {
      const apiError = err as ApiError;
      setPaymentError(apiError);
      console.error('Failed to get payment status:', apiError);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Refund payment
  const refundPayment = useCallback(async (paymentIntentId: string, amount?: number, reason?: string): Promise<{ success: boolean; refundId: string; } | null> => {
    try {
      setIsRefunding(true);
      setError(null);
      
      const refund = await paymentApi.refundPayment(paymentIntentId, amount, reason);
      return refund;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to process refund:', apiError);
      return null;
    } finally {
      setIsRefunding(false);
    }
  }, []);

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async (customerId?: string): Promise<void> => {
    try {
      setError(null);
      
      const methods = await paymentApi.getPaymentMethods(customerId);
      setPaymentMethods(methods);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch payment methods:', apiError);
    }
  }, []);

  // Save payment method
  const savePaymentMethod = useCallback(async (paymentMethodId: string, customerId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const result = await paymentApi.savePaymentMethod(paymentMethodId, customerId);
      if (result.success) {
        // Refresh payment methods
        await fetchPaymentMethods(customerId);
      }
      return result.success;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to save payment method:', apiError);
      return false;
    }
  }, [fetchPaymentMethods]);

  // Clear errors
  const clearErrors = useCallback((): void => {
    setError(null);
    setPaymentError(null);
  }, []);

  // Reset all state
  const reset = useCallback((): void => {
    setPaymentIntent(null);
    setPaymentStatus(null);
    setPaymentMethods([]);
    setError(null);
    setPaymentError(null);
  }, []);

  return {
    // Data
    paymentIntent,
    paymentStatus,
    paymentMethods,
    
    // Loading states
    isCreating,
    isConfirming,
    isProcessing,
    isRefunding,
    
    // Error states
    error,
    paymentError,
    
    // Actions
    createPaymentIntent,
    confirmPayment,
    getPaymentStatus,
    refundPayment,
    fetchPaymentMethods,
    savePaymentMethod,
    
    // Utilities
    clearErrors,
    reset
  };
};

// Hook for Stripe Elements integration
export const useStripePayment = (orderId: string, amount: number) => {
  const {
    paymentIntent,
    isCreating,
    error,
    createPaymentIntent,
    confirmPayment,
    clearErrors
  } = usePayment();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize payment intent for Stripe
  const initializePayment = useCallback(async (): Promise<boolean> => {
    try {
      const intent = await createPaymentIntent({
        amount,
        orderId,
        currency: 'aud'
      });
      
      if (intent?.clientSecret) {
        setClientSecret(intent.clientSecret);
        setIsReady(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to initialize payment:', err);
      return false;
    }
  }, [createPaymentIntent, amount, orderId]);

  // Process payment with Stripe
  const processPayment = useCallback(async (stripe: any, elements: any): Promise<{ success: boolean; error?: string; }> => {
    if (!stripe || !elements || !clientSecret) {
      return { success: false, error: 'Payment not properly initialized' };
    }

    try {
      const { error: stripeError, paymentIntent: stripePaymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });

      if (stripeError) {
        return { success: false, error: stripeError.message };
      }

      if (stripePaymentIntent?.status === 'succeeded') {
        // Confirm with backend
        await confirmPayment(stripePaymentIntent.id);
        return { success: true };
      }

      return { success: false, error: 'Payment was not successful' };
    } catch (err) {
      return { success: false, error: 'Payment processing failed' };
    }
  }, [clientSecret, confirmPayment]);

  return {
    clientSecret,
    isReady,
    isCreating,
    error,
    paymentIntent,
    initializePayment,
    processPayment,
    clearErrors
  };
};

// Hook for payment validation utilities
export const usePaymentValidation = () => {
  const validateCardNumber = useCallback((cardNumber: string): boolean => {
    return paymentApiUtils.validateCardNumber(cardNumber);
  }, []);

  const validateExpiry = useCallback((month: string, year: string): boolean => {
    return paymentApiUtils.validateExpiry(month, year);
  }, []);

  const validateCVV = useCallback((cvv: string, cardBrand?: string): boolean => {
    return paymentApiUtils.validateCVV(cvv, cardBrand);
  }, []);

  const getCardBrand = useCallback((cardNumber: string): string => {
    return paymentApiUtils.getCardBrand(cardNumber);
  }, []);

  const formatCardNumber = useCallback((cardNumber: string): string => {
    return paymentApiUtils.formatCardNumber(cardNumber);
  }, []);

  const maskCardNumber = useCallback((cardNumber: string): string => {
    return paymentApiUtils.maskCardNumber(cardNumber);
  }, []);

  return {
    validateCardNumber,
    validateExpiry,
    validateCVV,
    getCardBrand,
    formatCardNumber,
    maskCardNumber
  };
};

// Hook for payment formatting utilities
export const usePaymentFormatting = () => {
  const formatAmount = useCallback((amountInCents: number, currency = 'AUD'): string => {
    return paymentApiUtils.formatAmount(amountInCents, currency);
  }, []);

  const toCents = useCallback((dollarAmount: number): number => {
    return paymentApiUtils.toCents(dollarAmount);
  }, []);

  const toDollars = useCallback((centsAmount: number): number => {
    return paymentApiUtils.toDollars(centsAmount);
  }, []);

  const calculateProcessingFee = useCallback((amount: number, feePercentage = 0.029, fixedFee = 0.30): number => {
    return paymentApiUtils.calculateProcessingFee(amount, feePercentage, fixedFee);
  }, []);

  const getPaymentStatusColor = useCallback((status: string): string => {
    return paymentApiUtils.getPaymentStatusColor(status);
  }, []);

  const getPaymentStatusText = useCallback((status: string): string => {
    return paymentApiUtils.getPaymentStatusText(status);
  }, []);

  return {
    formatAmount,
    toCents,
    toDollars,
    calculateProcessingFee,
    getPaymentStatusColor,
    getPaymentStatusText
  };
};

export default usePayment;