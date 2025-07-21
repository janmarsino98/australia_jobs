import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "@/components/organisms/PaymentForm";
import { useLocation } from "react-router-dom";

interface LocationState {
  selectedPackage?: any;
}

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

const PayingPage: React.FC = () => {
  const location = useLocation();
  const selectedPackage = (location.state as LocationState)?.selectedPackage;

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm selectedPackage={selectedPackage} />
    </Elements>
  );
};

export default PayingPage;