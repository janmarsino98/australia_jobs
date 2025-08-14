import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../ProductCard';
import { Product } from '../../../types/store';

const mockProduct: Product = {
  id: 'test-product',
  name: 'Test AI Service',
  category: 'ai-service',
  price: 25,
  currency: 'AUD',
  description: 'Test description for AI service',
  shortDescription: 'Test short description',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
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
    includedServices: ['resume-review', 'cover-letter']
  }
};

describe('ProductCard', () => {
  const mockAddToCart = jest.fn();
  const mockCompare = jest.fn();

  beforeEach(() => {
    mockAddToCart.mockClear();
    mockCompare.mockClear();
  });

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    expect(screen.getByText('Test AI Service')).toBeInTheDocument();
    expect(screen.getByText('Test short description')).toBeInTheDocument();
    expect(screen.getByText('AU$25')).toBeInTheDocument();
    expect(screen.getByText('AI Powered')).toBeInTheDocument();
  });

  it('renders all product features', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
    
    // Check for checkmark icons
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks).toHaveLength(3);
  });

  it('displays delivery time correctly', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    expect(screen.getByText('Delivery: 2-3 hours')).toBeInTheDocument();
  });

  it('calls onAddToCart when Add to Cart button is clicked', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);
    
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('displays "Get Free Review" for free products', () => {
    render(<ProductCard product={mockFreeProduct} onAddToCart={mockAddToCart} />);
    
    expect(screen.getByRole('button', { name: /get free review/i })).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('shows compare button when onCompare is provided', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockAddToCart} 
        onCompare={mockCompare}
      />
    );
    
    const compareButton = screen.getByRole('button', { name: /compare services/i });
    expect(compareButton).toBeInTheDocument();
    
    fireEvent.click(compareButton);
    expect(mockCompare).toHaveBeenCalledWith(mockProduct);
  });

  it('hides compare button when onCompare is not provided', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    expect(screen.queryByRole('button', { name: /compare services/i })).not.toBeInTheDocument();
  });

  it('displays featured styling when featured is true', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockAddToCart} 
        featured={true}
      />
    );
    
    expect(screen.getByText('⭐ Featured Service')).toBeInTheDocument();
    
    // Check for featured ring styling
    const card = screen.getByText('Test AI Service').closest('[class*="ring-2"]');
    expect(card).toBeInTheDocument();
  });

  it('displays savings when showSavings is true and product has savings', () => {
    render(
      <ProductCard 
        product={mockPackageProduct} 
        onAddToCart={mockAddToCart} 
        showSavings={true}
      />
    );
    
    expect(screen.getByText('Save AU$50')).toBeInTheDocument();
    expect(screen.getByText('AU$200')).toHaveClass('line-through');
  });

  it('hides savings when showSavings is false', () => {
    render(
      <ProductCard 
        product={mockPackageProduct} 
        onAddToCart={mockAddToCart} 
        showSavings={false}
      />
    );
    
    expect(screen.queryByText('Save AU$50')).not.toBeInTheDocument();
  });

  it('disables button when product is not active', () => {
    const inactiveProduct = { ...mockProduct, active: false };
    render(<ProductCard product={inactiveProduct} onAddToCart={mockAddToCart} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addButton).toBeDisabled();
  });

  it('applies custom className when provided', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockAddToCart} 
        className="custom-card-class"
      />
    );
    
    const card = screen.getByText('Test AI Service').closest('[class*="custom-card-class"]');
    expect(card).toBeInTheDocument();
  });

  it('displays different badge types correctly', () => {
    const { rerender } = render(
      <ProductCard product={mockProduct} onAddToCart={mockAddToCart} />
    );
    expect(screen.getByText('AI Powered')).toBeInTheDocument();
    
    const professionalProduct = { ...mockProduct, category: 'professional-service' as const };
    rerender(<ProductCard product={professionalProduct} onAddToCart={mockAddToCart} />);
    expect(screen.getByText('Professional')).toBeInTheDocument();
    
    rerender(<ProductCard product={mockPackageProduct} onAddToCart={mockAddToCart} />);
    expect(screen.getByText('Package Deal')).toBeInTheDocument();
  });

  it('handles hover effects correctly', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    const card = screen.getByText('Test AI Service').closest('[class*="hover:shadow-lg"]');
    expect(card).toHaveClass('transition-shadow', 'duration-200');
  });
});