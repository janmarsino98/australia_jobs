import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ShoppingCart from '../ShoppingCart';
import useCartStore from '../../../stores/useCartStore';
import { Product, CartItem } from '../../../types/store';

// Mock the toast hook
jest.mock('../ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock the cart store
jest.mock('../../../stores/useCartStore');

const mockUseCartStore = useCartStore as jest.MockedFunction<typeof useCartStore>;

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

const mockCartItem: CartItem = {
  id: 'cart-1',
  productId: 'test-product',
  name: 'Test Service',
  price: 25,
  category: 'ai-service',
  quantity: 1,
  deliveryTime: '2-3 hours'
};

const mockCartStore = {
  items: [] as CartItem[],
  subtotal: 0,
  gst: 0,
  total: 0,
  promoCode: undefined,
  promoDiscount: 0,
  isOpen: false,
  toggleCart: jest.fn(),
  updateQuantity: jest.fn(),
  removeItem: jest.fn(),
  clearCart: jest.fn(),
  applyPromoCode: jest.fn(),
  removePromoCode: jest.fn(),
  getRecommendations: jest.fn(() => [])
};

describe('ShoppingCart', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCartStore.mockReturnValue(mockCartStore);
  });

  it('displays empty cart message when cart is empty', () => {
    render(<ShoppingCart />);
    
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Add some services to get started')).toBeInTheDocument();
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });

  it('displays cart items when cart has items', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25,
      gst: 2.5,
      total: 27.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('AI Powered')).toBeInTheDocument();
    expect(screen.getByText('2-3 hours')).toBeInTheDocument();
    expect(screen.getByText('AU$25')).toBeInTheDocument();
  });

  it('calls updateQuantity when quantity buttons are clicked', async () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [{ ...mockCartItem, quantity: 2 }],
      subtotal: 50,
      gst: 5,
      total: 55
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    const minusButton = screen.getByRole('button', { name: /minus/i });
    const plusButton = screen.getByRole('button', { name: /plus/i });
    
    await user.click(minusButton);
    expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('cart-1', 1);
    
    await user.click(plusButton);
    expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('cart-1', 3);
  });

  it('calls removeItem when delete button is clicked', async () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    const deleteButton = screen.getByRole('button', { name: /trash/i });
    await user.click(deleteButton);
    
    expect(mockCartStore.removeItem).toHaveBeenCalledWith('cart-1');
  });

  it('disables minus button when quantity is 1', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [{ ...mockCartItem, quantity: 1 }]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    const minusButton = screen.getByRole('button', { name: /minus/i });
    expect(minusButton).toBeDisabled();
  });

  it('disables plus button when quantity is 5', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [{ ...mockCartItem, quantity: 5 }]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    const plusButton = screen.getByRole('button', { name: /plus/i });
    expect(plusButton).toBeDisabled();
  });

  it('displays cart totals correctly', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25,
      gst: 2.5,
      total: 27.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('AU$25.00')).toBeInTheDocument();
    expect(screen.getByText('GST (10%)')).toBeInTheDocument();
    expect(screen.getByText('AU$2.50')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('AU$27.50')).toBeInTheDocument();
  });

  it('displays promo code discount when applied', () => {
    const storeWithPromo = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25,
      gst: 2.25,
      total: 24.75,
      promoCode: 'SAVE10',
      promoDiscount: 0.1
    };
    mockUseCartStore.mockReturnValue(storeWithPromo);

    render(<ShoppingCart />);
    
    expect(screen.getByText('SAVE10')).toBeInTheDocument();
    expect(screen.getByText('10% off')).toBeInTheDocument();
    expect(screen.getByText('Discount (SAVE10)')).toBeInTheDocument();
    expect(screen.getByText('-AU$2.50')).toBeInTheDocument();
  });

  it('allows applying a promo code', async () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25,
      gst: 2.5,
      total: 27.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    const promoInput = screen.getByPlaceholderText('Enter code');
    const applyButton = screen.getByRole('button', { name: /apply/i });
    
    await user.type(promoInput, 'SAVE10');
    await user.click(applyButton);
    
    expect(mockCartStore.applyPromoCode).toHaveBeenCalledWith('SAVE10');
  });

  it('allows removing a promo code', async () => {
    const storeWithPromo = {
      ...mockCartStore,
      items: [mockCartItem],
      promoCode: 'SAVE10',
      promoDiscount: 0.1
    };
    mockUseCartStore.mockReturnValue(storeWithPromo);

    render(<ShoppingCart />);
    
    const removePromoButton = screen.getByRole('button', { name: /x/i });
    await user.click(removePromoButton);
    
    expect(mockCartStore.removePromoCode).toHaveBeenCalled();
  });

  it('displays recommendations when available', () => {
    const mockRecommendation = {
      ...mockProduct,
      id: 'recommended-product',
      name: 'Recommended Service',
      savings: 10
    };
    
    const storeWithRecommendations = {
      ...mockCartStore,
      items: [mockCartItem],
      getRecommendations: jest.fn(() => [mockRecommendation])
    };
    mockUseCartStore.mockReturnValue(storeWithRecommendations);

    render(<ShoppingCart />);
    
    expect(screen.getByText('💡 Recommended for you')).toBeInTheDocument();
    expect(screen.getByText('Recommended Service')).toBeInTheDocument();
    expect(screen.getByText('Save AU$10')).toBeInTheDocument();
  });

  it('calls clearCart when clear cart button is clicked', async () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    const clearButton = screen.getByText('Clear Cart');
    await user.click(clearButton);
    
    expect(mockCartStore.clearCart).toHaveBeenCalled();
  });

  it('calls onCheckout when checkout button is clicked', async () => {
    const mockOnCheckout = jest.fn();
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      total: 27.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart onCheckout={mockOnCheckout} />);
    
    const checkoutButton = screen.getByText('Checkout (AU$27.50)');
    await user.click(checkoutButton);
    
    expect(mockOnCheckout).toHaveBeenCalled();
    expect(mockCartStore.toggleCart).toHaveBeenCalled();
  });

  it('shows shopping cart count in title', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem, { ...mockCartItem, id: 'cart-2' }]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    expect(screen.getByText('Shopping Cart (2)')).toBeInTheDocument();
  });

  it('closes cart when Continue Shopping is clicked', async () => {
    render(<ShoppingCart />);
    
    const continueButton = screen.getByText('Continue Shopping');
    await user.click(continueButton);
    
    expect(mockCartStore.toggleCart).toHaveBeenCalled();
  });

  it('formats currency correctly', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25.5,
      gst: 2.55,
      total: 28.05
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<ShoppingCart />);
    
    expect(screen.getByText('AU$25.50')).toBeInTheDocument();
    expect(screen.getByText('AU$2.55')).toBeInTheDocument();
    expect(screen.getByText('AU$28.05')).toBeInTheDocument();
  });
});