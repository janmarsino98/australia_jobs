import { renderHook, act } from '@testing-library/react';
import useCartStore from '../useCartStore';
import { Product } from '../../types/store';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

const mockProduct: Product = {
  id: 'test-product',
  name: 'Test AI Service',
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
  name: 'Free AI Review',
  price: 0,
  metadata: {
    isPackage: false,
    isFree: true
  }
};

const mockPackageProduct: Product = {
  ...mockProduct,
  id: 'package-product',
  name: 'Professional Package',
  category: 'package',
  price: 150,
  originalPrice: 200,
  savings: 50,
  metadata: {
    isPackage: true,
    isFree: false,
    includedServices: ['test-product', 'another-service']
  }
};

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCartStore.getState().clearCart();
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('addItem', () => {
    it('adds a new item to the cart', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const { items } = result.current;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('test-product');
      expect(items[0].name).toBe('Test AI Service');
      expect(items[0].price).toBe(25);
      expect(items[0].quantity).toBe(1);
    });

    it('increases quantity when adding existing item', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
        result.current.addItem(mockProduct);
      });

      const { items } = result.current;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('calculates totals after adding item', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const { subtotal, gst, total } = result.current;
      expect(subtotal).toBe(25);
      expect(gst).toBe(2.5); // 10% GST
      expect(total).toBe(27.5);
    });

    it('handles adding free products', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockFreeProduct);
      });

      const { items, subtotal, gst, total } = result.current;
      expect(items).toHaveLength(1);
      expect(items[0].price).toBe(0);
      expect(subtotal).toBe(0);
      expect(gst).toBe(0);
      expect(total).toBe(0);
    });

    it('resolves conflicts when adding package that includes individual services', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct); // Add individual service first
        result.current.addItem(mockPackageProduct); // Add package that includes it
      });

      const { items } = result.current;
      // Should only have the package, not the individual service
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('package-product');
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.removeItem(itemId);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('recalculates totals after removing item', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      expect(result.current.total).toBe(27.5);

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.removeItem(itemId);
      });

      expect(result.current.subtotal).toBe(0);
      expect(result.current.gst).toBe(0);
      expect(result.current.total).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 3);
      });

      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.subtotal).toBe(75); // 25 * 3
      expect(result.current.total).toBe(82.5); // 75 + 7.5 GST
    });

    it('removes item when quantity is set to 0 or less', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 0);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('clears all items and resets totals', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
        result.current.applyPromoCode('SAVE10');
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.subtotal).toBe(0);
      expect(result.current.gst).toBe(0);
      expect(result.current.total).toBe(0);
      expect(result.current.promoCode).toBeUndefined();
      expect(result.current.promoDiscount).toBe(0);
    });
  });

  describe('promo codes', () => {
    it('applies valid promo code', async () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      await act(async () => {
        await result.current.applyPromoCode('SAVE10');
      });

      expect(result.current.promoCode).toBe('SAVE10');
      expect(result.current.promoDiscount).toBe(0.1);
      expect(result.current.total).toBe(24.75); // 25 - 2.5 (10% discount) + 2.25 GST
    });

    it('rejects invalid promo code', async () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      await expect(
        act(async () => {
          await result.current.applyPromoCode('INVALID');
        })
      ).rejects.toThrow('Invalid promo code');

      expect(result.current.promoCode).toBeUndefined();
      expect(result.current.promoDiscount).toBe(0);
    });

    it('accepts multiple valid promo codes', async () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      // Test different valid codes
      await act(async () => {
        await result.current.applyPromoCode('WELCOME');
      });

      expect(result.current.promoCode).toBe('WELCOME');
      expect(result.current.promoDiscount).toBe(0.15);

      await act(async () => {
        await result.current.applyPromoCode('FIRSTTIME');
      });

      expect(result.current.promoCode).toBe('FIRSTTIME');
      expect(result.current.promoDiscount).toBe(0.2);
    });

    it('removes promo code', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(async () => {
        await result.current.applyPromoCode('SAVE10');
      });

      act(() => {
        result.current.removePromoCode();
      });

      expect(result.current.promoCode).toBeUndefined();
      expect(result.current.promoDiscount).toBe(0);
      expect(result.current.total).toBe(27.5); // Back to original total
    });
  });

  describe('cart state management', () => {
    it('toggles cart open state', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggleCart();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggleCart();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('recommendations', () => {
    it('returns empty recommendations when no relevant items', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const recommendations = result.current.getRecommendations();
      expect(recommendations).toHaveLength(0);
    });

    it('returns package recommendations when individual services are present', () => {
      const { result } = renderHook(() => useCartStore());

      const resumeService: Product = {
        ...mockProduct,
        id: 'resume-service',
        name: 'Professional Resume Review',
        category: 'professional-service'
      };

      act(() => {
        result.current.addItem(resumeService);
      });

      const recommendations = result.current.getRecommendations();
      // Should recommend package deal
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('totals calculation', () => {
    it('calculates GST correctly', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({ ...mockProduct, price: 100 });
      });

      const { subtotal, gst, total } = result.current;
      expect(subtotal).toBe(100);
      expect(gst).toBe(10); // 10% of 100
      expect(total).toBe(110);
    });

    it('applies promo discount before calculating GST', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({ ...mockProduct, price: 100 });
      });

      act(async () => {
        await result.current.applyPromoCode('SAVE10'); // 10% discount
      });

      const { subtotal, gst, total } = result.current;
      expect(subtotal).toBe(100); // Original subtotal
      expect(gst).toBe(9); // 10% of 90 (after discount)
      expect(total).toBe(99); // 90 (discounted) + 9 (GST)
    });

    it('handles multiple items with different quantities', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({ ...mockProduct, price: 25 });
        result.current.addItem({ ...mockProduct, id: 'product-2', price: 50 });
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 2);
      });

      const { subtotal, gst, total } = result.current;
      expect(subtotal).toBe(100); // (25 * 2) + (50 * 1)
      expect(gst).toBe(10);
      expect(total).toBe(110);
    });
  });

  describe('persistence', () => {
    it('persists cart data to localStorage', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(async () => {
        await result.current.applyPromoCode('SAVE10');
      });

      // Check if localStorage.setItem was called
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      const calls = localStorageMock.setItem.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe('ausjobs-cart');
      
      const storedData = JSON.parse(lastCall[1]);
      expect(storedData).toHaveProperty('items');
      expect(storedData).toHaveProperty('promoCode');
      expect(storedData).toHaveProperty('promoDiscount');
    });
  });
});