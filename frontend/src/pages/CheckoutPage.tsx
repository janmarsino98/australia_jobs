import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from '@/components/organisms/CheckoutForm';
import useCartStore from '@/stores/useCartStore';
import usePaymentStore from '@/stores/usePaymentStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total } = useCartStore();
  const { resetCheckout } = usePaymentStore();

  // Reset checkout state when component mounts
  useEffect(() => {
    resetCheckout();
  }, [resetCheckout]);

  // Redirect to store if cart is empty (except when coming from direct link)
  const handleBackToStore = () => {
    navigate('/store');
  };

  const handleOrderComplete = (orderId: string) => {
    // Optional: Track analytics, send notifications, etc.
    console.log('Order completed:', orderId);
    
    // You could also redirect to a dedicated order confirmation page
    // navigate(`/order-confirmation/${orderId}`);
  };

  // Show empty cart message if no items (but allow checkout process to handle this)
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToStore}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Button>
            <h1 className="text-3xl font-bold">Checkout</h1>
          </div>
          
          {!isEmpty && (
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">
                    {items.length} item{items.length !== 1 ? 's' : ''} in cart
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  {total === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `AU$${total.toFixed(2)}`
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Form */}
        <CheckoutForm onOrderComplete={handleOrderComplete} />

        {/* Additional Information */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">🔒 Secure Checkout</h3>
              <p className="text-sm text-gray-600">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">⚡ Fast Delivery</h3>
              <p className="text-sm text-gray-600">
                AI services are delivered instantly. Professional services start within 24 hours.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">💬 Expert Support</h3>
              <p className="text-sm text-gray-600">
                Need help? Our career experts are available to assist you throughout the process.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              By proceeding with your order, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;