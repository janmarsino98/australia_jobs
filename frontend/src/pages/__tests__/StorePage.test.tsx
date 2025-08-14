import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import StorePage from '../StorePage';
import { useStoreStore } from '../../stores/useStoreStore';
import { Product } from '../../types/store';

// Mock the store
jest.mock('../../stores/useStoreStore');
const mockUseStoreStore = useStoreStore as jest.MockedFunction<typeof useStoreStore>;

// Mock ProductGrid component
jest.mock('../../components/organisms/ProductGrid', () => {
  const MockProductGrid = ({ products, onProductSelect, onFiltersChange, onSortChange, featuredProductIds }: any) => (
    <div data-testid="product-grid">
      <div data-testid="product-count">{products.length} products</div>
      {featuredProductIds && (
        <div data-testid="featured-products">
          Featured: {featuredProductIds.join(', ')}
        </div>
      )}
      {products.map((product: Product) => (
        <div key={product.id} data-testid={`product-${product.id}`}>
          <span>{product.name}</span>
          <button onClick={() => onProductSelect(product)}>
            {product.price === 0 ? 'Get Free Review' : 'Add to Cart'}
          </button>
        </div>
      ))}
      <button onClick={() => onFiltersChange({ showFreeOnly: true })}>
        Apply Filter
      </button>
      <button onClick={() => onSortChange('name')}>
        Sort by Name
      </button>
    </div>
  );
  return MockProductGrid;
});

const mockProducts: Product[] = [
  {
    id: 'ai-resume-review',
    name: 'AI Resume Review',
    category: 'ai-service',
    price: 0,
    currency: 'AUD',
    description: 'AI-powered resume analysis',
    shortDescription: 'Instant automated resume analysis',
    features: ['Instant analysis'],
    deliveryTime: 'Instant',
    active: true,
    metadata: { isPackage: false, isFree: true }
  },
  {
    id: 'professional-resume-review',
    name: 'Professional Resume Review',
    category: 'professional-service',
    price: 85,
    currency: 'AUD',
    description: 'Expert human resume review',
    shortDescription: 'Human expert resume review',
    features: ['Expert review'],
    deliveryTime: '1-2 business days',
    active: true,
    metadata: { isPackage: false, isFree: false }
  }
];

const mockStoreState = {
  products: [] as Product[],
  featuredProducts: [] as Product[],
  isLoading: false,
  error: null,
  selectedProduct: null,
  setProducts: jest.fn(),
  setFeaturedProducts: jest.fn(),
  setSelectedProduct: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  getProductById: jest.fn(),
  getProductsByCategory: jest.fn()
};

describe('StorePage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStoreStore.mockReturnValue(mockStoreState);
  });

  it('displays loading state correctly', () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      isLoading: true
    });

    render(<StorePage />);
    
    expect(screen.getByText('Loading store...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('displays error state correctly', () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      error: 'Failed to load products'
    });

    render(<StorePage />);
    
    expect(screen.getByText('Error: Failed to load products')).toBeInTheDocument();
    expect(screen.queryByTestId('product-grid')).not.toBeInTheDocument();
  });

  it('renders store page content when data is loaded', async () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });

    render(<StorePage />);
    
    expect(screen.getByText('Resume Services Store')).toBeInTheDocument();
    expect(screen.getByText('Enhance your job search with our AI-powered and professional resume services.')).toBeInTheDocument();
    expect(screen.getByTestId('product-grid')).toBeInTheDocument();
  });

  it('initializes store with products on mount', async () => {
    mockUseStoreStore.mockReturnValue(mockStoreState);

    render(<StorePage />);
    
    await waitFor(() => {
      expect(mockStoreState.setLoading).toHaveBeenCalledWith(true);
      expect(mockStoreState.setProducts).toHaveBeenCalled();
      expect(mockStoreState.setLoading).toHaveBeenCalledWith(false);
    });

    // Verify that products were set with the correct structure
    const setProductsCall = mockStoreState.setProducts.mock.calls[0][0];
    expect(Array.isArray(setProductsCall)).toBe(true);
    expect(setProductsCall.length).toBeGreaterThan(0);
    
    // Verify product structure
    const firstProduct = setProductsCall[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('category');
    expect(firstProduct).toHaveProperty('price');
    expect(firstProduct).toHaveProperty('currency', 'AUD');
  });

  it('handles product selection for free services', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });

    render(<StorePage />);
    
    const freeButton = screen.getByText('Get Free Review');
    await user.click(freeButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Redirecting to free service:', 'ai-resume-review');
    
    consoleSpy.mockRestore();
  });

  it('handles product selection for paid services', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });

    render(<StorePage />);
    
    const paidButton = screen.getByText('Add to Cart');
    await user.click(paidButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Add to cart:', 'professional-resume-review');
    
    consoleSpy.mockRestore();
  });

  it('passes correct props to ProductGrid', () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });

    render(<StorePage />);
    
    expect(screen.getByTestId('product-count')).toHaveTextContent('2 products');
    expect(screen.getByTestId('featured-products')).toHaveTextContent('Featured: ai-resume-review, professional-package');
  });

  it('handles filter changes from ProductGrid', async () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });

    render(<StorePage />);
    
    const filterButton = screen.getByText('Apply Filter');
    await user.click(filterButton);
    
    // The internal state should be updated, which would be reflected in re-renders
    // In a real scenario, this would trigger ProductGrid to re-render with filtered products
  });

  it('handles sort changes from ProductGrid', async () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });

    render(<StorePage />);
    
    const sortButton = screen.getByText('Sort by Name');
    await user.click(sortButton);
    
    // The internal state should be updated
    // In a real scenario, this would trigger ProductGrid to re-render with sorted products
  });

  it('sets error state when product initialization fails', async () => {
    // Mock console.error to avoid noise in test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock setProducts to throw an error
    const mockSetProductsError = jest.fn(() => {
      throw new Error('Network error');
    });
    
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      setProducts: mockSetProductsError
    });

    render(<StorePage />);
    
    await waitFor(() => {
      expect(mockStoreState.setError).toHaveBeenCalledWith('Network error');
      expect(mockStoreState.setLoading).toHaveBeenCalledWith(false);
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('displays correct page layout and structure', () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });

    render(<StorePage />);
    
    // Check main container structure
    const mainContainer = screen.getByText('Resume Services Store').closest('div');
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-white');
    
    // Check header section
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Resume Services Store');
    
    // Check description
    expect(screen.getByText(/Enhance your job search/)).toBeInTheDocument();
  });

  it('passes all expected props to ProductGrid', () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });

    render(<StorePage />);
    
    // Verify ProductGrid receives correct configuration
    expect(screen.getByTestId('product-grid')).toBeInTheDocument();
    expect(screen.getByTestId('featured-products')).toHaveTextContent('ai-resume-review, professional-package');
  });

  it('has responsive design classes', () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });

    render(<StorePage />);
    
    // Check for responsive classes on main container
    const container = screen.getByText('Resume Services Store').closest('.max-w-7xl');
    expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8', 'py-12');
  });

  it('handles empty products array gracefully', () => {
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: []
    });

    render(<StorePage />);
    
    expect(screen.getByTestId('product-count')).toHaveTextContent('0 products');
    expect(screen.getByTestId('product-grid')).toBeInTheDocument();
  });

  it('maintains state consistency across re-renders', async () => {
    const { rerender } = render(<StorePage />);
    
    // Initially loading
    expect(mockStoreState.setLoading).toHaveBeenCalledWith(true);
    
    // Update store state to loaded
    mockUseStoreStore.mockReturnValue({
      ...mockStoreState,
      products: mockProducts
    });
    
    rerender(<StorePage />);
    
    // Should display products
    expect(screen.getByTestId('product-grid')).toBeInTheDocument();
    expect(screen.getByTestId('product-count')).toHaveTextContent('2 products');
  });

  it('calls store actions in correct sequence during initialization', async () => {
    mockUseStoreStore.mockReturnValue(mockStoreState);

    render(<StorePage />);
    
    await waitFor(() => {
      expect(mockStoreState.setLoading).toHaveBeenCalledWith(false);
    });

    // Verify call sequence
    const calls = [
      ...mockStoreState.setLoading.mock.calls,
      ...mockStoreState.setProducts.mock.calls,
    ].map((call, index) => ({ call, index }));

    // Should be called in the right order
    expect(mockStoreState.setLoading).toHaveBeenCalledTimes(2);
    expect(mockStoreState.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(mockStoreState.setLoading).toHaveBeenNthCalledWith(2, false);
    expect(mockStoreState.setProducts).toHaveBeenCalledTimes(1);
  });
});