import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "@/components/organisms/PaymentForm";
import { useLocation } from "react-router-dom";

const stripePromise = loadStripe(
  "pk_test_51Q83DKRvr2lf43PuJR556iThRHALo7GR2D9u10UjySLbgwU0fXp4BC6TZxn4FbSasQXTp7ugVHG1YlRfCHz4FBCa00OYaf2HLG"
);

const PayingPage = () => {
  const location = useLocation();
  const selectedPackage = location.state?.selectedPackage;

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm selectedPackage={selectedPackage} />
    </Elements>
  );
};

export default PayingPage;
