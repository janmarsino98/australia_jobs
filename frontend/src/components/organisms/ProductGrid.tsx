import React, { useState, useMemo } from 'react';
import { Product } from '../../types/store';
import ProductCard from '../molecules/ProductCard';
import ServiceComparison from '../molecules/ServiceComparison';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

interface ProductGridFilters {
  category?: string[];
  priceRange?: [number, number];
  deliveryTime?: string[];
  showFreeOnly?: boolean;
}

interface ProductGridProps {
  products: Product[];
  filters?: ProductGridFilters;
  sortBy?: 'price' | 'name' | 'deliveryTime';
  onProductSelect: (product: Product) => void;
  onFiltersChange?: (filters: ProductGridFilters) => void;
  onSortChange?: (sortBy: 'price' | 'name' | 'deliveryTime') => void;
  showComparison?: boolean;
  featuredProductIds?: string[];
  className?: string;
}

type ViewMode = 'grid' | 'comparison';

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  filters = {},
  sortBy = 'price',
  onProductSelect,
  onFiltersChange,
  onSortChange,
  showComparison = true,
  featuredProductIds = [],
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>(sortBy);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Apply free only filter
    if (filters.showFreeOnly) {
      filtered = filtered.filter(product => product.price === 0);
    }

    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      filtered = filtered.filter(product => product.price >= min && product.price <= max);
    }

    // Apply delivery time filter
    if (filters.deliveryTime && filters.deliveryTime.length > 0) {
      filtered = filtered.filter(product => 
        filters.deliveryTime!.some(time => 
          product.deliveryTime.toLowerCase().includes(time.toLowerCase())
        )
      );
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'price':
          return a.price - b.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'deliveryTime':
          // Sort by delivery speed (instant first, then hours, days, etc.)
          const getDeliveryOrder = (time: string) => {
            const lower = time.toLowerCase();
            if (lower.includes('instant')) return 0;
            if (lower.includes('hour')) return 1;
            if (lower.includes('day')) return 2;
            if (lower.includes('week')) return 3;
            return 4;
          };
          return getDeliveryOrder(a.deliveryTime) - getDeliveryOrder(b.deliveryTime);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, selectedCategory, selectedSort, filters]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const unique = [...new Set(products.map(p => p.category))];
    return unique;
  }, [products]);

  // Get comparison products
  const aiService = filteredAndSortedProducts.find(p => p.category === 'ai-service');
  const professionalService = filteredAndSortedProducts.find(p => p.category === 'professional-service');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        category: category === 'all' ? undefined : [category]
      });
    }
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    if (onSortChange) {
      onSortChange(sort as 'price' | 'name' | 'deliveryTime');
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ai-service': return 'AI Services';
      case 'professional-service': return 'Professional Services';
      case 'package': return 'Package Deals';
      default: return 'All Services';
    }
  };


  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <h2 className="text-2xl font-semibold text-main-text">
            Our Services
          </h2>
          <Badge variant="outline" className="text-xs">
            {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'service' : 'services'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* View Mode Toggle */}
          {showComparison && aiService && professionalService && (
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="text-xs"
              >
                Grid View
              </Button>
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('comparison')}
                className="text-xs"
              >
                Compare
              </Button>
            </div>
          )}

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {getCategoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={selectedSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="deliveryTime">Delivery Speed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'comparison' && showComparison ? (
        <ServiceComparison
          aiService={aiService}
          professionalService={professionalService}
          onSelectService={onProductSelect}
        />
      ) : (
        <>
          {/* Active Filters Display */}
          {(selectedCategory !== 'all' || filters.showFreeOnly) && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {getCategoryLabel(selectedCategory)}
                  <button 
                    onClick={() => handleCategoryChange('all')}
                    className="ml-2 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.showFreeOnly && (
                <Badge variant="secondary" className="text-xs">
                  Free Only
                </Badge>
              )}
            </div>
          )}

          {/* Product Grid */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or browse all services.</p>
              <Button variant="outline" onClick={() => handleCategoryChange('all')}>
                Show All Services
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onProductSelect}
                  featured={featuredProductIds.includes(product.id)}
                  showSavings={true}
                />
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {products.filter(p => p.price === 0).length}
              </div>
              <div className="text-sm text-blue-600">Free Services</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {products.filter(p => p.deliveryTime.toLowerCase().includes('instant')).length}
              </div>
              <div className="text-sm text-green-600">Instant Delivery</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {products.filter(p => p.category === 'professional-service').length}
              </div>
              <div className="text-sm text-purple-600">Professional Services</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductGrid;