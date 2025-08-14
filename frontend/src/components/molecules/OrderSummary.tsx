import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CartItem } from '@/types/store';
import useCartStore from '@/stores/useCartStore';

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
  subtotal?: number;
  gst?: number;
  promoCode?: string;
  promoDiscount?: number;
  onNext: () => void;
  onBack?: () => void;
  showEditCart?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  total,
  subtotal,
  gst,
  promoCode,
  promoDiscount,
  onNext,
  onBack,
  showEditCart = true
}) => {
  const { toggleCart } = useCartStore();

  const formatPrice = (price: number): string => {
    return `AU$${price.toFixed(2)}`;
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'ai-service':
        return 'AI Service';
      case 'professional-service':
        return 'Professional Service';
      case 'package':
        return 'Package Deal';
      default:
        return category;
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'ai-service':
        return 'secondary';
      case 'professional-service':
        return 'default';
      case 'package':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const hasAnyFreeServices = items.some(item => item.price === 0);
  const totalDiscountAmount = subtotal && promoDiscount ? subtotal * promoDiscount : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-semibold">Order Summary</CardTitle>
          {showEditCart && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCart}
            >
              Edit Cart
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Review your selected services before proceeding
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Your cart is empty</p>
            <Button
              variant="outline"
              onClick={toggleCart}
              className="mt-4"
            >
              Browse Services
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant={getCategoryBadgeVariant(item.category)}>
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Delivery: {item.deliveryTime}</span>
                      {item.quantity > 1 && (
                        <span>Quantity: {item.quantity}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {item.price === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        formatPrice(item.price * item.quantity)
                      )}
                    </p>
                    {item.quantity > 1 && item.price > 0 && (
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.price)} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-gray-200" />

            <div className="space-y-2">
              {subtotal !== undefined && (
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              )}
              
              {promoCode && totalDiscountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({promoCode}):</span>
                  <span>-{formatPrice(totalDiscountAmount)}</span>
                </div>
              )}

              {gst !== undefined && gst > 0 && (
                <div className="flex justify-between text-sm">
                  <span>GST (10%):</span>
                  <span>{formatPrice(gst)}</span>
                </div>
              )}

              <hr className="border-gray-200" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>
                  {total === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatPrice(total)
                  )}
                </span>
              </div>
            </div>

            {hasAnyFreeServices && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  🎉 This order includes free services! No payment required for free services.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
          >
            Back
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={items.length === 0}
          className="ml-auto"
        >
          {total === 0 ? 'Process Free Services' : 'Continue to Details'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrderSummary;