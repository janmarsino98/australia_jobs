import httpClient from '../httpClient';
import {
  PaymentIntentRequest,
  PaymentIntentResponse,
  PaymentConfirmationResponse,
  PaymentIntentApiResponse,
  PaymentConfirmationApiResponse,
  ApiError
} from '../types/api';

// Payment API Service Interface
export interface PaymentApiService {
  createPaymentIntent: (paymentData: PaymentIntentRequest) => Promise<PaymentIntentResponse>;
  confirmPayment: (paymentIntentId: string, paymentMethodId?: string) => Promise<PaymentConfirmationResponse>;
  getPaymentStatus: (paymentIntentId: string) => Promise<PaymentConfirmationResponse>;
  refundPayment: (paymentIntentId: string, amount?: number, reason?: string) => Promise<{ success: boolean; refundId: string; }>;
  getPaymentMethods: (customerId?: string) => Promise<any[]>;
  savePaymentMethod: (paymentMethodId: string, customerId: string) => Promise<{ success: boolean; }>;
}

// Error handling utility
const handleApiError = (error: any): never => {
  if (error.response?.data) {
    const apiError: ApiError = {
      message: error.response.data.message || error.response.data.error || 'Payment processing error',
      code: error.response.data.code,
      field: error.response.data.field,
      details: error.response.data.details
    };
    throw apiError;
  }
  
  if (error.request) {
    throw new Error('Network error - unable to process payment');
  }
  
  throw new Error(error.message || 'Payment processing failed');
};

// Payment API implementation
export const paymentApi: PaymentApiService = {
  /**
   * Create a payment intent for Stripe checkout
   */
  async createPaymentIntent(paymentData: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      // Validate required fields
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error('Valid payment amount is required');
      }
      
      if (!paymentData.orderId) {
        throw new Error('Order ID is required');
      }

      const response = await httpClient.post<PaymentIntentApiResponse>('/api/payments/create-intent', {
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency || 'aud',
        orderId: paymentData.orderId,
        metadata: {
          orderId: paymentData.orderId,
          timestamp: new Date().toISOString()
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create payment intent');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Confirm payment after client-side processing
   */
  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentConfirmationResponse> {
    try {
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required');
      }

      const response = await httpClient.post<PaymentConfirmationApiResponse>('/api/payments/confirm', {
        paymentIntentId,
        paymentMethodId,
        confirmedAt: new Date().toISOString()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to confirm payment');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId: string): Promise<PaymentConfirmationResponse> {
    try {
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required');
      }

      const response = await httpClient.get<PaymentConfirmationApiResponse>(`/api/payments/status/${paymentIntentId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get payment status');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Process refund for a payment
   */
  async refundPayment(paymentIntentId: string, amount?: number, reason?: string): Promise<{ success: boolean; refundId: string; }> {
    try {
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required');
      }

      const response = await httpClient.post(`/api/payments/refund`, {
        paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if provided
        reason,
        requestedAt: new Date().toISOString()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to process refund');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get saved payment methods for customer
   */
  async getPaymentMethods(customerId?: string): Promise<any[]> {
    try {
      const url = customerId ? `/api/payments/methods/${customerId}` : '/api/payments/methods';
      const response = await httpClient.get(url);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch payment methods');
      }
      
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Save payment method for future use
   */
  async savePaymentMethod(paymentMethodId: string, customerId: string): Promise<{ success: boolean; }> {
    try {
      if (!paymentMethodId || !customerId) {
        throw new Error('Payment method ID and customer ID are required');
      }

      const response = await httpClient.post(`/api/payments/methods/save`, {
        paymentMethodId,
        customerId,
        savedAt: new Date().toISOString()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to save payment method');
      }
      
      return { success: true };
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Utility functions for payment operations
export const paymentApiUtils = {
  /**
   * Format amount for display
   */
  formatAmount: (amountInCents: number, currency = 'AUD'): string => {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  },

  /**
   * Convert dollars to cents
   */
  toCents: (dollarAmount: number): number => {
    return Math.round(dollarAmount * 100);
  },

  /**
   * Convert cents to dollars
   */
  toDollars: (centsAmount: number): number => {
    return centsAmount / 100;
  },

  /**
   * Validate card number format (basic Luhn algorithm)
   */
  validateCardNumber: (cardNumber: string): boolean => {
    const sanitized = cardNumber.replace(/\D/g, '');
    if (sanitized.length < 13 || sanitized.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  /**
   * Get card brand from number
   */
  getCardBrand: (cardNumber: string): string => {
    const sanitized = cardNumber.replace(/\D/g, '');
    
    if (/^4/.test(sanitized)) return 'visa';
    if (/^5[1-5]/.test(sanitized) || /^2[2-7]/.test(sanitized)) return 'mastercard';
    if (/^3[47]/.test(sanitized)) return 'amex';
    if (/^6(?:011|5)/.test(sanitized)) return 'discover';
    if (/^35(?:2[89]|[3-8])/.test(sanitized)) return 'jcb';
    if (/^30[0-5]/.test(sanitized) || /^36/.test(sanitized) || /^38/.test(sanitized)) return 'dinersclub';
    
    return 'unknown';
  },

  /**
   * Validate expiry date
   */
  validateExpiry: (month: string, year: string): boolean => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);
    
    // Handle 2-digit year
    const fullYear = expYear < 100 ? 2000 + expYear : expYear;
    
    if (expMonth < 1 || expMonth > 12) return false;
    if (fullYear < currentYear) return false;
    if (fullYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  },

  /**
   * Validate CVV
   */
  validateCVV: (cvv: string, cardBrand?: string): boolean => {
    const sanitized = cvv.replace(/\D/g, '');
    
    if (cardBrand === 'amex') {
      return sanitized.length === 4;
    }
    
    return sanitized.length === 3;
  },

  /**
   * Format card number for display
   */
  formatCardNumber: (cardNumber: string): string => {
    const sanitized = cardNumber.replace(/\D/g, '');
    const brand = paymentApiUtils.getCardBrand(sanitized);
    
    if (brand === 'amex') {
      return sanitized.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    } else {
      return sanitized.replace(/(\d{4})/g, '$1 ').trim();
    }
  },

  /**
   * Mask card number for security
   */
  maskCardNumber: (cardNumber: string): string => {
    const sanitized = cardNumber.replace(/\D/g, '');
    if (sanitized.length < 4) return cardNumber;
    
    const lastFour = sanitized.slice(-4);
    const masked = '*'.repeat(sanitized.length - 4);
    return `${masked}${lastFour}`;
  },

  /**
   * Calculate processing fee (if applicable)
   */
  calculateProcessingFee: (amount: number, feePercentage = 0.029, fixedFee = 0.30): number => {
    return (amount * feePercentage) + fixedFee;
  },

  /**
   * Get payment status color class
   */
  getPaymentStatusColor: (status: string): string => {
    const colorMap: Record<string, string> = {
      'succeeded': 'text-green-600 bg-green-100',
      'failed': 'text-red-600 bg-red-100',
      'requires_action': 'text-yellow-600 bg-yellow-100',
      'processing': 'text-blue-600 bg-blue-100',
      'canceled': 'text-gray-600 bg-gray-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  },

  /**
   * Get payment status display text
   */
  getPaymentStatusText: (status: string): string => {
    const statusMap: Record<string, string> = {
      'succeeded': 'Payment Successful',
      'failed': 'Payment Failed',
      'requires_action': 'Action Required',
      'processing': 'Processing Payment',
      'canceled': 'Payment Canceled'
    };
    return statusMap[status] || status;
  },

  /**
   * Check if payment can be refunded
   */
  canRefund: (paymentStatus: string, paymentDate: string): boolean => {
    if (paymentStatus !== 'succeeded') return false;
    
    // Check if payment is within refund window (e.g., 30 days)
    const paymentTime = new Date(paymentDate).getTime();
    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    return (now - paymentTime) <= thirtyDays;
  },

  /**
   * Generate payment receipt data
   */
  generateReceiptData: (paymentIntent: PaymentIntentResponse, order: any) => {
    return {
      receiptNumber: `RCP-${paymentIntent.paymentIntentId.slice(-8).toUpperCase()}`,
      paymentIntentId: paymentIntent.paymentIntentId,
      orderId: order.id,
      amount: paymentApiUtils.formatAmount(paymentIntent.amount),
      currency: paymentIntent.currency.toUpperCase(),
      paymentDate: new Date().toISOString(),
      customerEmail: order.customerEmail,
      items: order.items,
      subtotal: order.subtotal,
      gst: order.gst,
      total: order.total
    };
  }
};

export default paymentApi;