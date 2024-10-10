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
const PaymentForm = (selectedPackage) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await httpClient.post(
          "http://localhost:5000/cities/create-payment-intent",
          {
            price_id: "price_1HgqICF5ZyVexXXXXXX",
            price: selectedPackage.selectedPackage.price,
          }
        );
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error("Error fetching: ", error);
      }
    };
    createPaymentIntent();
  }, []);
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.log("Stripe was not loaded");
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    const cardExpiryElement = elements.getElement(CardExpiryElement);
    const cardCvcElement = elements.getElement(CardCvcElement);

    if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
      console.error(
        "Los elementos de la tarjeta no se han cargado correctamente."
      );
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardNumberElement,
        },
      }
    );

    if (error) {
      console.error("Error:", error);
    } else if (paymentIntent.status === "succeeded") {
      navigate("/main");
      console.log("Pago exitoso!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Número de tarjeta</label>
      <CardNumberElement />

      <label>Fecha de expiración</label>
      <CardExpiryElement />

      <label>CVC</label>
      <CardCvcElement />

      <button type="submit" disabled={!stripe}>
        Pagar
      </button>
    </form>
  );
};

export default PaymentForm;
