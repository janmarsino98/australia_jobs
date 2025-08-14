import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Product } from '../../types/store';
import PriceTag from '../atoms/PriceTag';
import ServiceBadge from '../atoms/ServiceBadge';
import DeliveryTime from '../atoms/DeliveryTime';

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

  return (
    <Card className={`rounded-lg border bg-card shadow-sm hover:shadow-lg transition-shadow duration-200 ${featured ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${className}`}>
      <CardHeader className="flex flex-col space-y-1.5 p-6">
        <div className="flex justify-between items-start">
          <ServiceBadge type={product.category} />
          <PriceTag 
            amount={product.price} 
            currency={product.currency}
            strikethrough={product.originalPrice}
            savings={showSavings ? product.savings : undefined}
          />
        </div>
        <CardTitle className="text-2xl font-semibold text-main-text">
          {product.name}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {product.shortDescription}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <ul className="space-y-2 text-sm mb-4">
          {product.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-500 mr-2 mt-0.5">✓</span>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        
        <DeliveryTime time={product.deliveryTime} className="mt-4" />
        
        {featured && (
          <div className="mt-3 p-2 bg-blue-50 rounded-md">
            <span className="text-xs text-blue-700 font-medium">⭐ Featured Service</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2 p-6 pt-0">
        <Button 
          variant="default" 
          className="w-full" 
          onClick={handleAddToCart}
          disabled={!product.active}
        >
          {product.price === 0 ? 'Get Free Review' : 'Add to Cart'}
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
      </CardFooter>
    </Card>
  );
};

export default ProductCard;