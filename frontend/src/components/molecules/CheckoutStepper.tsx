import { CheckoutStep } from '@/stores/usePaymentStore';
import { cn } from '@/lib/utils';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
}

const steps = [
  {
    id: CheckoutStep.CART_REVIEW,
    name: 'Review Cart',
    description: 'Review your selected services'
  },
  {
    id: CheckoutStep.USER_DETAILS,
    name: 'Your Details',
    description: 'Provide your information'
  },
  {
    id: CheckoutStep.PAYMENT,
    name: 'Payment',
    description: 'Complete your purchase'
  },
  {
    id: CheckoutStep.CONFIRMATION,
    name: 'Confirmation',
    description: 'Order confirmed'
  }
];

const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep }) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 sm:text-base">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <li 
              key={step.id}
              className={cn(
                "flex md:w-full items-center",
                index < steps.length - 1 && "sm:after:content-[''] sm:after:w-full sm:after:h-1 sm:after:border-b sm:after:border-gray-200 sm:after:border-1 sm:after:hidden sm:after:mx-6 xl:after:mx-10"
              )}
            >
              <span className="flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200">
                <span 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full shrink-0 border-2 mr-3",
                    isCompleted && "bg-green-100 border-green-500",
                    isActive && "bg-blue-100 border-blue-500",
                    isUpcoming && "bg-gray-100 border-gray-300"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5.917L5.724 10.5 15 1.5"/>
                    </svg>
                  ) : (
                    <span 
                      className={cn(
                        "text-sm font-medium",
                        isActive && "text-blue-600",
                        isCompleted && "text-green-600",
                        isUpcoming && "text-gray-500"
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </span>
                <div className="flex flex-col text-left">
                  <span 
                    className={cn(
                      "font-medium",
                      isActive && "text-blue-600",
                      isCompleted && "text-green-600",
                      isUpcoming && "text-gray-500"
                    )}
                  >
                    {step.name}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {step.description}
                  </span>
                </div>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default CheckoutStepper;