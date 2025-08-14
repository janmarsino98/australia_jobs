import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ProductGrid from '../ProductGrid';
import { Product } from '../../../types/store';

const mockProducts: Product[] = [
  {
    id: 'ai-resume-review',
    name: 'AI Resume Review',
    category: 'ai-service',
    price: 0,
    currency: 'AUD',
    description: 'AI-powered resume analysis',
    shortDescription: 'Instant automated resume analysis',
    features: ['Instant analysis', 'ATS optimization'],
    deliveryTime: 'Instant',
    active: true,
    metadata: { isPackage: false, isFree: true }
  },
  {
    id: 'ai-resume-building',
    name: 'AI Resume Building',
    category: 'ai-service',
    price: 25,
    currency: 'AUD',
    description: 'AI-powered resume creation',
    shortDescription: 'AI-powered resume creation',
    features: ['AI-generated content', 'Professional formatting'],
    deliveryTime: '1-2 hours',
    active: true,
    metadata: { isPackage: false, isFree: false }
  },
  {
    id: 'professional-resume-review',
    name: 'Professional Resume Review',
    category: 'professional-service',
    price: 85,
    currency: 'AUD',
    description: 'Expert human resume review',
    shortDescription: 'Human expert resume review',
    features: ['Expert review', 'Personal consultation'],
    deliveryTime: '1-2 business days',
    active: true,
    metadata: { isPackage: false, isFree: false }
  },
  {
    id: 'professional-package',
    name: 'Complete Professional Package',
    category: 'package',
    price: 120,
    originalPrice: 150,
    savings: 30,
    currency: 'AUD',
    description: 'Resume + Cover Letter bundle',
    shortDescription: 'Resume + Cover Letter bundle',
    features: ['Professional resume review', 'Custom cover letter'],
    deliveryTime: '2-3 business days',
    active: true,
    metadata: { isPackage: true, isFree: false, includedServices: ['professional-resume-review'] }
  }
];

describe('ProductGrid', () => {
  const user = userEvent.setup();
  const mockOnProductSelect = jest.fn();
  const mockOnFiltersChange = jest.fn();
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders products in grid layout', () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect} 
      />
    );
    
    expect(screen.getByText('Our Services')).toBeInTheDocument();
    expect(screen.getByText('4 services')).toBeInTheDocument();
    
    // Check that all products are displayed
    expect(screen.getByText('AI Resume Review')).toBeInTheDocument();
    expect(screen.getByText('AI Resume Building')).toBeInTheDocument();
    expect(screen.getByText('Professional Resume Review')).toBeInTheDocument();
    expect(screen.getByText('Complete Professional Package')).toBeInTheDocument();
  });

  it('filters products by category', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    // Open category selector
    const categorySelect = screen.getByRole('combobox', { name: /filter by category/i });
    await user.click(categorySelect);
    
    // Select AI Services
    const aiOption = screen.getByText('AI Services');
    await user.click(aiOption);
    
    // Should show only AI services
    expect(screen.getByText('2 services')).toBeInTheDocument();
    expect(screen.getByText('AI Resume Review')).toBeInTheDocument();
    expect(screen.getByText('AI Resume Building')).toBeInTheDocument();
    expect(screen.queryByText('Professional Resume Review')).not.toBeInTheDocument();
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      category: ['ai-service']
    });
  });

  it('sorts products by price', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        onSortChange={mockOnSortChange}
      />
    );
    
    // Open sort selector
    const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
    await user.click(sortSelect);
    
    // Select Price
    const priceOption = screen.getByText('Price');
    await user.click(priceOption);
    
    expect(mockOnSortChange).toHaveBeenCalledWith('price');
  });

  it('sorts products by name', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        onSortChange={mockOnSortChange}
      />
    );
    
    // Open sort selector
    const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
    await user.click(sortSelect);
    
    // Select Name
    const nameOption = screen.getByText('Name');
    await user.click(nameOption);
    
    expect(mockOnSortChange).toHaveBeenCalledWith('name');
  });

  it('sorts products by delivery speed', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        sortBy="deliveryTime"
      />
    );
    
    const productCards = screen.getAllByText(/Delivery:/);
    
    // First should be instant delivery (fastest)
    const firstCard = productCards[0].closest('[class*="rounded-lg"]');
    expect(firstCard).toHaveTextContent('Instant');
  });

  it('displays comparison view when toggled', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        showComparison={true}
      />
    );
    
    // Should show comparison toggle when AI and Professional services are available
    const compareButton = screen.getByText('Compare');
    await user.click(compareButton);
    
    // Should show comparison component
    expect(screen.getByText('AI vs Professional Services')).toBeInTheDocument();
    expect(screen.queryByText('Our Services')).not.toBeInTheDocument(); // Grid header should be hidden
  });

  it('hides comparison view when not available', () => {
    const aiOnlyProducts = mockProducts.filter(p => p.category === 'ai-service');
    
    render(
      <ProductGrid 
        products={aiOnlyProducts} 
        onProductSelect={mockOnProductSelect}
        showComparison={true}
      />
    );
    
    // Should not show comparison toggle when only AI services
    expect(screen.queryByText('Compare')).not.toBeInTheDocument();
  });

  it('displays active filters', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        filters={{ showFreeOnly: true }}
      />
    );
    
    // Should show active filter badge
    expect(screen.getByText('Active filters:')).toBeInTheDocument();
    expect(screen.getByText('Free Only')).toBeInTheDocument();
  });

  it('allows removing active filters', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    // First set a category filter
    const categorySelect = screen.getByRole('combobox', { name: /filter by category/i });
    await user.click(categorySelect);
    const aiOption = screen.getByText('AI Services');
    await user.click(aiOption);
    
    // Should show active filter with remove button
    const removeButton = screen.getByRole('button', { name: /×/ });
    await user.click(removeButton);
    
    expect(mockOnFiltersChange).toHaveBeenLastCalledWith({
      category: undefined
    });
  });

  it('displays no services found message when filters return empty results', () => {
    render(
      <ProductGrid 
        products={[]} 
        onProductSelect={mockOnProductSelect}
      />
    );
    
    expect(screen.getByText('No services found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or browse all services.')).toBeInTheDocument();
    expect(screen.getByText('Show All Services')).toBeInTheDocument();
  });

  it('filters products by free only', () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        filters={{ showFreeOnly: true }}
      />
    );
    
    // Should only show free products
    expect(screen.getByText('1 service')).toBeInTheDocument();
    expect(screen.getByText('AI Resume Review')).toBeInTheDocument();
    expect(screen.queryByText('AI Resume Building')).not.toBeInTheDocument();
  });

  it('filters products by price range', () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        filters={{ priceRange: [20, 100] }}
      />
    );
    
    // Should show products in price range (25, 85)
    expect(screen.getByText('2 services')).toBeInTheDocument();
    expect(screen.getByText('AI Resume Building')).toBeInTheDocument();
    expect(screen.getByText('Professional Resume Review')).toBeInTheDocument();
    expect(screen.queryByText('AI Resume Review')).not.toBeInTheDocument(); // Free (0)
    expect(screen.queryByText('Complete Professional Package')).not.toBeInTheDocument(); // 120
  });

  it('filters products by delivery time', () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        filters={{ deliveryTime: ['instant'] }}
      />
    );
    
    // Should show only instant delivery products
    expect(screen.getByText('1 service')).toBeInTheDocument();
    expect(screen.getByText('AI Resume Review')).toBeInTheDocument();
  });

  it('displays featured products correctly', () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        featuredProductIds={['ai-resume-review']}
      />
    );
    
    // Featured product should have special styling
    const featuredCard = screen.getByText('AI Resume Review').closest('[class*="ring-2"]');
    expect(featuredCard).toBeInTheDocument();
  });

  it('calls onProductSelect when product is selected', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
      />
    );
    
    const addToCartButton = screen.getAllByText('Add to Cart')[0];
    await user.click(addToCartButton);
    
    expect(mockOnProductSelect).toHaveBeenCalledWith(mockProducts[1]); // First paid product
  });

  it('displays quick stats correctly', () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
      />
    );
    
    // Check stats
    expect(screen.getByText('1')).toBeInTheDocument(); // Free Services count
    expect(screen.getByText('Free Services')).toBeInTheDocument();
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Instant Delivery count
    expect(screen.getByText('Instant Delivery')).toBeInTheDocument();
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Professional Services count
    expect(screen.getByText('Professional Services')).toBeInTheDocument();
  });

  it('handles category label mapping correctly', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
      />
    );
    
    const categorySelect = screen.getByRole('combobox', { name: /filter by category/i });
    await user.click(categorySelect);
    
    expect(screen.getByText('AI Services')).toBeInTheDocument();
    expect(screen.getByText('Professional Services')).toBeInTheDocument();
    expect(screen.getByText('Package Deals')).toBeInTheDocument();
    expect(screen.getByText('All Services')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        className="custom-grid"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-grid');
  });

  it('handles empty products array gracefully', () => {
    render(
      <ProductGrid 
        products={[]} 
        onProductSelect={mockOnProductSelect}
      />
    );
    
    expect(screen.getByText('0 services')).toBeInTheDocument();
    expect(screen.getByText('No services found')).toBeInTheDocument();
  });

  it('updates service count when filtering', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    // Initially shows all services
    expect(screen.getByText('4 services')).toBeInTheDocument();
    
    // Filter to AI services
    const categorySelect = screen.getByRole('combobox', { name: /filter by category/i });
    await user.click(categorySelect);
    const aiOption = screen.getByText('AI Services');
    await user.click(aiOption);
    
    // Should update count
    expect(screen.getByText('2 services')).toBeInTheDocument();
  });

  it('handles singular vs plural service count correctly', () => {
    const singleProduct = [mockProducts[0]];
    
    render(
      <ProductGrid 
        products={singleProduct} 
        onProductSelect={mockOnProductSelect}
      />
    );
    
    expect(screen.getByText('1 service')).toBeInTheDocument();
  });

  it('maintains view mode state correctly', async () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockOnProductSelect}
        showComparison={true}
      />
    );
    
    // Switch to comparison view
    const compareButton = screen.getByText('Compare');
    await user.click(compareButton);
    
    expect(screen.getByText('AI vs Professional Services')).toBeInTheDocument();
    
    // Switch back to grid view
    const gridButton = screen.getByText('Grid View');
    await user.click(gridButton);
    
    expect(screen.getByText('Our Services')).toBeInTheDocument();
    expect(screen.queryByText('AI vs Professional Services')).not.toBeInTheDocument();
  });

  it('shows correct delivery speed sorting order', () => {
    const productsWithVariousDelivery = [
      { ...mockProducts[0], deliveryTime: '1 week' },
      { ...mockProducts[1], deliveryTime: 'Instant' },
      { ...mockProducts[2], deliveryTime: '2 days' },
      { ...mockProducts[3], deliveryTime: '3 hours' }
    ];
    
    render(
      <ProductGrid 
        products={productsWithVariousDelivery} 
        onProductSelect={mockOnProductSelect}
        sortBy="deliveryTime"
      />
    );
    
    // Products should be ordered by delivery speed (instant -> hours -> days -> weeks)
    const deliveryElements = screen.getAllByText(/Delivery:/);
    expect(deliveryElements[0]).toHaveTextContent('Instant');
    expect(deliveryElements[1]).toHaveTextContent('3 hours');
    expect(deliveryElements[2]).toHaveTextContent('2 days');
    expect(deliveryElements[3]).toHaveTextContent('1 week');
  });
});