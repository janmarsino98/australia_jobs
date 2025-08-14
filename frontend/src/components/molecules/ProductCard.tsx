import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Product } from '../../types/store';
import PriceTag from '../atoms/PriceTag';
import { CheckCircle, Clock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onCompare?: (product: Product) => void;
  featured?: boolean;
  showSavings?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onCompare,
  featured = false,
  showSavings = true,
  className = '',
}) => {
  const handleAddToCart = () => {
    onAddToCart(product);
  };

  const handleCompare = () => {
    if (onCompare) {
      onCompare(product);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai-service': return '🤖';
      case 'professional-service': return '👨‍💼';
      case 'package': return '📦';
      default: return '🎯';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ai-service': return 'AI Powered';
      case 'professional-service': return 'Professional';
      case 'package': return 'Package Deal';
      default: return 'Service';
    }
  };

  return (
    <Card className={`h-full flex flex-col rounded-lg border bg-card shadow-sm hover:shadow-lg transition-all duration-200 group ${featured ? 'ring-2 ring-pill-text ring-offset-2' : ''} ${className}`}>
      <CardHeader className="p-6 space-y-1.5 flex-shrink-0">
        {/* Service badge with brand colors */}
        <div className="flex justify-between items-start mb-3">
          <div className="bg-pill-bg text-pill-text px-[20px] py-[10px] rounded-full text-xs font-medium">
            {getCategoryIcon(product.category)} {getCategoryLabel(product.category)}
          </div>
          <PriceTag 
            amount={product.price} 
            currency={product.currency}
            strikethrough={product.originalPrice}
            savings={showSavings ? product.savings : undefined}
          />
        </div>
        
        {/* Enhanced title with better typography */}
        <CardTitle className="text-2xl font-semibold text-main-text group-hover:text-pill-text transition-colors">
          {product.name}
        </CardTitle>
        
        {/* Improved description with proper text color */}
        <CardDescription className="text-[16px] text-searchbar-text mt-[12px]">
          {product.shortDescription}
        </CardDescription>
      </CardHeader>
      
      {/* Enhanced content section - flexible to fill available space */}
      <CardContent className="p-6 pt-0 flex-grow flex flex-col">
        {/* Custom feature list design */}
        <div className="space-y-2 mb-6 flex-grow">
          {product.features.map((feature, index) => (
            <div key={index} className="flex items-start my-[12px]">
              <div className="bg-green-100 rounded-full w-5 h-5 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                <CheckCircle className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-[16px] text-main-text">{feature}</span>
            </div>
          ))}
        </div>
        
        {/* Delivery time with brand styling */}
        <div className="flex items-center bg-dark-white px-[16px] py-[12px] rounded-lg mt-auto">
          <Clock className="w-5 h-5 text-searchbar-text mr-2" />
          <span className="text-[16px] text-searchbar-text">{product.deliveryTime}</span>
        </div>

        {featured && (
          <div className="mt-3 p-2 bg-pill-bg rounded-md">
            <span className="text-xs text-pill-text font-medium">⭐ Featured Service</span>
          </div>
        )}
      </CardContent>
      
      {/* Enhanced footer - fixed at bottom */}
      <CardFooter className="p-6 pt-0 flex-shrink-0">
        <div className="w-full space-y-2">
          <Button 
            className="w-full h-[48px] text-[16px] font-semibold" 
            onClick={handleAddToCart}
            disabled={!product.active}
          >
            {product.price === 0 ? '🎯 Get Free Analysis' : '🛒 Add to Cart'}
          </Button>
          
          {onCompare && (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full" 
              onClick={handleCompare}
            >
              Compare Services
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;