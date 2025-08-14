import React, { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CheckoutStepper from '@/components/molecules/CheckoutStepper';
import OrderSummary from '@/components/molecules/OrderSummary';
import UserDetailsForm from '@/components/molecules/UserDetailsForm';
import OrderConfirmation from '@/components/molecules/OrderConfirmation';
import PaymentForm from '@/components/organisms/PaymentForm';
import usePaymentStore, { CheckoutStep } from '@/stores/usePaymentStore';
import useCartStore from '@/stores/useCartStore';
import useOrderStore from '@/stores/useOrderStore';
import { AlertTriangle } from 'lucide-react';

interface CheckoutFormProps {
  onOrderComplete?: (orderId: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onOrderComplete }) => {
  const {
    currentStep,
    setStep,
    customerDetails,
    serviceRequirements,
    isProcessing,
    error,
    setError,
    orderId
  } = usePaymentStore();

  const {
    items,
    total,
    subtotal,
    gst,
    promoCode,
    promoDiscount,
    clearCart
  } = useCartStore();

  const { createOrder, setCurrentOrder } = useOrderStore();

  // Process free services automatically
  const processFreeServices = async () => {
    try {
      const newOrderId = await createOrder({
        userId: undefined, // Will be set if user is authenticated
        customerEmail: customerDetails.email,
        customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
        items,
        status: 'paid', // Free services are automatically "paid"
        serviceRequirements,
        total: 0,
        subtotal: subtotal || 0,
        gst: gst || 0,
        promoCode,
        promoDiscount,
        paymentMethod: 'free'
      });

      if (onOrderComplete) {
        onOrderComplete(newOrderId);
      }

      // Clear cart after successful free order
      clearCart();
      setStep(CheckoutStep.CONFIRMATION);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process free services');
    }
  };

  // Handle paid service checkout
  const processPaidServices = async () => {
    try {
      const newOrderId = await createOrder({
        userId: undefined, // Will be set if user is authenticated
        customerEmail: customerDetails.email,
        customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
        items,
        status: 'pending', // Will be updated when payment succeeds
        serviceRequirements,
        total,
        subtotal: subtotal || 0,
        gst: gst || 0,
        promoCode,
        promoDiscount
      });

      if (onOrderComplete) {
        onOrderComplete(newOrderId);
      }

      setStep(CheckoutStep.PAYMENT);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create order');
    }
  };

  // Handle step navigation
  const handleStepNavigation = {
    [CheckoutStep.CART_REVIEW]: () => {
      if (total === 0) {
        // Skip to user details for free services
        setStep(CheckoutStep.USER_DETAILS);
      } else {
        setStep(CheckoutStep.USER_DETAILS);
      }
    },

    [CheckoutStep.USER_DETAILS]: () => {
      if (total === 0) {
        // Process free services immediately
        processFreeServices();
      } else {
        // Continue to payment for paid services
        processPaidServices();
      }
    },

    [CheckoutStep.PAYMENT]: () => {
      // Payment completion will be handled by the PaymentForm component
      // This will trigger the confirmation step
      clearCart();
      setStep(CheckoutStep.CONFIRMATION);
    },

    [CheckoutStep.CONFIRMATION]: () => {
      // End of flow - handled by OrderConfirmation component
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case CheckoutStep.USER_DETAILS:
        setStep(CheckoutStep.CART_REVIEW);
        break;
      case CheckoutStep.PAYMENT:
        setStep(CheckoutStep.USER_DETAILS);
        break;
      default:
        break;
    }
  };

  // Render the appropriate step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case CheckoutStep.CART_REVIEW:
        return (
          <OrderSummary
            items={items}
            total={total}
            subtotal={subtotal}
            gst={gst}
            promoCode={promoCode}
            promoDiscount={promoDiscount}
            onNext={handleStepNavigation[CheckoutStep.CART_REVIEW]}
            showEditCart={true}
          />
        );

      case CheckoutStep.USER_DETAILS:
        return (
          <UserDetailsForm
            onNext={handleStepNavigation[CheckoutStep.USER_DETAILS]}
            onBack={handleBack}
          />
        );

      case CheckoutStep.PAYMENT:
        return (
          <div className="w-full max-w-2xl mx-auto">
            <PaymentForm
              selectedPackage={{ price: total, currency: 'AUD' }}
              onPaymentSuccess={() => handleStepNavigation[CheckoutStep.PAYMENT]()}
              onPaymentError={(error) => setError(error)}
            />
          </div>
        );

      case CheckoutStep.CONFIRMATION:
        return (
          <OrderConfirmation
            onNewOrder={() => {
              // Reset the checkout flow for a new order
              setStep(CheckoutStep.CART_REVIEW);
              setError(null);
            }}
          />
        );

      default:
        return null;
    }
  };

  // Validate cart before starting checkout
  if (items.length === 0 && currentStep !== CheckoutStep.CONFIRMATION) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your cart is empty. Please add some services before proceeding to checkout.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Progress Stepper - Hide on confirmation step for cleaner look */}
      {currentStep !== CheckoutStep.CONFIRMATION && (
        <CheckoutStepper currentStep={currentStep} />
      )}

      {/* Global Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Alert>
          <AlertDescription>
            Processing your order... Please do not close this page.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Step Component */}
      {renderCurrentStep()}
    </div>
  );
};

export default CheckoutForm;