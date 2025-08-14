import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import httpClient from "@/httpClient";
import { useNavigate } from "react-router-dom";
import { useZodForm } from "@/hooks/useZodForm";
import { paymentFormSchema } from "@/lib/validations/forms";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentFormProps {
  selectedPackage: any;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

const PaymentForm = ({ selectedPackage, onPaymentSuccess, onPaymentError }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState("");
  const navigate = useNavigate();

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useZodForm({
    schema: paymentFormSchema,
  });

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await httpClient.post(
          "/cities/create-payment-intent",
          {
            price_id: "price_1HgqICF5ZyVexXXXXXX",
            price: selectedPackage.price,
          }
        );
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        setError("root", {
          message: "Failed to initialize payment. Please try again.",
        });
      }
    };
    createPaymentIntent();
  }, [selectedPackage.price, setError]);

  const onSubmit = async () => {
    if (!stripe || !elements) {
      setError("root", {
        message: "Payment system is not ready. Please try again.",
      });
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    const cardExpiryElement = elements.getElement(CardExpiryElement);
    const cardCvcElement = elements.getElement(CardCvcElement);

    if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
      setError("root", {
        message: "Card elements are not properly loaded.",
      });
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
          },
        }
      );

      if (error) {
        const errorMessage = error.message || "Payment failed. Please try again.";
        setError("root", {
          message: errorMessage,
        });
        if (onPaymentError) {
          onPaymentError(errorMessage);
        }
      } else if (paymentIntent.status === "succeeded") {
        if (onPaymentSuccess) {
          onPaymentSuccess();
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError("root", {
        message: errorMessage,
      });
      if (onPaymentError) {
        onPaymentError(errorMessage);
      }
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    aria: {
      label: "Credit or debit card",
    },
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="max-w-md mx-auto p-6 space-y-6"
      aria-label="Payment form"
    >
      {errors.root && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label 
            htmlFor="card-number" 
            className="text-sm font-medium"
            id="card-number-label"
          >
            Card Number
          </label>
          <div 
            id="card-number"
            role="group"
            aria-labelledby="card-number-label"
            className="p-3 border rounded-md focus-within:ring-2 focus-within:ring-blue-500"
            tabIndex={0}
          >
            <CardNumberElement 
              options={cardElementOptions}
              aria-label="Card number"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label 
            htmlFor="card-expiry" 
            className="text-sm font-medium"
            id="card-expiry-label"
          >
            Expiration Date
          </label>
          <div 
            id="card-expiry"
            role="group"
            aria-labelledby="card-expiry-label"
            className="p-3 border rounded-md focus-within:ring-2 focus-within:ring-blue-500"
            tabIndex={0}
          >
            <CardExpiryElement 
              options={cardElementOptions}
              aria-label="Card expiration date"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label 
            htmlFor="card-cvc" 
            className="text-sm font-medium"
            id="card-cvc-label"
          >
            Security Code (CVC)
          </label>
          <div 
            id="card-cvc"
            role="group"
            aria-labelledby="card-cvc-label"
            className="p-3 border rounded-md focus-within:ring-2 focus-within:ring-blue-500"
            tabIndex={0}
          >
            <CardCvcElement 
              options={cardElementOptions}
              aria-label="Card security code"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || !stripe}
          aria-label="Complete payment"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
