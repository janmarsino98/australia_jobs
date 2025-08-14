import httpClient from '../httpClient';
import { Product } from '../types/store';
import {
  ProductResponse,
  SingleProductResponse,
  PromoValidationResponse,
  PromoCodeResponse,
  ProductSearchRequest,
  ProductSearchResponse,
  ApiError
} from '../types/api';

// Store API Service Interface
export interface StoreApiService {
  getProducts: () => Promise<Product[]>;
  getProduct: (id: string) => Promise<Product>;
  searchProducts: (searchRequest: ProductSearchRequest) => Promise<ProductSearchResponse>;
  getFeaturedProducts: () => Promise<Product[]>;
  getProductsByCategory: (category: string) => Promise<Product[]>;
  validatePromoCode: (code: string) => Promise<PromoCodeResponse>;
}

// Error handling utility
const handleApiError = (error: any): never => {
  if (error.response?.data) {
    const apiError: ApiError = {
      message: error.response.data.message || error.response.data.error || 'An error occurred',
      code: error.response.data.code,
      field: error.response.data.field,
      details: error.response.data.details
    };
    throw apiError;
  }
  
  if (error.request) {
    throw new Error('Network error - unable to reach server');
  }
  
  throw new Error(error.message || 'An unexpected error occurred');
};

// Store API implementation
export const storeApi: StoreApiService = {
  /**
   * Fetch all available products
   */
  async getProducts(): Promise<Product[]> {
    try {
      const response = await httpClient.get<ProductResponse>('/api/store/products');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch products');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Fetch a single product by ID
   */
  async getProduct(id: string): Promise<Product> {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      const response = await httpClient.get<SingleProductResponse>(`/api/store/products/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch product');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Search products with filters and pagination
   */
  async searchProducts(searchRequest: ProductSearchRequest): Promise<ProductSearchResponse> {
    try {
      const response = await httpClient.post<ProductSearchResponse>('/api/store/products/search', {
        ...searchRequest,
        page: searchRequest.page || 1,
        limit: searchRequest.limit || 10
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to search products');
      }
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Fetch featured products
   */
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const response = await httpClient.get<ProductResponse>('/api/store/products/featured');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch featured products');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Fetch products by category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      if (!category) {
        throw new Error('Category is required');
      }

      const response = await httpClient.get<ProductResponse>(`/api/store/products/category/${category}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch products by category');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Validate a promotional code
   */
  async validatePromoCode(code: string): Promise<PromoCodeResponse> {
    try {
      if (!code || !code.trim()) {
        throw new Error('Promo code is required');
      }

      const response = await httpClient.post<PromoValidationResponse>('/api/store/validate-promo', { 
        code: code.trim().toUpperCase() 
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to validate promo code');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Utility functions for common operations
export const storeApiUtils = {
  /**
   * Check if a product is free
   */
  isProductFree: (product: Product): boolean => {
    return product.price === 0 || product.metadata.isFree;
  },

  /**
   * Check if a product is a package deal
   */
  isPackageProduct: (product: Product): boolean => {
    return product.metadata.isPackage;
  },

  /**
   * Calculate savings for a product
   */
  calculateSavings: (product: Product): number => {
    if (product.originalPrice && product.price < product.originalPrice) {
      return product.originalPrice - product.price;
    }
    return product.savings || 0;
  },

  /**
   * Format price for display
   */
  formatPrice: (amount: number, currency = 'AUD'): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  },

  /**
   * Get product category display name
   */
  getCategoryDisplayName: (category: string): string => {
    const categoryMap: Record<string, string> = {
      'ai-service': 'AI Service',
      'professional-service': 'Professional Service',
      'package': 'Package Deal'
    };
    return categoryMap[category] || category;
  },

  /**
   * Sort products by criteria
   */
  sortProducts: (products: Product[], sortBy: 'price' | 'name' | 'deliveryTime' | 'popularity', sortOrder: 'asc' | 'desc' = 'asc'): Product[] => {
    const sorted = [...products].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'deliveryTime':
          // Simple heuristic for delivery time sorting
          const timeA = a.deliveryTime.toLowerCase().includes('instant') ? 0 : 
                       a.deliveryTime.toLowerCase().includes('hour') ? 1 : 
                       a.deliveryTime.toLowerCase().includes('day') ? 2 : 3;
          const timeB = b.deliveryTime.toLowerCase().includes('instant') ? 0 : 
                       b.deliveryTime.toLowerCase().includes('hour') ? 1 : 
                       b.deliveryTime.toLowerCase().includes('day') ? 2 : 3;
          comparison = timeA - timeB;
          break;
        case 'popularity':
          // Could be enhanced with actual popularity metrics
          comparison = (b.metadata.isFree ? 1 : 0) - (a.metadata.isFree ? 1 : 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  },

  /**
   * Filter products based on criteria
   */
  filterProducts: (products: Product[], filters: {
    category?: string[];
    priceRange?: [number, number];
    deliveryTime?: string[];
    features?: string[];
  }): Product[] => {
    return products.filter(product => {
      // Category filter
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(product.category)) {
          return false;
        }
      }
      
      // Price range filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        if (product.price < min || product.price > max) {
          return false;
        }
      }
      
      // Delivery time filter (simple text matching)
      if (filters.deliveryTime && filters.deliveryTime.length > 0) {
        const matchesDeliveryTime = filters.deliveryTime.some(timeFilter => 
          product.deliveryTime.toLowerCase().includes(timeFilter.toLowerCase())
        );
        if (!matchesDeliveryTime) {
          return false;
        }
      }
      
      // Features filter
      if (filters.features && filters.features.length > 0) {
        const matchesFeature = filters.features.some(featureFilter => 
          product.features.some(feature => 
            feature.toLowerCase().includes(featureFilter.toLowerCase())
          )
        );
        if (!matchesFeature) {
          return false;
        }
      }
      
      return true;
    });
  }
};

export default storeApi;