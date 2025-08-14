import { renderHook, act } from '@testing-library/react';
import { useStoreStore, STORE_PRODUCTS } from '../useStoreStore';
import { Product } from '../../types/store';

const mockProduct: Product = {
  id: 'test-product',
  name: 'Test Service',
  category: 'ai-service',
  price: 25,
  currency: 'AUD',
  description: 'Test description',
  shortDescription: 'Test short description',
  features: ['Feature 1', 'Feature 2'],
  deliveryTime: '2-3 hours',
  active: true,
  metadata: {
    isPackage: false,
    isFree: false
  }
};

const mockFreeProduct: Product = {
  ...mockProduct,
  id: 'free-product',
  name: 'Free Service',
  price: 0,
  metadata: {
    isPackage: false,
    isFree: true
  }
};

const mockPackageProduct: Product = {
  ...mockProduct,
  id: 'package-product',
  name: 'Package Service',
  category: 'package',
  price: 100,
  metadata: {
    isPackage: true,
    isFree: false
  }
};

describe('useStoreStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { setProducts, setFeaturedProducts, setSelectedProduct, setLoading, setError } = useStoreStore.getState();
    setProducts([]);
    setFeaturedProducts([]);
    setSelectedProduct(null);
    setLoading(false);
    setError(null);
  });

  describe('initial state', () => {
    it('has default products loaded', () => {
      // Reset to default state
      useStoreStore.getState().setProducts(STORE_PRODUCTS);
      
      const { result } = renderHook(() => useStoreStore());
      
      expect(result.current.products.length).toBeGreaterThan(0);
      expect(result.current.products).toEqual(STORE_PRODUCTS);
    });

    it('has correct initial state values', () => {
      const { result } = renderHook(() => useStoreStore());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.selectedProduct).toBe(null);
    });
  });

  describe('setProducts', () => {
    it('sets products correctly', () => {
      const { result } = renderHook(() => useStoreStore());
      const testProducts = [mockProduct, mockFreeProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      expect(result.current.products).toEqual(testProducts);
    });

    it('automatically sets featured products when setting products', () => {
      const { result } = renderHook(() => useStoreStore());
      const testProducts = [mockProduct, mockFreeProduct, mockPackageProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      expect(result.current.featuredProducts).toHaveLength(2); // free + package
      expect(result.current.featuredProducts).toContain(mockFreeProduct);
      expect(result.current.featuredProducts).toContain(mockPackageProduct);
      expect(result.current.featuredProducts).not.toContain(mockProduct);
    });
  });

  describe('setFeaturedProducts', () => {
    it('sets featured products independently', () => {
      const { result } = renderHook(() => useStoreStore());
      const featuredProducts = [mockPackageProduct];

      act(() => {
        result.current.setFeaturedProducts(featuredProducts);
      });

      expect(result.current.featuredProducts).toEqual(featuredProducts);
    });
  });

  describe('setSelectedProduct', () => {
    it('sets selected product', () => {
      const { result } = renderHook(() => useStoreStore());

      act(() => {
        result.current.setSelectedProduct(mockProduct);
      });

      expect(result.current.selectedProduct).toEqual(mockProduct);
    });

    it('clears selected product when set to null', () => {
      const { result } = renderHook(() => useStoreStore());

      act(() => {
        result.current.setSelectedProduct(mockProduct);
        result.current.setSelectedProduct(null);
      });

      expect(result.current.selectedProduct).toBe(null);
    });
  });

  describe('loading state', () => {
    it('sets loading state', () => {
      const { result } = renderHook(() => useStoreStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error state', () => {
    it('sets error state', () => {
      const { result } = renderHook(() => useStoreStore());
      const errorMessage = 'Failed to fetch products';

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('clears error state', () => {
      const { result } = renderHook(() => useStoreStore());

      act(() => {
        result.current.setError('Some error');
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('getProductById', () => {
    it('returns product when found', () => {
      const { result } = renderHook(() => useStoreStore());
      const testProducts = [mockProduct, mockFreeProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      const foundProduct = result.current.getProductById('test-product');
      expect(foundProduct).toEqual(mockProduct);
    });

    it('returns undefined when product not found', () => {
      const { result } = renderHook(() => useStoreStore());
      const testProducts = [mockProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      const foundProduct = result.current.getProductById('non-existent');
      expect(foundProduct).toBeUndefined();
    });
  });

  describe('getProductsByCategory', () => {
    it('returns products filtered by category', () => {
      const { result } = renderHook(() => useStoreStore());
      const aiProduct1 = { ...mockProduct, id: 'ai-1', category: 'ai-service' as const };
      const aiProduct2 = { ...mockProduct, id: 'ai-2', category: 'ai-service' as const };
      const professionalProduct = { ...mockProduct, id: 'prof-1', category: 'professional-service' as const };
      const testProducts = [aiProduct1, aiProduct2, professionalProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      const aiProducts = result.current.getProductsByCategory('ai-service');
      expect(aiProducts).toHaveLength(2);
      expect(aiProducts).toContain(aiProduct1);
      expect(aiProducts).toContain(aiProduct2);
      expect(aiProducts).not.toContain(professionalProduct);
    });

    it('returns empty array when no products match category', () => {
      const { result } = renderHook(() => useStoreStore());
      const testProducts = [mockProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      const packageProducts = result.current.getProductsByCategory('package');
      expect(packageProducts).toHaveLength(0);
    });

    it('handles all category types correctly', () => {
      const { result } = renderHook(() => useStoreStore());
      const aiProduct = { ...mockProduct, category: 'ai-service' as const };
      const professionalProduct = { ...mockProduct, id: 'prof-1', category: 'professional-service' as const };
      const packageProduct = { ...mockProduct, id: 'pack-1', category: 'package' as const };
      const testProducts = [aiProduct, professionalProduct, packageProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      expect(result.current.getProductsByCategory('ai-service')).toHaveLength(1);
      expect(result.current.getProductsByCategory('professional-service')).toHaveLength(1);
      expect(result.current.getProductsByCategory('package')).toHaveLength(1);
    });
  });

  describe('featured products logic', () => {
    it('includes free products in featured products', () => {
      const { result } = renderHook(() => useStoreStore());
      const freeProduct = { ...mockProduct, metadata: { isPackage: false, isFree: true } };
      const paidProduct = { ...mockProduct, id: 'paid', metadata: { isPackage: false, isFree: false } };
      const testProducts = [freeProduct, paidProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      expect(result.current.featuredProducts).toContain(freeProduct);
      expect(result.current.featuredProducts).not.toContain(paidProduct);
    });

    it('includes package products in featured products', () => {
      const { result } = renderHook(() => useStoreStore());
      const packageProduct = { ...mockProduct, metadata: { isPackage: true, isFree: false } };
      const regularProduct = { ...mockProduct, id: 'regular', metadata: { isPackage: false, isFree: false } };
      const testProducts = [packageProduct, regularProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      expect(result.current.featuredProducts).toContain(packageProduct);
      expect(result.current.featuredProducts).not.toContain(regularProduct);
    });

    it('includes both free and package products in featured products', () => {
      const { result } = renderHook(() => useStoreStore());
      const freeProduct = { ...mockProduct, id: 'free', metadata: { isPackage: false, isFree: true } };
      const packageProduct = { ...mockProduct, id: 'package', metadata: { isPackage: true, isFree: false } };
      const regularProduct = { ...mockProduct, id: 'regular', metadata: { isPackage: false, isFree: false } };
      const testProducts = [freeProduct, packageProduct, regularProduct];

      act(() => {
        result.current.setProducts(testProducts);
      });

      expect(result.current.featuredProducts).toHaveLength(2);
      expect(result.current.featuredProducts).toContain(freeProduct);
      expect(result.current.featuredProducts).toContain(packageProduct);
      expect(result.current.featuredProducts).not.toContain(regularProduct);
    });
  });

  describe('STORE_PRODUCTS data integrity', () => {
    it('has valid product structure', () => {
      expect(STORE_PRODUCTS.length).toBeGreaterThan(0);
      
      STORE_PRODUCTS.forEach(product => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('currency');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('shortDescription');
        expect(product).toHaveProperty('features');
        expect(product).toHaveProperty('deliveryTime');
        expect(product).toHaveProperty('active');
        expect(product).toHaveProperty('metadata');
        
        expect(Array.isArray(product.features)).toBe(true);
        expect(typeof product.price).toBe('number');
        expect(product.currency).toBe('AUD');
        expect(['ai-service', 'professional-service', 'package']).toContain(product.category);
      });
    });

    it('includes expected product types', () => {
      const categories = STORE_PRODUCTS.map(p => p.category);
      expect(categories).toContain('ai-service');
      expect(categories).toContain('professional-service');
      expect(categories).toContain('package');
    });

    it('has at least one free product', () => {
      const freeProducts = STORE_PRODUCTS.filter(p => p.price === 0);
      expect(freeProducts.length).toBeGreaterThan(0);
    });

    it('has package product with correct metadata', () => {
      const packageProduct = STORE_PRODUCTS.find(p => p.metadata.isPackage);
      expect(packageProduct).toBeDefined();
      expect(packageProduct?.metadata.includedServices).toBeDefined();
      expect(Array.isArray(packageProduct?.metadata.includedServices)).toBe(true);
    });
  });
});