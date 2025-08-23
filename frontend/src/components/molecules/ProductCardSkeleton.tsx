import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-lg p-6 border border-navbar-border animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 mb-4">
        <div className="h-6 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
      
      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/6"></div>
      </div>
      
      {/* Features */}
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-muted rounded w-4/5"></div>
        <div className="h-3 bg-muted rounded w-3/4"></div>
        <div className="h-3 bg-muted rounded w-5/6"></div>
      </div>
      
      {/* Price and Button */}
      <div className="flex items-center justify-between pt-4 border-t border-navbar-border">
        <div className="h-6 bg-muted rounded w-20"></div>
        <div className="h-10 bg-muted rounded w-24"></div>
      </div>
    </div>
  );
};

const ProductGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export { ProductCardSkeleton, ProductGridSkeleton };