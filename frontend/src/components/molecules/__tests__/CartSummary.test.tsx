import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CartSummary from '../CartSummary';
import useCartStore from '../../../stores/useCartStore';
import { CartItem } from '../../../types/store';

// Mock the cart store
jest.mock('../../../stores/useCartStore');

const mockUseCartStore = useCartStore as jest.MockedFunction<typeof useCartStore>;

const mockCartItem: CartItem = {
  id: 'cart-1',
  productId: 'test-product',
  name: 'Test Service',
  price: 25,
  category: 'ai-service',
  quantity: 1,
  deliveryTime: '2-3 hours'
};

const mockFreeCartItem: CartItem = {
  id: 'cart-2',
  productId: 'free-product',
  name: 'Free AI Review',
  price: 0,
  category: 'ai-service',
  quantity: 1,
  deliveryTime: 'Instant'
};

const mockCartStore = {
  items: [] as CartItem[],
  subtotal: 0,
  gst: 0,
  total: 0,
  promoCode: undefined,
  promoDiscount: 0
};

describe('CartSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCartStore.mockReturnValue(mockCartStore);
  });

  it('displays empty cart message when cart is empty', () => {
    render(<CartSummary />);
    
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('generic', { name: /shopping.*cart/i })).toBeInTheDocument();
  });

  it('displays order summary with items', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25,
      gst: 2.5,
      total: 27.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary />);
    
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('1 item')).toBeInTheDocument();
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('2-3 hours')).toBeInTheDocument();
  });

  it('displays correct item count with multiple items', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem, { ...mockCartItem, id: 'cart-2', quantity: 2 }]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary />);
    
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('displays quantity information for items with quantity > 1', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [{ ...mockCartItem, quantity: 3 }],
      subtotal: 75,
      gst: 7.5,
      total: 82.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary />);
    
    expect(screen.getByText('Qty: 3')).toBeInTheDocument();
    expect(screen.getByText('AU$75')).toBeInTheDocument();
  });

  it('displays pricing breakdown correctly', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25,
      gst: 2.5,
      total: 27.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary />);
    
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('AU$25.00')).toBeInTheDocument();
    expect(screen.getByText('GST (10%)')).toBeInTheDocument();
    expect(screen.getByText('AU$2.50')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('AU$27.50')).toBeInTheDocument();
  });

  it('displays promo discount when applied', () => {
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

    render(<CartSummary />);
    
    expect(screen.getByText('Discount (SAVE10)')).toBeInTheDocument();
    expect(screen.getByText('-AU$2.50')).toBeInTheDocument();
  });

  it('shows free services note when cart contains free items', () => {
    const storeWithFreeItem = {
      ...mockCartStore,
      items: [mockFreeCartItem],
      subtotal: 0,
      gst: 0,
      total: 0
    };
    mockUseCartStore.mockReturnValue(storeWithFreeItem);

    render(<CartSummary />);
    
    expect(screen.getByText('💡 Free services will be processed immediately without payment')).toBeInTheDocument();
  });

  it('displays "Process Free Services" button when total is 0', () => {
    const storeWithFreeItem = {
      ...mockCartStore,
      items: [mockFreeCartItem],
      subtotal: 0,
      gst: 0,
      total: 0
    };
    mockUseCartStore.mockReturnValue(storeWithFreeItem);

    render(<CartSummary />);
    
    expect(screen.getByText('Process Free Services')).toBeInTheDocument();
  });

  it('displays checkout button with total when items cost money', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25,
      gst: 2.5,
      total: 27.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary />);
    
    expect(screen.getByText('Checkout (AU$27.50)')).toBeInTheDocument();
  });

  it('calls onCheckout when checkout button is clicked', () => {
    const mockOnCheckout = jest.fn();
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      total: 27.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary onCheckout={mockOnCheckout} />);
    
    const checkoutButton = screen.getByRole('button', { name: /checkout/i });
    fireEvent.click(checkoutButton);
    
    expect(mockOnCheckout).toHaveBeenCalled();
  });

  it('hides title when showTitle is false', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary showTitle={false} />);
    
    expect(screen.queryByText('Order Summary')).not.toBeInTheDocument();
  });

  it('hides items when showItems is false', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25,
      gst: 2.5,
      total: 27.5
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary showItems={false} />);
    
    expect(screen.queryByText('Test Service')).not.toBeInTheDocument();
    expect(screen.getByText('Subtotal')).toBeInTheDocument(); // But totals should still show
  });

  it('applies compact styling when compact is true', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary compact={true} />);
    
    // In compact mode, additional info should not be displayed
    expect(screen.queryByText('💳 Secure checkout with Stripe')).not.toBeInTheDocument();
    expect(screen.queryByText('🔒 SSL encrypted')).not.toBeInTheDocument();
    expect(screen.queryByText('📧 Order confirmation via email')).not.toBeInTheDocument();
  });

  it('displays additional security info in non-compact mode', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary compact={false} />);
    
    expect(screen.getByText('💳 Secure checkout with Stripe')).toBeInTheDocument();
    expect(screen.getByText('🔒 SSL encrypted')).toBeInTheDocument();
    expect(screen.getByText('📧 Order confirmation via email')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<CartSummary className="custom-summary" />);
    
    const card = screen.getByText('Your cart is empty').closest('[class*="custom-summary"]');
    expect(card).toBeInTheDocument();
  });

  it('formats currency amounts correctly', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [mockCartItem],
      subtotal: 25.99,
      gst: 2.599,
      total: 28.589
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary />);
    
    expect(screen.getByText('AU$25.99')).toBeInTheDocument();
    expect(screen.getByText('AU$2.60')).toBeInTheDocument();
    expect(screen.getByText('AU$28.59')).toBeInTheDocument();
  });

  it('calculates total items correctly across multiple cart items', () => {
    const storeWithItems = {
      ...mockCartStore,
      items: [
        { ...mockCartItem, quantity: 2 },
        { ...mockCartItem, id: 'cart-2', quantity: 3 }
      ]
    };
    mockUseCartStore.mockReturnValue(storeWithItems);

    render(<CartSummary />);
    
    expect(screen.getByText('5 items')).toBeInTheDocument();
  });

  it('disables checkout button when cart is empty', () => {
    render(<CartSummary />);
    
    // For empty cart, the checkout button doesn't exist
    expect(screen.queryByRole('button', { name: /checkout/i })).not.toBeInTheDocument();
  });
});