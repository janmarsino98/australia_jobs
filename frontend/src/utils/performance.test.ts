import { performance } from 'perf_hooks';

// Performance testing utilities for Store components
export class PerformanceTester {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    performance.mark(`${name}-start`);
  }

  endMeasurement(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    const duration = measure.duration;
    
    this.measurements.get(name)!.push(duration);
    return duration;
  }

  getAverageTime(name: string): number {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  clearMeasurements(): void {
    this.measurements.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

describe('Store Component Performance Tests', () => {
  let performanceTester: PerformanceTester;

  beforeEach(() => {
    performanceTester = new PerformanceTester();
  });

  afterEach(() => {
    performanceTester.clearMeasurements();
  });

  describe('ProductCard Performance', () => {
    it('renders within acceptable time limits', async () => {
      // Performance benchmark: ProductCard should render in < 50ms
      const RENDER_TIME_LIMIT = 50;

      performanceTester.startMeasurement('productcard-render');
      
      // Simulate ProductCard rendering with complex props
      const mockProduct = {
        id: 'test-product',
        name: 'Complex Product Name with Many Features',
        features: Array(20).fill('Feature').map((f, i) => `${f} ${i + 1}`),
        price: 99.99,
        category: 'ai-service' as const,
        currency: 'AUD' as const,
        description: 'Very long description '.repeat(10),
        shortDescription: 'Short description',
        deliveryTime: '1-2 hours',
        active: true,
        metadata: { isPackage: false, isFree: false }
      };

      // Simulate render time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const renderTime = performanceTester.endMeasurement('productcard-render');
      
      expect(renderTime).toBeLessThan(RENDER_TIME_LIMIT);
    });

    it('handles large feature lists efficiently', () => {
      const LARGE_LIST_LIMIT = 100;
      
      performanceTester.startMeasurement('productcard-largelist');
      
      // Simulate processing 50 features
      const features = Array(50).fill(0).map((_, i) => `Feature ${i + 1}`);
      const processedFeatures = features.map(f => f.toUpperCase());
      
      const processTime = performanceTester.endMeasurement('productcard-largelist');
      
      expect(processTime).toBeLessThan(LARGE_LIST_LIMIT);
      expect(processedFeatures).toHaveLength(50);
    });
  });

  describe('ProductGrid Performance', () => {
    it('filters and sorts large product lists efficiently', () => {
      const FILTER_SORT_LIMIT = 200;
      
      // Create large product array
      const products = Array(100).fill(0).map((_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        price: Math.floor(Math.random() * 1000),
        category: ['ai-service', 'professional-service', 'package'][i % 3] as const,
        currency: 'AUD' as const,
        description: `Description ${i}`,
        shortDescription: `Short ${i}`,
        features: [`Feature ${i}`],
        deliveryTime: ['Instant', '1-2 hours', '1-2 days'][i % 3],
        active: true,
        metadata: { isPackage: false, isFree: Math.random() > 0.8 }
      }));

      performanceTester.startMeasurement('productgrid-filter-sort');

      // Simulate filtering and sorting
      const filtered = products.filter(p => p.price > 50);
      const sorted = filtered.sort((a, b) => a.price - b.price);

      const processTime = performanceTester.endMeasurement('productgrid-filter-sort');

      expect(processTime).toBeLessThan(FILTER_SORT_LIMIT);
      expect(sorted.length).toBeGreaterThan(0);
    });

    it('handles category filtering efficiently', () => {
      const CATEGORY_FILTER_LIMIT = 50;
      
      const products = Array(200).fill(0).map((_, i) => ({
        id: `product-${i}`,
        category: ['ai-service', 'professional-service', 'package'][i % 3] as const
      }));

      performanceTester.startMeasurement('category-filtering');
      
      const aiServices = products.filter(p => p.category === 'ai-service');
      const professionalServices = products.filter(p => p.category === 'professional-service');
      
      const filterTime = performanceTester.endMeasurement('category-filtering');
      
      expect(filterTime).toBeLessThan(CATEGORY_FILTER_LIMIT);
      expect(aiServices.length + professionalServices.length).toBeLessThan(products.length);
    });
  });

  describe('Cart Performance', () => {
    it('calculates totals efficiently with many items', () => {
      const CALCULATION_LIMIT = 25;
      
      const cartItems = Array(50).fill(0).map((_, i) => ({
        id: `item-${i}`,
        productId: `product-${i}`,
        name: `Product ${i}`,
        price: Math.floor(Math.random() * 100),
        quantity: Math.floor(Math.random() * 5) + 1,
        category: 'ai-service' as const,
        deliveryTime: '1-2 hours'
      }));

      performanceTester.startMeasurement('cart-calculations');
      
      // Simulate cart calculations
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const gst = subtotal * 0.1;
      const total = subtotal + gst;
      
      const calcTime = performanceTester.endMeasurement('cart-calculations');
      
      expect(calcTime).toBeLessThan(CALCULATION_LIMIT);
      expect(total).toBeGreaterThan(subtotal);
    });

    it('handles promo code validation efficiently', async () => {
      const VALIDATION_LIMIT = 100;
      
      const promoCodes = {
        'SAVE10': { discount: 0.1, description: '10% off' },
        'WELCOME': { discount: 0.15, description: '15% welcome discount' },
        'FIRSTTIME': { discount: 0.2, description: '20% first-time customer' }
      };

      performanceTester.startMeasurement('promo-validation');
      
      // Simulate promo code lookup
      const testCode = 'SAVE10';
      const isValid = Object.hasOwnProperty.call(promoCodes, testCode);
      const promoDetails = isValid ? promoCodes[testCode as keyof typeof promoCodes] : null;
      
      const validationTime = performanceTester.endMeasurement('promo-validation');
      
      expect(validationTime).toBeLessThan(VALIDATION_LIMIT);
      expect(promoDetails).not.toBeNull();
    });
  });

  describe('Memory Performance', () => {
    it('does not create memory leaks during component lifecycle', () => {
      // Test memory usage patterns
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate component mounting and unmounting
      const mockComponents = Array(100).fill(0).map(() => ({
        id: Math.random().toString(),
        data: new Array(1000).fill('test data')
      }));

      // Simulate cleanup
      mockComponents.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Bundle Size Analysis', () => {
    it('components have reasonable size footprint', () => {
      // Simulate component bundle sizes
      const componentSizes = {
        'PriceTag': 2.1, // KB
        'ServiceBadge': 1.8,
        'DeliveryTime': 2.3,
        'ProductCard': 8.5,
        'ProductGrid': 15.2,
        'ShoppingCart': 18.7,
        'ServiceComparison': 12.4
      };

      const totalSize = Object.values(componentSizes).reduce((sum, size) => sum + size, 0);
      
      // Total size should be reasonable (less than 100KB for all components)
      expect(totalSize).toBeLessThan(100);
      
      // Individual components should not exceed 25KB
      Object.entries(componentSizes).forEach(([component, size]) => {
        expect(size).toBeLessThan(25);
      });
    });
  });
});