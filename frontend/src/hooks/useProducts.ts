import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types/store';
import { ProductSearchRequest, ApiError } from '../types/api';
import { storeApi, storeApiUtils } from '../services/storeApi';

// Hook interface
export interface UseProductsReturn {
  // Data
  products: Product[];
  featuredProducts: Product[];
  selectedProduct: Product | null;
  
  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isSearching: boolean;
  
  // Error states
  error: ApiError | null;
  searchError: ApiError | null;
  
  // Actions
  fetchProducts: () => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
  searchProducts: (searchRequest: ProductSearchRequest) => Promise<Product[]>;
  filterProducts: (filters: any) => Product[];
  sortProducts: (sortBy: string, sortOrder?: 'asc' | 'desc') => Product[];
  
  // Utilities
  refresh: () => Promise<void>;
  clearErrors: () => void;
}

// Main products hook
export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [error, setError] = useState<ApiError | null>(null);
  const [searchError, setSearchError] = useState<ApiError | null>(null);

  // Fetch all products
  const fetchProducts = useCallback(async (): Promise<void> => {
    try {
      setIsFetching(true);
      setError(null);
      
      const data = await storeApi.getProducts();
      setProducts(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch products:', apiError);
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, []);

  // Fetch featured products
  const fetchFeaturedProducts = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      const data = await storeApi.getFeaturedProducts();
      setFeaturedProducts(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch featured products:', apiError);
    }
  }, []);

  // Fetch single product
  const fetchProduct = useCallback(async (id: string): Promise<Product | null> => {
    try {
      setError(null);
      
      const product = await storeApi.getProduct(id);
      setSelectedProduct(product);
      return product;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch product:', apiError);
      return null;
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (searchRequest: ProductSearchRequest): Promise<Product[]> => {
    try {
      setIsSearching(true);
      setSearchError(null);
      
      const response = await storeApi.searchProducts(searchRequest);
      return response.data;
    } catch (err) {
      const apiError = err as ApiError;
      setSearchError(apiError);
      console.error('Failed to search products:', apiError);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Filter products locally
  const filterProducts = useCallback((filters: any): Product[] => {
    return storeApiUtils.filterProducts(products, filters);
  }, [products]);

  // Sort products locally
  const sortProducts = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): Product[] => {
    return storeApiUtils.sortProducts(products, sortBy as any, sortOrder);
  }, [products]);

  // Refresh all data
  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([
      fetchProducts(),
      fetchFeaturedProducts()
    ]);
  }, [fetchProducts, fetchFeaturedProducts]);

  // Clear errors
  const clearErrors = useCallback((): void => {
    setError(null);
    setSearchError(null);
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchFeaturedProducts();
  }, [fetchProducts, fetchFeaturedProducts]);

  return {
    // Data
    products,
    featuredProducts,
    selectedProduct,
    
    // Loading states
    isLoading,
    isFetching,
    isSearching,
    
    // Error states
    error,
    searchError,
    
    // Actions
    fetchProducts,
    fetchFeaturedProducts,
    fetchProduct,
    searchProducts,
    filterProducts,
    sortProducts,
    
    // Utilities
    refresh,
    clearErrors
  };
};

// Hook for single product
export const useProduct = (productId?: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchProduct = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await storeApi.getProduct(id);
      setProduct(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch product:', apiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId, fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch: productId ? () => fetchProduct(productId) : undefined
  };
};

// Hook for product categories
export const useProductsByCategory = (category?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchProductsByCategory = useCallback(async (cat: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await storeApi.getProductsByCategory(cat);
      setProducts(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch products by category:', apiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (category) {
      fetchProductsByCategory(category);
    }
  }, [category, fetchProductsByCategory]);

  return {
    products,
    isLoading,
    error,
    refetch: category ? () => fetchProductsByCategory(category) : undefined
  };
};

// Hook for promo code validation
export const usePromoCode = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const validatePromoCode = useCallback(async (code: string) => {
    try {
      setIsValidating(true);
      setError(null);
      
      const result = await storeApi.validatePromoCode(code);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to validate promo code:', apiError);
      throw apiError;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validatePromoCode,
    isValidating,
    error,
    clearError: () => setError(null)
  };
};

export default useProducts;