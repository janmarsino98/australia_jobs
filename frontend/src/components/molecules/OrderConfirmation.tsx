import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import useOrderStore from '@/stores/useOrderStore';
import usePaymentStore from '@/stores/usePaymentStore';
import useCartStore from '@/stores/useCartStore';
import { CheckCircle, Download, Mail, Clock } from 'lucide-react';

interface OrderConfirmationProps {
  onNewOrder?: () => void;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ onNewOrder }) => {
  const navigate = useNavigate();
  const { currentOrder } = useOrderStore();
  const { customerDetails } = usePaymentStore();
  const { clearCart } = useCartStore();

  if (!currentOrder) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No order found</p>
          <Button onClick={() => navigate('/store')} className="mt-4">
            Browse Services
          </Button>
        </CardContent>
      </Card>
    );
  }

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

  const hasAIServices = currentOrder.items.some(item => item.category === 'ai-service');
  const hasProfessionalServices = currentOrder.items.some(item => item.category === 'professional-service');
  const isFreeOrder = currentOrder.total === 0;

  const handleContinueShopping = () => {
    if (onNewOrder) {
      onNewOrder();
    } else {
      clearCart();
      navigate('/store');
    }
  };

  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Order Confirmed!
            </h2>
            <p className="text-green-700">
              {isFreeOrder 
                ? "Your free services are being processed"
                : "Thank you for your purchase"
              }
            </p>
            <p className="text-sm text-green-600 mt-2">
              Order ID: <span className="font-mono font-medium">{currentOrder.id}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Order Details</CardTitle>
          <p className="text-sm text-gray-600">
            Ordered on {new Date(currentOrder.createdAt).toLocaleDateString('en-AU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Customer Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{customerDetails.firstName} {customerDetails.lastName}</p>
              <p>{customerDetails.email}</p>
              {customerDetails.phone && <p>{customerDetails.phone}</p>}
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h4 className="font-medium mb-3">Services Ordered</h4>
            <div className="space-y-3">
              {currentOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant={getCategoryBadgeVariant(item.category)}>
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Delivery: {item.deliveryTime}
                      {item.quantity > 1 && ` • Quantity: ${item.quantity}`}
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    {item.price === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatPrice(item.price * item.quantity)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total Paid:</span>
            <span>
              {isFreeOrder ? (
                <span className="text-green-600">FREE</span>
              ) : (
                formatPrice(currentOrder.total)
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">What's Next?</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {hasAIServices && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>AI Services:</strong> Your AI-powered resume review and analysis are being processed. 
                Results will be available in your dashboard within minutes.
              </AlertDescription>
            </Alert>
          )}

          {hasProfessionalServices && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Professional Services:</strong> Our experts will contact you within 24 hours 
                to discuss your requirements and timeline.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Order Confirmation Email</h4>
                <p className="text-sm text-blue-700 mt-1">
                  A detailed confirmation has been sent to {customerDetails.email}. 
                  Please check your inbox and spam folder.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleViewDashboard}
            className="w-full sm:w-auto"
          >
            View Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={handleContinueShopping}
            className="w-full sm:w-auto"
          >
            Browse More Services
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderConfirmation;