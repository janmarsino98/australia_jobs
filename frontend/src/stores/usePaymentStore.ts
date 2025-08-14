import { create } from 'zustand';

export enum CheckoutStep {
  CART_REVIEW = 'cart-review',
  USER_DETAILS = 'user-details',
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation'
}

export interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ServiceRequirements {
  resumeFile?: File;
  jobPostingUrl?: string;
  targetRole?: string;
  industry?: string;
  additionalNotes?: string;
}

interface PaymentState {
  currentStep: CheckoutStep;
  customerDetails: CustomerDetails;
  serviceRequirements: ServiceRequirements;
  paymentMethod?: string;
  orderId?: string;
  isProcessing: boolean;
  error: string | null;
  
  // Actions
  setStep: (step: CheckoutStep) => void;
  updateCustomerDetails: (details: Partial<CustomerDetails>) => void;
  updateServiceRequirements: (requirements: Partial<ServiceRequirements>) => void;
  setPaymentMethod: (method: string) => void;
  setOrderId: (orderId: string) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  resetCheckout: () => void;
}

const initialCustomerDetails: CustomerDetails = {
  email: '',
  firstName: '',
  lastName: '',
  phone: ''
};

const initialServiceRequirements: ServiceRequirements = {
  resumeFile: undefined,
  jobPostingUrl: '',
  targetRole: '',
  industry: '',
  additionalNotes: ''
};

const usePaymentStore = create<PaymentState>((set) => ({
  currentStep: CheckoutStep.CART_REVIEW,
  customerDetails: initialCustomerDetails,
  serviceRequirements: initialServiceRequirements,
  paymentMethod: undefined,
  orderId: undefined,
  isProcessing: false,
  error: null,

  setStep: (step: CheckoutStep) => {
    set({ currentStep: step, error: null });
  },

  updateCustomerDetails: (details: Partial<CustomerDetails>) => {
    set(state => ({
      customerDetails: { ...state.customerDetails, ...details },
      error: null
    }));
  },

  updateServiceRequirements: (requirements: Partial<ServiceRequirements>) => {
    set(state => ({
      serviceRequirements: { ...state.serviceRequirements, ...requirements },
      error: null
    }));
  },

  setPaymentMethod: (method: string) => {
    set({ paymentMethod: method, error: null });
  },

  setOrderId: (orderId: string) => {
    set({ orderId, error: null });
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  resetCheckout: () => {
    set({
      currentStep: CheckoutStep.CART_REVIEW,
      customerDetails: initialCustomerDetails,
      serviceRequirements: initialServiceRequirements,
      paymentMethod: undefined,
      orderId: undefined,
      isProcessing: false,
      error: null
    });
  }
}));

export default usePaymentStore;