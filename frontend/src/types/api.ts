import { Product, CartItem } from './store';

// Common API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

// Store/Product API Types
export interface PromoCodeResponse {
  valid: boolean;
  discount: number;
  discountType: 'percentage' | 'fixed';
  code: string;
  message?: string;
}

export interface ProductResponse extends ApiResponse<Product[]> {}
export interface SingleProductResponse extends ApiResponse<Product> {}
export interface PromoValidationResponse extends ApiResponse<PromoCodeResponse> {}

// Order API Types
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ServiceRequirements {
  resumeFile?: File;
  jobPostingUrl?: string;
  targetRole?: string;
  industry?: string;
  additionalNotes?: string;
  contactPreferences?: {
    email?: string;
    phone?: string;
    preferredTime?: string;
  };
}

export interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerEmail: string;
  customerDetails: CustomerDetails;
  items: CartItem[];
  status: OrderStatus;
  paymentIntentId?: string;
  paymentMethod?: string;
  serviceRequirements: ServiceRequirements;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  subtotal: number;
  gst: number;
  total: number;
  promoCode?: string;
  promoDiscount?: number;
}

export interface CreateOrderRequest {
  customerDetails: CustomerDetails;
  items: CartItem[];
  serviceRequirements: ServiceRequirements;
  promoCode?: string;
}

export interface OrderResponse extends ApiResponse<Order> {}
export interface OrdersResponse extends ApiResponse<Order[]> {}

// Payment API Types
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmationResponse {
  success: boolean;
  paymentIntentId: string;
  status: 'succeeded' | 'failed' | 'requires_action';
  orderId?: string;
  error?: string;
}

export interface PaymentIntentRequest {
  amount: number;
  orderId: string;
  currency?: string;
}

export interface PaymentIntentApiResponse extends ApiResponse<PaymentIntentResponse> {}
export interface PaymentConfirmationApiResponse extends ApiResponse<PaymentConfirmationResponse> {}

// Service Delivery API Types
export interface ReviewResult {
  atsScore: number;
  overallScore: number;
  sections: {
    contact: { score: number; feedback: string; };
    summary: { score: number; feedback: string; };
    experience: { score: number; feedback: string; };
    education: { score: number; feedback: string; };
    skills: { score: number; feedback: string; };
    formatting: { score: number; feedback: string; };
  };
  recommendations: string[];
  keywords: {
    missing: string[];
    present: string[];
  };
  estimatedReadingTime: string;
  reportUrl?: string;
}

export interface ResumeRequirements {
  targetRole: string;
  industry: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  skills: string[];
  achievements: string[];
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  workExperience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
  }>;
}

export interface BookingPreferences {
  preferredDates: string[];
  timeSlots: string[];
  communicationMethod: 'video' | 'phone' | 'in-person';
  specialRequests?: string;
}

export interface BookingConfirmation {
  bookingId: string;
  consultantName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  meetingLink?: string;
  instructions?: string;
}

export interface ReviewResultResponse extends ApiResponse<ReviewResult> {}
export interface BookingConfirmationResponse extends ApiResponse<BookingConfirmation> {}

// Loading and Error State Types
export interface LoadingState {
  isLoading: boolean;
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
  clearLoading: () => void;
}

export interface ErrorState {
  error: ApiError | null;
  errors: Record<string, ApiError>;
  setError: (key: string, error: ApiError | null) => void;
  clearError: (key?: string) => void;
  clearAllErrors: () => void;
}

// Pagination Types
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Search and Filter Types
export interface SearchFilters {
  category?: string[];
  priceRange?: [number, number];
  deliveryTime?: string[];
  features?: string[];
}

export interface SortOptions {
  sortBy: 'price' | 'name' | 'deliveryTime' | 'popularity' | 'rating';
  sortOrder: 'asc' | 'desc';
}

export interface ProductSearchRequest {
  query?: string;
  filters?: SearchFilters;
  sort?: SortOptions;
  page?: number;
  limit?: number;
}

export interface ProductSearchResponse extends PaginatedResponse<Product> {}